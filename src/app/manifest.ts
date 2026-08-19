import { type MetadataRoute } from "next";

import { APP_CONFIG } from "@/config/app-config";

/**
 * Generated at /manifest.webmanifest. Makes the studio installable on a phone,
 * which is how most teachers will actually open it between lessons — it starts
 * on /dashboard rather than the marketing page.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_CONFIG.meta.title,
    short_name: APP_CONFIG.name,
    description: APP_CONFIG.meta.description,
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f0f9f8",
    theme_color: "#ffd3dd",
    categories: ["education", "productivity", "music"],
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
