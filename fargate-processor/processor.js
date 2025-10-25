import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

const execAsync = promisify(exec);

const REGION = process.env.AWS_REGION;
const BUCKET_NAME = process.env.S3_BUCKET_NAME;
const VIDEO_ID = process.env.VIDEO_ID;
const YOUTUBE_LINK = process.env.YOUTUBE_LINK;
const DYNAMO_VIDEOS_TABLE = process.env.DYNAMO_VIDEOS_TABLE;
const RETRY_COUNT = parseInt(process.env.RETRY_COUNT || "0", 10);
const MAX_RETRIES = 1;

const s3 = new S3Client({ region: REGION });
const dynamo = new DynamoDBClient({ region: REGION });
// Helper to update DynamoDB status
async function updateVideoStatus(videoId, status, errorMessage = null) {
  if (!DYNAMO_VIDEOS_TABLE || !videoId) return;
  const params = {
    TableName: DYNAMO_VIDEOS_TABLE,
    Key: { video_id: { S: videoId } },
    UpdateExpression: errorMessage
      ? "SET #s = :s, #err = :e"
      : "SET #s = :s REMOVE #err",
    ExpressionAttributeNames: {
      "#s": "status",
      "#err": "error",
    },
    ExpressionAttributeValues: {
      ":s": { S: status },
    },
  };
  if (errorMessage) {
    params.ExpressionAttributeValues[":e"] = { S: errorMessage };
  }
  try {
    await dynamo.send(new UpdateItemCommand(params));
  } catch (err) {
    console.error("Failed to update DynamoDB status:", err);
  }
}

const downloadVideoWithAudio = async (youtubeLink, outputFile) => {
  const cleanLink = youtubeLink.split("&")[0];
  let stdout;
  try {
    ({ stdout } = await execAsync(
      `yt-dlp --cookies /app/cookies.txt -j "${cleanLink}"`
    ));
  } catch (err) {
    console.error("yt-dlp JSON info extraction failed:", err);
    throw new Error("yt-dlp JSON info extraction failed: " + err.message);
  }

  const jsonData = JSON.parse(stdout);

  const formats = jsonData.formats.map((format) => ({
    id: format.format_id,
    resolution: format.height ? `${format.height}p` : "audio",
    vcodec: format.vcodec,
    acodec: format.acodec,
    ext: format.ext,
    tbr: format.tbr,
    filesize: format.filesize,
    format_note: format.format_note || "",
    fps: format.fps || null,
    url: format.url,
    abr: format.abr || null,
    protocol: format.protocol || "",
  }));

  const bestVideo = formats
    .filter(
      (f) =>
        f.vcodec !== "none" &&
        f.ext === "mp4" &&
        !f.format_note.includes("webm")
    )
    .sort((a, b) => (b.tbr || 0) - (a.tbr || 0))[0];

  const bestAudio = formats
    .filter(
      (f) => f.vcodec === "none" && f.acodec !== "none" && f.ext === "m4a"
    )
    .sort((a, b) => (b.abr || b.tbr || 0) - (a.abr || a.tbr || 0))[0];

  if (!bestVideo || !bestAudio) {
    throw new Error("No suitable video/audio format found.");
  }

  console.log(
    `Selected formats - Video: ${bestVideo.id}, Audio: ${bestAudio.id}`
  );

  const formatSelection = `${bestVideo.id}+${bestAudio.id}`;
  const safeLink = youtubeLink.split("&")[0];

  try {
    await execAsync(
      `yt-dlp --cookies /app/cookies.txt --merge-output-format mp4 -f ${formatSelection} -o ${outputFile} "${safeLink}"`
    );
  } catch (err) {
    console.error("yt-dlp download failed:", err);
    throw new Error("yt-dlp download failed: " + err.message);
  }

  console.log(`Downloaded video to ${outputFile}`);
};

const uploadToS3 = async (filePath, bucket, key) => {
  const fileContent = fs.readFileSync(filePath);
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: fileContent,
    })
  );
  console.log(`Uploaded ${key} to S3`);
};

const deleteFile = (filePath) => {
  fs.unlinkSync(filePath);
  console.log(`Deleted local file: ${filePath}`);
};

function extractYouTubeID(url) {
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.hostname === "youtu.be") {
      return parsedUrl.pathname.slice(1);
    } else if (parsedUrl.hostname.includes("youtube.com")) {
      return parsedUrl.searchParams.get("v");
    }
  } catch (error) {
    console.error("Invalid URL format:", url);
  }
  return null;
}

const main = async () => {
  if (!VIDEO_ID || !YOUTUBE_LINK || !BUCKET_NAME) {
    console.error("Missing required environment variables.");
    await updateVideoStatus(
      VIDEO_ID,
      "failed",
      "Missing required environment variables."
    );
    process.exit(1);
  }

  const youtubeId = extractYouTubeID(YOUTUBE_LINK);
  if (!youtubeId) {
    console.error("Failed to extract YouTube ID from link:", YOUTUBE_LINK);
    await updateVideoStatus(
      VIDEO_ID,
      "failed",
      "Failed to extract YouTube ID from link"
    );
    process.exit(1);
  }

  const outputFile = `${youtubeId}.mp4`;
  const s3Key = `videos/by_youtube_id/${youtubeId}.mp4`;

  // Set status to processing
  await updateVideoStatus(VIDEO_ID, "processing");

  try {
    await downloadVideoWithAudio(YOUTUBE_LINK, outputFile);
    await uploadToS3(outputFile, BUCKET_NAME, s3Key);
    deleteFile(outputFile);

    console.log("Video processing complete.");
    await updateVideoStatus(VIDEO_ID, "done");
    process.exit(0);
  } catch (error) {
    console.error("Error during processing:", error);
    try {
      await updateVideoStatus(
        VIDEO_ID,
        "failed",
        error?.message ? String(error.message) : "Unknown error"
      );

      const sqs = new SQSClient({ region: REGION });
      const currentRetry = RETRY_COUNT;
      if (currentRetry < MAX_RETRIES) {
        console.log(
          `Retrying video ${VIDEO_ID}, attempt ${
            currentRetry + 1
          }/${MAX_RETRIES}`
        );
        const params = {
          QueueUrl: process.env.SQS_QUEUE_URL,
          MessageBody: JSON.stringify({
            video_id: VIDEO_ID,
            youtube_link: YOUTUBE_LINK,
            dynamo_videos_table: DYNAMO_VIDEOS_TABLE,
            retry_count: currentRetry + 1,
          }),
        };
        await sqs.send(new SendMessageCommand(params));
        await updateVideoStatus(VIDEO_ID, "retrying");
      } else {
        console.log(
          `Max retries reached for ${VIDEO_ID}. Marking as permanently failed.`
        );
        await updateVideoStatus(VIDEO_ID, "failed_permanent");
      }
    } catch (requeueError) {
      console.error("Failed to requeue message:", requeueError);
    }
    process.exit(1);
  }
};

await main();
