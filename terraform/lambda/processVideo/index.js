import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);

const RAPID_API_KEY = process.env.RAPID_API_KEY; // Set this in Lambda environment variables

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
      video_id: uuidv4(),
      //   title: data.title,
      //   description: data.description || "",
      //   thumbnail_url: data.thumbnail,
      //   duration: data.duration,
      //   youtube_link,
      //   uploaded_by,
      status: "pending",
      created_at: new Date().toISOString(),
    };

    // Save metadata to DynamoDB
    await ddb.send(
      new PutCommand({
        TableName: "safetube_videos",
        Item: metadata,
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Video metadata saved",
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
