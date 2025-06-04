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
  category: BookmarkCategory;
  tags?: string[];
  iconUrl?: string;
  thumbnailUrl?: string;
  createdAt: string; // ISO string
  lastVisited?: string; // ISO string
  obfuscatedId?: string; // Optional: if we want to display an obfuscated version of a numerical sequence
}

export interface EncryptedData {
  salt: string; // Base64 encoded
  iv: string; // Base64 encoded
  ciphertext: string; // Base64 encoded
}

// For imported data structure
export interface EncryptedFileFormat extends EncryptedData {
  // Could add versioning or metadata here if needed in the future
}

export type SortOption = 
  | "createdAt_desc"
  | "createdAt_asc"
  | "name_asc"
  | "name_desc"
  | "lastVisited_desc"
  | "lastVisited_asc";

export interface AiGeneratedInfo {
  title: string;
  description: string;
  tags: string[];
}