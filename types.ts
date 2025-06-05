export enum BookmarkCategory {
  WORK = "Work",
  PERSONAL = "Personal",
  TECHNOLOGY = "Technology",
  NEWS = "News",
  LEARNING = "Learning",
  OTHER = "Other",
}

export interface Bookmark {
  id: string; // Using UUID for IDs
  name: string;
  url: string;
  description: string;
  category: BookmarkCategory; // User-defined general category
  tags?: string[];
  iconUrl?: string;
  thumbnailUrl?: string;
  createdAt: string; // ISO string
  lastVisited?: string; // ISO string
  obfuscatedId?: string;

  // AI Suggested Categorization
  primaryCategoryAI?: string;
  secondaryCategoryAI?: string;
  subcategoriesAI?: string[];
  notes?: string;
  isRead?: boolean;
}

export interface EncryptedData {
  salt: string; // Base64 encoded
  iv: string; // Base64 encoded
  ciphertext: string; // Base64 encoded
}

export interface EncryptedFileFormat extends EncryptedData {
  // Could add versioning or metadata here if needed in the future
}

export type SortOption = 
  | "createdAt_desc"
  | "createdAt_asc"
  | "name_asc"
  | "name_desc"
  | "lastVisited_desc"
  | "lastVisited_asc"
  | "isRead_asc"
  | "isRead_desc";

export interface AiGeneratedInfo { // For general title, desc, tags from AI
  title: string;
  description: string;
  tags: string[];
}

export interface AiCategorizationInfo { // For AI-driven categories
    primaryCategoryAI: string;
    secondaryCategoryAI?: string;
    subcategoriesAI: string[];
}

// For YouTube Data API v3
export interface YouTubeVideoDetails {
    title: string;
    description: string;
    tags: string[];
    thumbnailUrl?: string; // Could get a specific one from API if needed
}

export type UiTheme = "current" | "visual";
