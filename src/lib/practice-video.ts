import { type VideoProvider } from "@prisma/client";

export interface ParsedVideo {
  provider: VideoProvider;
  videoId: string | null;
  embedUrl: string | null;
  isImage?: boolean;
}

/**
 * Checks whether a media URL points to an image file (e.g. Cloudinary photo or direct image link).
 */
export function isMediaImage(url?: string | null): boolean {
  if (!url || typeof url !== "string") return false;
  const lower = url.toLowerCase();
  return (
    lower.includes("/image/upload/") ||
    /\.(jpe?g|png|webp|gif|svg)($|\?)/i.test(lower)
  );
}

/**
 * Parses video or image URLs from YouTube, Google Drive, Cloudinary, or fallback links.
 * Returns safe embed URLs or provider flags for rendering.
 */
export function parseVideoUrl(
  url: string,
  allowedCloudinaryCloudName?: string,
): ParsedVideo {
  if (!url || typeof url !== "string") {
    return { provider: "LINK", videoId: null, embedUrl: null, isImage: false };
  }

  const trimmed = url.trim();
  const isImage = isMediaImage(trimmed);

  // 1. YouTube
  // Patterns: youtube.com/watch?v=ID, youtu.be/ID, youtube.com/shorts/ID, youtube.com/embed/ID
  try {
    const parsedUrl = new URL(trimmed);
    const host = parsedUrl.hostname.toLowerCase();

    if (
      host === "www.youtube.com" ||
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "youtu.be"
    ) {
      let videoId: string | null = null;

      if (host === "youtu.be") {
        videoId = parsedUrl.pathname.slice(1).split(/[?#&/]/)[0] ?? null;
      } else if (parsedUrl.pathname.startsWith("/watch")) {
        videoId = parsedUrl.searchParams.get("v");
      } else if (parsedUrl.pathname.startsWith("/shorts/")) {
        videoId =
          parsedUrl.pathname.replace("/shorts/", "").split(/[?#&/]/)[0] ?? null;
      } else if (parsedUrl.pathname.startsWith("/embed/")) {
        videoId =
          parsedUrl.pathname.replace("/embed/", "").split(/[?#&/]/)[0] ?? null;
      }

      if (videoId && /^[\w-]{11}$/.test(videoId)) {
        return {
          provider: "YOUTUBE",
          videoId,
          embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
          isImage: false,
        };
      }
    }

    // 2. Google Drive
    // drive.google.com/file/d/<id>/view or drive.google.com/open?id=<id>
    if (host === "drive.google.com" || host === "docs.google.com") {
      let fileId: string | null = null;
      const fileMatch = /\/file\/d\/([a-zA-Z0-9_-]+)/.exec(parsedUrl.pathname);
      if (fileMatch?.[1]) {
        fileId = fileMatch[1];
      } else if (parsedUrl.searchParams.has("id")) {
        fileId = parsedUrl.searchParams.get("id");
      }

      if (fileId) {
        return {
          provider: "DRIVE",
          videoId: fileId,
          embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
          isImage: false,
        };
      }
    }

    // 3. Cloudinary
    // res.cloudinary.com/<cloud>/video/upload/... or /image/upload/...
    if (host === "res.cloudinary.com") {
      const parts = parsedUrl.pathname.split("/").filter(Boolean);
      // Expected path: /<cloud-name>/<resource-type>/upload/...
      const cloudName = parts[0];
      const resourceType = parts[1];

      // If allowedCloudName is provided, enforce match
      const cloudMatches =
        !allowedCloudinaryCloudName || cloudName === allowedCloudinaryCloudName;

      if (
        cloudMatches &&
        (resourceType === "video" || resourceType === "image")
      ) {
        return {
          provider: "CLOUDINARY",
          videoId: parts.slice(3).join("/"),
          embedUrl: trimmed,
          isImage: resourceType === "image" || isImage,
        };
      }
    }
  } catch {
    // If URL parsing fails, treat as generic LINK
    return { provider: "LINK", videoId: null, embedUrl: null, isImage };
  }

  // 4. Fallback link
  return { provider: "LINK", videoId: null, embedUrl: null, isImage };
}
