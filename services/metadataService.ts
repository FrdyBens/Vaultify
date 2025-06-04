
export function getFaviconUrl(pageUrl: string): string | null {
  if (!pageUrl) return null;
  try {
    const url = new URL(pageUrl);
    // Google's favicon service: sz=64 for 64x64px icon.
    return `https://www.google.com/s2/favicons?sz=64&domain_url=${url.hostname}`;
  } catch (error) {
    console.error("Error creating favicon URL:", error);
    return null;
  }
}

export function getYouTubeThumbnailUrl(videoUrl: string): string | null {
  if (!videoUrl) return null;
  try {
    const url = new URL(videoUrl);
    let videoId = null;

    if (url.hostname === "www.youtube.com" || url.hostname === "youtube.com") {
      videoId = url.searchParams.get("v");
    } else if (url.hostname === "youtu.be") {
      videoId = url.pathname.substring(1);
    }

    if (videoId) {
      // hqdefault.jpg is a high-quality thumbnail (480x360)
      // Other options: default.jpg (120x90), mqdefault.jpg (320x180), sddefault.jpg (640x480), maxresdefault.jpg (1920x1080, if available)
      return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    }
    return null;
  } catch (error) {
    console.error("Error extracting YouTube video ID:", error);
    return null;
  }
}

// Basic check if URL points to a common image type
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

// Note: Fetching and parsing <meta> tags like og:image or twitter:image directly 
// from client-side JavaScript is often blocked by CORS policy if the target
// website doesn't allow it. A server-side proxy would be needed for robust meta tag scraping.
// For this local-only app, we'll stick to favicon and YouTube thumbnails.
