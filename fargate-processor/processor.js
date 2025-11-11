import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import {
  DynamoDBClient,
  UpdateItemCommand,
  PutItemCommand,
} from "@aws-sdk/client-dynamodb";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import {
  TranscribeClient,
  StartTranscriptionJobCommand,
  GetTranscriptionJobCommand,
} from "@aws-sdk/client-transcribe";
import path from "path";
import axios from "axios";
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
// Generate AI insights from transcript text using RapidAPI ChatGPT endpoint
// Generate AI insights from transcript text using RapidAPI ChatGPT endpoint
async function generateInsightsFromTranscript(transcriptText) {
  if (!transcriptText || transcriptText.length === 0) return null;

  try {
    const messages = [
      {
        role: "system",
        content:
          "You are an expert knowledge extractor and life coach. Extract the most important insights, lessons, and practical tips from user-provided transcripts.",
      },
      {
        role: "user",
        content: `Here is the transcript of a video:\n\n${transcriptText}\n\nPlease provide a structured JSON output with keys: "lessons" (array), "examples" (array), "tips" (array).`,
      },
    ];

    const response = await axios.post(
      "https://chatgpt-api8.p.rapidapi.com/",
      messages,
      {
        headers: {
          "x-rapidapi-key": RAPIDAPI_KEY,
          "x-rapidapi-host": "chatgpt-api8.p.rapidapi.com",
          "Content-Type": "application/json",
        },
      }
    );

    // Extract the most likely text field from RapidAPI response
    const aiOutput =
      response.data?.text ||
      response.data?.choices?.[0]?.message?.content ||
      response.data?.choices?.[0]?.text ||
      JSON.stringify(response.data);

    // Clean markdown or extra formatting
    let cleaned = aiOutput
      .replace(/```json|```/gi, "")
      .replace(/^\s+|\s+$/g, "")
      .trim();

    // Try parsing as JSON
    try {
      const parsed = JSON.parse(cleaned);
      return parsed;
    } catch (parseErr) {
      console.warn("AI output not valid JSON, returning cleaned text instead.");
      return { raw_text: cleaned };
    }
  } catch (err) {
    console.error("Failed to generate insights from AI:", err);
    return null;
  }
}

// Save insights JSON to DynamoDB under "insights" field
async function saveInsightsToDynamoDB(videoId, insightsJson) {
  if (!DYNAMO_VIDEOS_TABLE || !videoId || !insightsJson) return;

  const params = {
    TableName: DYNAMO_VIDEOS_TABLE,
    Key: { video_id: { S: videoId } },
    UpdateExpression: "SET insights = :i",
    ExpressionAttributeValues: {
      ":i": { S: JSON.stringify(insightsJson) },
    },
  };

  try {
    await dynamo.send(new UpdateItemCommand(params));
    console.log(`Saved AI insights to DynamoDB for video ${videoId}`);
  } catch (err) {
    console.error("Failed to save AI insights to DynamoDB:", err);
  }
}

const execAsync = promisify(exec);

const REGION = process.env.AWS_REGION;
const BUCKET_NAME = process.env.S3_BUCKET_NAME;
const VIDEO_ID = process.env.VIDEO_ID;
const YOUTUBE_LINK = process.env.YOUTUBE_LINK;
const DYNAMO_VIDEOS_TABLE = process.env.DYNAMO_VIDEOS_TABLE;
const RETRY_COUNT = parseInt(process.env.RETRY_COUNT || "0", 10);
const MAX_RETRIES = 0;

