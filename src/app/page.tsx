import { type Metadata } from "next";

import { LandingPage } from "@/components/landing/landing-page";
import { APP_CONFIG } from "@/config/app-config";
import { auth } from "@/server/auth";

const TITLE = "My Piano Diary — the studio diary for piano teachers";

/**
 * Only what differs from the root layout is declared here; `metadataBase`,
 * keywords, robots, the twitter handle and the icons are all inherited.
 *
 * Deliberately no `images` on either card: src/app/opengraph-image.tsx is a
 * file-convention route, so Next injects og:image and twitter:image for this
 * page automatically. Declaring them again here would emit the card twice.
 */
export const metadata: Metadata = {
  title: TITLE,
  description:
    "Keep every student in one place: book the week, mark attendance, score each finished lesson in blossoms, watch tuition add up at the rate it was booked at, and print a monthly report for each family.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: APP_CONFIG.name,
    title: TITLE,
    description: APP_CONFIG.meta.shareDescription,
  },
  twitter: {
    card: "summary_large_image",
    creator: APP_CONFIG.author.twitter,
    title: TITLE,
    description: APP_CONFIG.meta.shareDescription,
  },
};

/**
 * The public landing page. It reads the session only to decide which call to
 * action to show — a signed-in teacher gets "Go to Dashboard" rather than being
 * bounced there, so she can still read the page she just shared with someone.
 * No tRPC runs here, so there is nothing to hydrate.
 */
export default async function Home() {
  const session = await auth();

  return <LandingPage isLoggedIn={!!session?.user} />;
}
