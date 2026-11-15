import { describe, expect, it } from "vitest";
import { parseVideoUrl } from "./practice-video";

describe("parseVideoUrl", () => {
  it("parses standard YouTube watch URL", () => {
    const res = parseVideoUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    expect(res.provider).toBe("YOUTUBE");
    expect(res.videoId).toBe("dQw4w9WgXcQ");
    expect(res.embedUrl).toBe(
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
    );
  });

  it("parses youtu.be short URL", () => {
    const res = parseVideoUrl("https://youtu.be/dQw4w9WgXcQ?t=10");
    expect(res.provider).toBe("YOUTUBE");
    expect(res.videoId).toBe("dQw4w9WgXcQ");
    expect(res.embedUrl).toBe(
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
    );
  });

  it("parses YouTube shorts URL", () => {
    const res = parseVideoUrl("https://youtube.com/shorts/dQw4w9WgXcQ");
    expect(res.provider).toBe("YOUTUBE");
    expect(res.videoId).toBe("dQw4w9WgXcQ");
    expect(res.embedUrl).toBe(
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
    );
  });

  it("parses Google Drive file URL", () => {
    const res = parseVideoUrl(
      "https://drive.google.com/file/d/1A2B3C4D5E6F7G8H9I0J/view?usp=sharing",
    );
    expect(res.provider).toBe("DRIVE");
    expect(res.videoId).toBe("1A2B3C4D5E6F7G8H9I0J");
    expect(res.embedUrl).toBe(
      "https://drive.google.com/file/d/1A2B3C4D5E6F7G8H9I0J/preview",
    );
  });

  it("parses Google Drive open?id URL", () => {
    const res = parseVideoUrl(
      "https://drive.google.com/open?id=1A2B3C4D5E6F7G8H9I0J",
    );
    expect(res.provider).toBe("DRIVE");
    expect(res.videoId).toBe("1A2B3C4D5E6F7G8H9I0J");
    expect(res.embedUrl).toBe(
      "https://drive.google.com/file/d/1A2B3C4D5E6F7G8H9I0J/preview",
    );
  });

  it("parses Cloudinary video URL", () => {
    const url =
      "https://res.cloudinary.com/testcloud/video/upload/v12345/my-piano-diary/practice/sample.mp4";
    const res = parseVideoUrl(url, "testcloud");
    expect(res.provider).toBe("CLOUDINARY");
    expect(res.embedUrl).toBe(url);
  });

  it("falls back to LINK for unapproved Cloudinary cloud name", () => {
    const url =
      "https://res.cloudinary.com/evilcloud/video/upload/v12345/sample.mp4";
    const res = parseVideoUrl(url, "goodcloud");
    expect(res.provider).toBe("LINK");
  });

  it("falls back to LINK for generic web pages", () => {
    const res = parseVideoUrl("https://example.com/video/123");
    expect(res.provider).toBe("LINK");
    expect(res.videoId).toBeNull();
    expect(res.embedUrl).toBeNull();
  });

  it("handles empty or junk input gracefully", () => {
    expect(parseVideoUrl("").provider).toBe("LINK");
    expect(parseVideoUrl("not a url").provider).toBe("LINK");
  });
});