const transcribe = new TranscribeClient({ region: REGION });
const TRANSCRIBE_OUTPUT_BUCKET = process.env.TRANSCRIBE_OUTPUT_BUCKET;

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
  const cookiesPath = await downloadCookiesFromS3();

  try {
    await execAsync(
      `yt-dlp --cookies ${cookiesPath} -x --audio-format mp3 -o ${outputFile} "${youtubeLink}"`
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

async function startTranscription(jobName, mediaUri) {
  const params = {
    TranscriptionJobName: jobName,
    LanguageCode: "en-US",
    MediaFormat: "mp3",
    Media: {
      MediaFileUri: mediaUri,
    },
    OutputBucketName: TRANSCRIBE_OUTPUT_BUCKET,
  };

  try {
    await transcribe.send(new StartTranscriptionJobCommand(params));
    console.log(`Started transcription job: ${jobName}`);
  } catch (err) {
    console.error("Failed to start transcription job:", err);
    throw err;
  }
}

async function waitForTranscription(jobName) {
  while (true) {
    const data = await transcribe.send(
      new GetTranscriptionJobCommand({ TranscriptionJobName: jobName })
    );
    const job = data.TranscriptionJob;
    if (job.TranscriptionJobStatus === "COMPLETED") {
      console.log(`Transcription job ${jobName} completed.`);
      return job.Transcript.TranscriptFileUri;
    } else if (job.TranscriptionJobStatus === "FAILED") {
      throw new Error(`Transcription job ${jobName} failed.`);
    } else {
      console.log(`Waiting for transcription job ${jobName}...`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

const downloadCookiesFromS3 = async () => {
  const bucket = process.env.COOKIES_BUCKET;
  const key = process.env.COOKIES_KEY;
  const tempPath = path.join("/tmp", "cookies.txt");

  const data = await s3.send(
    new GetObjectCommand({ Bucket: bucket, Key: key })
  );

  const streamToString = (stream) =>
    new Promise((resolve, reject) => {
      const chunks = [];
      stream.on("data", (chunk) => chunks.push(chunk));
      stream.on("error", reject);
      stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    });

  const content = await streamToString(data.Body);
  fs.writeFileSync(tempPath, content);
  console.log(`Downloaded cookies file to ${tempPath}`);
  return tempPath;
};

const saveTranscriptToS3 = async (videoId, transcriptJson) => {
  try {
    const key = `${videoId}.json`;
    await s3.send(
      new PutObjectCommand({
        Bucket: TRANSCRIBE_OUTPUT_BUCKET,
        Key: key,
        Body: JSON.stringify(transcriptJson, null, 2),
        ContentType: "application/json",
      })
    );
    console.log(
      `Saved transcript to S3 bucket ${TRANSCRIBE_OUTPUT_BUCKET} with key ${key}`
    );
    return key;
  } catch (err) {
    console.error("Failed to save transcript to S3:", err);
    throw err;
  }
};

const saveTranscriptToDynamoDB = async (videoId, transcriptS3Key) => {
  if (!DYNAMO_VIDEOS_TABLE || !videoId) return;

  const params = {
    TableName: DYNAMO_VIDEOS_TABLE,
    Key: { video_id: { S: videoId } },
    UpdateExpression:
      "SET transcript_s3_key = :key, transcript_saved_at = :time",
    ExpressionAttributeValues: {
      ":key": { S: transcriptS3Key },
      ":time": { S: new Date().toISOString() },
    },
  };

  try {
    await dynamo.send(new UpdateItemCommand(params));
    console.log(`Updated transcript info in DynamoDB for video ${videoId}`);
  } catch (err) {
    console.error("Failed to update transcript info in DynamoDB:", err);
  }
};

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

    const timestamp = Date.now();
    const transcriptS3Key = `transcription-${youtubeId}-${timestamp}.json`;
    const jobName = `transcription-${youtubeId}-${timestamp}`; // unique job name for Transcribe
    const mediaUri = `s3://${BUCKET_NAME}/${s3Key}`;
    await startTranscription(jobName, mediaUri);

    // Wait for transcription to complete
    const transcriptUri = await waitForTranscription(jobName);

    // Save transcript S3 key to DynamoDB
    await saveTranscriptToDynamoDB(VIDEO_ID, transcriptS3Key);

    // === AI Insights Generation Step ===
    try {
      // Download transcript file from S3 output bucket
      const transcriptFilePath = path.join("/tmp", transcriptS3Key);
      const transcriptObj = await s3.send(
        new GetObjectCommand({
          Bucket: TRANSCRIBE_OUTPUT_BUCKET,
          Key: transcriptS3Key,
        })
      );
      const streamToString = (stream) =>
        new Promise((resolve, reject) => {
          const chunks = [];
          stream.on("data", (chunk) => chunks.push(chunk));
          stream.on("error", reject);
          stream.on("end", () =>
            resolve(Buffer.concat(chunks).toString("utf-8"))
          );
        });
      const transcriptContent = await streamToString(transcriptObj.Body);
      const transcriptJson = JSON.parse(transcriptContent);
      const transcriptText =
        transcriptJson.results &&
        transcriptJson.results.transcripts &&
        transcriptJson.results.transcripts[0]
          ? transcriptJson.results.transcripts[0].transcript
          : "";

      if (transcriptText && transcriptText.length > 0) {
        const insightsRaw = await generateInsightsFromTranscript(
          transcriptText
        );

        // Extract structured JSON from AI response
        let insightsJson;
        if (insightsRaw?.raw?.text) {
          try {
            insightsJson = JSON.parse(insightsRaw.raw.text);
          } catch {
            insightsJson = insightsRaw; // fallback to raw
          }
        } else {
          insightsJson = insightsRaw;
        }

        if (insightsJson) {
          const insightsFileKey = `insights-${youtubeId}-${timestamp}.json`;
          await s3.send(
            new PutObjectCommand({
              Bucket: TRANSCRIBE_OUTPUT_BUCKET,
              Key: insightsFileKey,
              Body: JSON.stringify(insightsJson, null, 2),
              ContentType: "application/json",
            })
          );
          console.log(`Saved insights JSON to S3: ${insightsFileKey}`);

          const params = {
            TableName: DYNAMO_VIDEOS_TABLE,
            Key: { video_id: { S: VIDEO_ID } },
            UpdateExpression:
              "SET insights_s3_key = :key, insights_saved_at = :time",
            ExpressionAttributeValues: {
              ":key": { S: insightsFileKey },
              ":time": { S: new Date().toISOString() },
            },
          };
          await dynamo.send(new UpdateItemCommand(params));
          console.log(
            `Updated DynamoDB with insights key for video ${VIDEO_ID}`
          );
        }
      } else {
        console.warn(
          "Transcript text is empty, skipping AI insights generation."
        );
      }
    } catch (err) {
      console.error("Error generating or saving AI insights:", err);
    }
    // === End AI Insights Generation Step ===

    // Clean up local files
    deleteFile(outputFile);

    // Clean up uploaded audio from S3
    try {
      await s3.send(
        new DeleteObjectCommand({
          Bucket: BUCKET_NAME,
          Key: s3Key,
        })
      );
      console.log(`Deleted audio from S3: ${s3Key}`);
    } catch (err) {
      console.error(`Failed to delete audio from S3: ${s3Key}`, err);
    }

    console.log("Audio processing and transcription complete.");
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
