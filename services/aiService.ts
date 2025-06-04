
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { AI_MODEL_NAME, AI_BOOKMARK_INFO_GENERATION_PROMPT_TEMPLATE, AI_YOUTUBE_BOOKMARK_INFO_GENERATION_PROMPT_TEMPLATE } from '../constants';
import { AiGeneratedInfo } from "../types";
import { isYouTubeUrl } from "./metadataService"; // Import the YouTube URL checker

// Ensure process.env.API_KEY is available. If not, AI features will fail.
// For client-side, this might need to be set via a script: <script>window.process = { env: { API_KEY: "YOUR_KEY" } };</script>
const API_KEY = typeof process !== 'undefined' && process.env && process.env.API_KEY
  ? process.env.API_KEY
  : undefined;

let ai: GoogleGenAI | null = null;
if (API_KEY) {
  try {
    ai = new GoogleGenAI({ apiKey: API_KEY });
  } catch (error) {
    console.error("Failed to initialize GoogleGenAI. API Key might be invalid or missing.", error);
    ai = null; // Explicitly set to null on failure
  }
} else {
  console.warn("API_KEY for GoogleGenAI is not defined. AI features will be disabled.");
}

export async function generateBookmarkInfo(url: string): Promise<AiGeneratedInfo> {
  if (!ai) {
    throw new Error("AI Service not initialized. API Key may be missing or invalid.");
  }
  if (!url) {
    throw new Error("URL is required to generate bookmark info.");
  }

  const isYouTube = isYouTubeUrl(url);
  const prompt = isYouTube 
    ? AI_YOUTUBE_BOOKMARK_INFO_GENERATION_PROMPT_TEMPLATE(url)
    : AI_BOOKMARK_INFO_GENERATION_PROMPT_TEMPLATE(url);

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: AI_MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    let jsonStr = response.text.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[2]) {
      jsonStr = match[2].trim();
    }
    
    const parsedData = JSON.parse(jsonStr) as AiGeneratedInfo;

    if (!parsedData.title || !parsedData.description || !Array.isArray(parsedData.tags)) {
        throw new Error("AI response is not in the expected format.");
    }
    return parsedData;

  } catch (error) {
    console.error("Error generating bookmark info with AI:", error);
    if (error instanceof Error && error.message.includes("API key not valid")) {
        throw new Error("AI API Key is invalid. Please check your configuration.");
    }
    throw new Error(`Failed to generate bookmark info: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export function isAiServiceAvailable(): boolean {
  return !!ai;
}