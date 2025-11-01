import axios from "axios";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
} from "@aws-sdk/lib-dynamodb";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);
const sqsClient = new SQSClient({});

const RAPID_API_KEY = process.env.RAPID_API_KEY;
const SQS_QUEUE_URL = process.env.SQS_QUEUE_URL;
const VIDEOS_TABLE = process.env.DYNAMO_VIDEOS_TABLE;

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

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { youtube_link, uploaded_by } = body;

    if (!youtube_link || !uploaded_by) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "Missing youtube_link or uploaded_by",
        }),
      };
    }

    const youtube_id = extractYouTubeID(youtube_link);
    if (!youtube_id) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Invalid YouTube URL" }),
      };
    }

    const existing = await ddb.send(
      new GetCommand({
        TableName: VIDEOS_TABLE,
        Key: { video_id: youtube_id },
      })
    );

    if (existing.Item && existing.Item.status === "done") {
      console.log("Video already exists in DB:", youtube_id);
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "Video already exists. No need to download.",
          video_id: youtube_id,
          s3_key: existing.Item.s3_key,
        }),
      };
    }

    // Call RapidAPI to fetch video metadata
    const response = await axios.get(
      "https://social-media-video-downloader.p.rapidapi.com/smvd/get/youtube",
      {
        params: { url: youtube_link },
        headers: {
          "X-RapidAPI-Key": RAPID_API_KEY,
          "X-RapidAPI-Host": "social-media-video-downloader.p.rapidapi.com",
        },
      }
    );

    const data = response.data;

    const metadata = {
      video_id: extractYouTubeID(youtube_link),
      title: data.title,
      description: data.stats.description || "",
      picture: data.picture,
      duration: data.stats.lengthSeconds,
      // links: data.links,
      user_url: data.author.user_url,
      user_name: data.author.name,
      youtube_link,
      uploaded_by,
      status: "pending", //Track processing lifecycle: pending, processing, done, failed
      created_at: new Date().toISOString(),
    };

    // Save metadata to DynamoDB
    await ddb.send(
      new PutCommand({
        TableName: "safetube_videos",
        Item: metadata,
      })
    );

    // Send message to SQS with the video_id for processing
    const sendMessageParams = {
      QueueUrl: SQS_QUEUE_URL,
      MessageBody: JSON.stringify({
        video_id: metadata.video_id,
        youtube_link: metadata.youtube_link,
        uploaded_by: metadata.uploaded_by,
        dynamo_videos_table: VIDEOS_TABLE,
        retry_count: 2,
      }),
    };
    await sqsClient.send(new SendMessageCommand(sendMessageParams));

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Video metadata saved and processing job queued",
        video_id: metadata.video_id,
      }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error processing video",
        error: err.message,
      }),
    };
  }
};
