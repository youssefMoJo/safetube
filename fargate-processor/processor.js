import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from "@aws-sdk/client-sqs";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";

const execAsync = promisify(exec);

const REGION = process.env.AWS_REGION;
const QUEUE_URL = process.env.SQS_QUEUE_URL;
const BUCKET_NAME = process.env.S3_BUCKET_NAME;

const sqs = new SQSClient({ region: REGION });
const s3 = new S3Client({ region: REGION });

const pollSQS = async () => {
  console.log("Polling SQS...");

  const command = new ReceiveMessageCommand({
    QueueUrl: QUEUE_URL,
    MaxNumberOfMessages: 1,
    WaitTimeSeconds: 20,
  });

  const response = await sqs.send(command);
  const messages = response.Messages || [];

  for (const msg of messages) {
    const body = JSON.parse(msg.Body);
    const { youtube_link, video_id } = body;

    console.log(`Processing video: ${youtube_link}`);

    const outputFile = `${video_id}.mp4`;

    try {
      const { youtube_link, video_id } = JSON.parse(msg.Body);
      const outputFile = `${video_id}.mp4`;

      await downloadVideoWithAudio(youtube_link, outputFile);
      await uploadToS3(outputFile, BUCKET_NAME, outputFile);
      deleteFile(outputFile);
      await deleteMessageFromQueue(msg.ReceiptHandle);
    } catch (error) {
      console.error("Failed to process video:", error);
    }
  }
};

const downloadVideoWithAudio = async (youtubeLink, outputFile) => {
  const { stdout } = await execAsync(`yt-dlp -j ${youtubeLink}`);
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
    .filter((f) => f.vcodec !== "none")
    .sort((a, b) => (b.tbr || 0) - (a.tbr || 0))[0];

  const bestAudio = formats
    .filter(
      (f) =>
        f.vcodec === "none" &&
        f.acodec !== "none" &&
        f.protocol !== "m3u8" &&
        f.ext !== "webm"
    )
    .sort((a, b) => (b.abr || b.tbr || 0) - (a.abr || a.tbr || 0))[0];

  if (!bestVideo || !bestAudio) {
    throw new Error("No suitable video/audio format found.");
  }

  console.log(
    `Selected formats - Video: ${bestVideo.id}, Audio: ${bestAudio.id}`
  );

  const formatSelection = `${bestVideo.id}+${bestAudio.id}`;
  await execAsync(
    `yt-dlp -f ${formatSelection} -o ${outputFile} ${youtubeLink}`
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

const deleteMessageFromQueue = async (receiptHandle) => {
  await sqs.send(
    new DeleteMessageCommand({
      QueueUrl: QUEUE_URL,
      ReceiptHandle: receiptHandle,
    })
  );
  console.log("Deleted message from SQS");
};

await pollSQS();
