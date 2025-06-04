import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { AI_MODEL_NAME, AI_BOOKMARK_INFO_GENERATION_PROMPT_TEMPLATE, AI_YOUTUBE_BOOKMARK_INFO_GENERATION_PROMPT_TEMPLATE, AI_CATEGORIZATION_PROMPT_TEMPLATE } from '../constants';
import { AiGeneratedInfo, AiCategorizationInfo } from "../types";
import { isYouTubeUrl } from "./metadataService";

const API_KEY = typeof process !== 'undefined' && process.env && process.env.API_KEY
  ? process.env.API_KEY
  : undefined;

let ai: GoogleGenAI | null = null;
if (API_KEY) {
  try {
    ai = new GoogleGenAI({ apiKey: API_KEY });
  } catch (error) {
    console.error("Failed to initialize GoogleGenAI. API Key might be invalid or missing.", error);
    ai = null;
  }
} else {
  console.warn("API_KEY for GoogleGenAI is not defined. AI features will be disabled.");
}

function parseJsonResponse<T>(responseText: string): T {
  let jsonStr = responseText.trim();
  const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
  const match = jsonStr.match(fenceRegex);
  if (match && match[2]) {
    jsonStr = match[2].trim();
  }
  try {
    return JSON.parse(jsonStr) as T;
  } catch (e) {
    console.error("Failed to parse JSON response:", jsonStr, e);
    throw new Error("AI response was not valid JSON.");
  }
}

export async function generateBookmarkInfo(url: string): Promise<AiGeneratedInfo> {
  if (!ai) {
    throw new Error("AI Service not initialized. API Key may be missing or invalid.");
  }
  if (!url) {
    throw new Error("URL is required to generate bookmark info.");
  }

  // For YouTube URLs, title/description/tags will primarily come from YouTube Data API.
  // This AI function can still be a fallback or supplement if YouTube API fails or for non-YT URLs.
  const isYouTube = isYouTubeUrl(url);
  const prompt = isYouTube 
    ? AI_YOUTUBE_BOOKMARK_INFO_GENERATION_PROMPT_TEMPLATE(url) // This prompt is more for if YT API is not used
    : AI_BOOKMARK_INFO_GENERATION_PROMPT_TEMPLATE(url);

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: AI_MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });
    
    const parsedData = parseJsonResponse<AiGeneratedInfo>(response.text);

    if (typeof parsedData.title !== 'string' || typeof parsedData.description !== 'string' || !Array.isArray(parsedData.tags)) {
        throw new Error("AI response for bookmark info is not in the expected format.");
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

export async function generateAiCategorization(title: string, description: string, tags: string[], url: string): Promise<AiCategorizationInfo> {
  if (!ai) {
    throw new Error("AI Service not initialized. API Key may be missing or invalid.");
  }
   if (!title && !description && tags.length === 0 && !url) {
    throw new Error("Insufficient information to generate categories.");
  }

  const prompt = AI_CATEGORIZATION_PROMPT_TEMPLATE(title, description, tags, url);

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: AI_MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const parsedData = parseJsonResponse<AiCategorizationInfo>(response.text);
    
    if (typeof parsedData.primaryCategoryAI !== 'string' || !Array.isArray(parsedData.subcategoriesAI)) {
         throw new Error("AI response for categorization is not in the expected format.");
    }
     // Ensure secondaryCategoryAI is either a string or undefined (normalize if it's null or other)
    if (parsedData.secondaryCategoryAI === null || parsedData.secondaryCategoryAI === undefined) {
        parsedData.secondaryCategoryAI = ""; // Normalize to empty string
    }


    return parsedData;
  } catch (error) {
    console.error("Error generating AI categorization:", error);
     if (error instanceof Error && error.message.includes("API key not valid")) {
        throw new Error("AI API Key is invalid. Please check your configuration.");
    }
    throw new Error(`Failed to generate AI categorization: ${error instanceof Error ? error.message : String(error)}`);
  }
}


export function isAiServiceAvailable(): boolean {
  return !!ai;
}
