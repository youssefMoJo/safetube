import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";

const execAsync = promisify(exec);

const REGION = process.env.AWS_REGION;
const BUCKET_NAME = process.env.S3_BUCKET_NAME;
const VIDEO_ID = process.env.VIDEO_ID;
const YOUTUBE_LINK = process.env.YOUTUBE_LINK;

const s3 = new S3Client({ region: REGION });

const downloadVideoWithAudio = async (youtubeLink, outputFile) => {
  const cleanLink = youtubeLink.split("&")[0];
  const { stdout } = await execAsync(
    `yt-dlp --cookies /app/cookies.txt -j "${cleanLink}"`
  );

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

  await execAsync(
    `yt-dlp --cookies /app/cookies.txt --merge-output-format mp4 -f ${formatSelection} -o ${outputFile} "${safeLink}"`
  );

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
    process.exit(1);
  }

  const youtubeId = extractYouTubeID(YOUTUBE_LINK);
  if (!youtubeId) {
    console.error("Failed to extract YouTube ID from link:", YOUTUBE_LINK);
    process.exit(1);
  }

  const outputFile = `${youtubeId}.mp4`;

  try {
    await downloadVideoWithAudio(YOUTUBE_LINK, outputFile);
    await uploadToS3(outputFile, BUCKET_NAME, outputFile);
    deleteFile(outputFile);

    console.log("Video processing complete.");
    process.exit(0);
  } catch (error) {
    console.error("Error during processing:", error);
    process.exit(1);
  }
};

await main();
