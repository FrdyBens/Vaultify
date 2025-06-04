import { BookmarkCategory } from './types';

export const LOCAL_STORAGE_KEY = "encryptedBookmarksData_v1";
export const THEME_STORAGE_KEY = "themePreference_v1";
export const UI_THEME_STORAGE_KEY = "uiTheme_v1";
export const YOUTUBE_API_KEY_STORAGE_KEY = "youtubeApiKey_v1";

export const PBKDF2_ITERATIONS = 100000;
export const ENCRYPTION_ALGORITHM = "AES-GCM";
export const KEY_DERIVATION_ALGORITHM = "PBKDF2";
export const HASH_ALGORITHM = "SHA-256";
export const KEY_LENGTH_BITS = 256; // AES-256
export const SALT_LENGTH_BYTES = 16; // 128 bits for salt
export const IV_LENGTH_BYTES = 12; // 96 bits for IV is recommended for AES-GCM

export const OBFUSCATION_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";
export const APP_TITLE = "Vaultify";

export const CATEGORY_COLORS: { [key in BookmarkCategory]: string } = {
  [BookmarkCategory.WORK]: "bg-sky-500",
  [BookmarkCategory.PERSONAL]: "bg-emerald-500",
  [BookmarkCategory.TECHNOLOGY]: "bg-indigo-500",
  [BookmarkCategory.NEWS]: "bg-amber-500",
  [BookmarkCategory.LEARNING]: "bg-rose-500",
  [BookmarkCategory.OTHER]: "bg-slate-500",
};

export const AI_MODEL_NAME = 'gemini-2.5-flash-preview-04-17';

export const AI_BOOKMARK_INFO_GENERATION_PROMPT_TEMPLATE = (url: string) => `
Given the URL "${url}", analyze its content and generate a suitable title, a concise 1-2 sentence description, and 3-5 relevant tags for a bookmark.
The URL itself is ${url}.
Return the response strictly as a JSON object with the keys "title" (string), "description" (string), and "tags" (array of strings).
Example: { "title": "Example News Article", "description": "An insightful article about recent events.", "tags": ["news", "current events", "analysis"] }
Ensure the JSON is valid. Do not include any markdown formatting like \`\`\`json or \`\`\` around the JSON object.
`;

export const AI_YOUTUBE_BOOKMARK_INFO_GENERATION_PROMPT_TEMPLATE = (url: string) => `
For the YouTube video URL "${url}", generate a suitable title (typically the video's actual title), a concise 1-2 sentence description summarizing the video's content or purpose (like from the uploader's description), and 3-5 relevant tags (e.g., "video", "tutorial", "vlog", "music video", "channel name if known").
The URL itself is ${url}.
Return the response strictly as a JSON object with the keys "title" (string), "description" (string), and "tags" (array of strings).
Example: { "title": "How to Bake a Cake - Easy Recipe by MyChannel", "description": "A step-by-step tutorial on baking a delicious chocolate cake. Perfect for beginners and covers all the basics.", "tags": ["baking", "tutorial", "recipe", "cake", "cooking", "MyChannel"] }
Ensure the JSON is valid. Do not include any markdown formatting like \`\`\`json or \`\`\` around the JSON object.
`;

export const AI_CATEGORIZATION_PROMPT_TEMPLATE = (title: string, description: string, tags: string[], url: string) => `
Analyze the following bookmark information:
Title: "${title}"
Description: "${description}"
Tags: "${tags.join(', ')}"
URL: "${url}"

Suggest a primary category, an optional secondary category (leave as empty string if not applicable or not confident), and up to 3 relevant subcategories.
The categories should be broad (e.g., "Technology", "Education", "Entertainment", "Productivity", "Lifestyle", "Finance", "Health & Fitness", "Arts & Culture", "Travel", "Food & Drink").
Subcategories should be more specific.
Return the response strictly as a JSON object with the keys "primaryCategoryAI" (string), "secondaryCategoryAI" (string, can be empty), and "subcategoriesAI" (array of strings, up to 3).
Example: { "primaryCategoryAI": "Technology", "secondaryCategoryAI": "Software Development", "subcategoriesAI": ["Web Development", "JavaScript", "Frontend"] }
Another example: { "primaryCategoryAI": "Entertainment", "secondaryCategoryAI": "", "subcategoriesAI": ["Movies", "Sci-Fi"] }
Ensure the JSON is valid. Do not include any markdown formatting like \`\`\`json or \`\`\` around the JSON object.
`;
