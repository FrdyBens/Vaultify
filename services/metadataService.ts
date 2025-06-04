import { YouTubeVideoDetails } from "../types";

export function getFaviconUrl(pageUrl: string): string | null {
  if (!pageUrl) return null;
  try {
    const url = new URL(pageUrl);
    return `https://www.google.com/s2/favicons?sz=64&domain_url=${url.hostname}`;
  } catch (error) {
    console.error("Error creating favicon URL:", error);
    return null;
  }
}

export function extractYouTubeVideoId(videoUrl: string): string | null {
  if (!videoUrl) return null;
  try {
    const url = new URL(videoUrl);
    let videoId = null;

    if (url.hostname === "www.youtube.com" || url.hostname === "youtube.com") {
      videoId = url.searchParams.get("v");
    } else if (url.hostname === "youtu.be") {
      videoId = url.pathname.substring(1);
       // Handle cases like /shorts/VIDEO_ID
      if (videoId?.includes('/')) {
        videoId = videoId.substring(videoId.lastIndexOf('/') + 1);
      }
    }
    return videoId;
  } catch (error) {
    console.warn("Error extracting YouTube video ID:", error);
    return null;
  }
}

export function getYouTubeThumbnailUrl(videoUrl: string): string | null {
  const videoId = extractYouTubeVideoId(videoUrl);
  if (videoId) {
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  }
  return null;
}

export async function getYouTubeVideoDetails(videoId: string, apiKey: string): Promise<YouTubeVideoDetails | null> {
  if (!videoId || !apiKey) {
    console.warn("YouTube Video ID or API Key is missing.");
    return null;
  }

  const url = `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${apiKey}&part=snippet,contentDetails&fields=items(id,snippet(title,description,tags,thumbnails(high)))`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorData = await response.json();
      console.error("YouTube API Error:", errorData.error.message);
      throw new Error(`YouTube API request failed: ${errorData.error.message || response.statusText}`);
    }
    const data = await response.json();
    if (data.items && data.items.length > 0) {
      const snippet = data.items[0].snippet;
      return {
        title: snippet.title || '',
        description: snippet.description || '',
        tags: snippet.tags || [],
        thumbnailUrl: snippet.thumbnails?.high?.url || getYouTubeThumbnailUrl(`https://www.youtube.com/watch?v=${videoId}`) // Fallback
      };
    }
    return null;
  } catch (error) {
    console.error("Failed to fetch YouTube video details:", error);
    throw error; // Re-throw to be caught by caller
  }
}


export function isDirectImageUrl(url: string): boolean {
    if (!url) return false;
    try {
        const path = new URL(url).pathname.toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico'].some(ext => path.endsWith(ext));
    } catch {
        return false;
    }
}

export function isYouTubeUrl(url: string): boolean {
  if (!url) return false;
  try {
    const parsedUrl = new URL(url);
    return (
      parsedUrl.hostname === "www.youtube.com" ||
      parsedUrl.hostname === "youtube.com" ||
      parsedUrl.hostname === "youtu.be"
    );
  } catch {
    return false;
  }
}
