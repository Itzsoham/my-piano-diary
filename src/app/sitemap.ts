import { type MetadataRoute } from "next";

import { PUBLIC_ROUTES, SITE_URL } from "@/config/app-config";

/**
 * Generated at /sitemap.xml.
 *
 * Only the three genuinely public routes are listed. Every app route is behind
 * auth and every report URL is scoped to one teacher's data, so there is
 * nothing else a crawler could usefully fetch.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return PUBLIC_ROUTES.map((route) => ({
    url: new URL(route.path, SITE_URL).toString(),
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
