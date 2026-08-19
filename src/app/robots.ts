import { type MetadataRoute } from "next";

import { PRIVATE_ROUTES, SITE_URL } from "@/config/app-config";

/**
 * Generated at /robots.txt.
 *
 * Everything under PRIVATE_ROUTES sits behind the auth proxy, so a crawler
 * would only ever receive the /login redirect — disallowing them keeps that
 * noise out of Search Console rather than adding real protection. The access
 * control is src/proxy.ts; this is only a politeness hint.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [...PRIVATE_ROUTES],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
