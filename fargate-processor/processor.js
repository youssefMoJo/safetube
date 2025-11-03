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
async function updateVideoStatus(
  videoId,
  status,
  errorMessage = null,
  retryCount = null
) {
  if (!DYNAMO_VIDEOS_TABLE || !videoId) return;
  let updateExpression = "";
  let expressionAttributeNames = {
    "#s": "status",
  };
  let expressionAttributeValues = {
    ":s": { S: status },
  };

  if (errorMessage) {
    updateExpression = "SET #s = :s, #err = :e, #rc = :rc, #lf = :lf";
    expressionAttributeNames["#err"] = "error";
    expressionAttributeNames["#rc"] = "retry_count";
    expressionAttributeNames["#lf"] = "last_failed_at";
    expressionAttributeValues[":e"] = { S: errorMessage };
    expressionAttributeValues[":rc"] = {
      N: retryCount !== null ? retryCount.toString() : "0",
    };
    expressionAttributeValues[":lf"] = { S: new Date().toISOString() };
  } else {
    updateExpression = "SET #s = :s REMOVE #err, #rc, #lf";
    expressionAttributeNames["#err"] = "error";
    expressionAttributeNames["#rc"] = "retry_count";
    expressionAttributeNames["#lf"] = "last_failed_at";
  }

  const params = {
    TableName: DYNAMO_VIDEOS_TABLE,
    Key: { video_id: { S: videoId } },
    UpdateExpression: updateExpression,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
  };

  try {
    await dynamo.send(new UpdateItemCommand(params));
  } catch (err) {
    console.error("Failed to update DynamoDB status:", err);
  }
}

const downloadVideoWithAudio = async (youtubeLink, outputFile) => {
  const cleanLink = youtubeLink.split("&")[0];

  try {
    await execAsync(
      `yt-dlp --cookies /app/cookies.txt -x --audio-format mp3 -o ${outputFile} "${cleanLink}"`
    );
  } catch (err) {
    console.error("yt-dlp audio download failed:", err);
    throw new Error("yt-dlp audio download failed: " + err.message);
  }

  console.log(`Downloaded audio to ${outputFile}`);
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
      "Missing required environment variables.",
      RETRY_COUNT
    );
    process.exit(1);
  }

  const youtubeId = extractYouTubeID(YOUTUBE_LINK);
  if (!youtubeId) {
    console.error("Failed to extract YouTube ID from link:", YOUTUBE_LINK);
    await updateVideoStatus(
      VIDEO_ID,
      "failed",
      "Failed to extract YouTube ID from link",
      RETRY_COUNT
    );
    process.exit(1);
  }

  const outputFile = `${youtubeId}.mp3`;
  const s3Key = `audio/by_youtube_id/${youtubeId}.mp3`;

  // Set status to processing
  await updateVideoStatus(VIDEO_ID, "processing", null, RETRY_COUNT);

  try {
    await downloadVideoWithAudio(YOUTUBE_LINK, outputFile);
    await uploadToS3(outputFile, BUCKET_NAME, s3Key);
    deleteFile(outputFile);

    console.log("Audio processing complete.");
    await updateVideoStatus(VIDEO_ID, "done", null, RETRY_COUNT);
    process.exit(0);
  } catch (error) {
    console.error("Error during processing:", error);
    try {
      await updateVideoStatus(
        VIDEO_ID,
        "failed",
        error?.message ? String(error.message) : "Unknown error",
        RETRY_COUNT
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
        await updateVideoStatus(VIDEO_ID, "retrying", null, currentRetry + 1);
      } else {
        console.log(
          `Max retries reached for ${VIDEO_ID}. Sending to DLQ and marking as permanently failed.`
        );
        try {
          const dlqParams = {
            QueueUrl: process.env.VIDEO_DLQ_URL,
            MessageBody: JSON.stringify({
              video_id: VIDEO_ID,
              youtube_link: YOUTUBE_LINK,
              dynamo_videos_table: DYNAMO_VIDEOS_TABLE,
              final_status: "failed_permanent",
            }),
          };
          await sqs.send(new SendMessageCommand(dlqParams));
          console.log(`Sent ${VIDEO_ID} to DLQ.`);
        } catch (dlqError) {
          console.error("Failed to send to DLQ:", dlqError);
        }

        await updateVideoStatus(
          VIDEO_ID,
          "failed_permanent",
          null,
          RETRY_COUNT
        );
      }
    } catch (requeueError) {
      console.error("Failed to requeue message:", requeueError);
    }
    process.exit(1);
  }
};

await main();
