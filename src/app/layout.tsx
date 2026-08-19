import "@/styles/globals.css";

import { type Metadata, type Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";

import { Providers } from "@/components/providers";
import { APP_CONFIG, SITE_URL } from "@/config/app-config";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-plus-jakarta-sans",
});

/**
 * Site-wide metadata. Everything here is inherited by every route and then
 * narrowed per page: the `title.template` turns a page's bare `title: "Payments"`
 * into "Payments · My Piano Diary", and the protected `(root)` layout overrides
 * `robots` to noindex so the app itself never reaches a search index — only the
 * public landing page, login and register do.
 *
 * `metadataBase` is what lets the relative image paths below resolve to absolute
 * URLs; without it Next warns at build time and share cards ship broken images.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: APP_CONFIG.meta.title,
    template: APP_CONFIG.meta.titleTemplate,
  },
  description: APP_CONFIG.meta.description,
  applicationName: APP_CONFIG.name,
  keywords: [...APP_CONFIG.meta.keywords],
  authors: [{ name: APP_CONFIG.author.name, url: APP_CONFIG.author.url }],
  creator: APP_CONFIG.author.name,
  publisher: APP_CONFIG.author.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: APP_CONFIG.name,
    title: APP_CONFIG.meta.title,
    description: APP_CONFIG.meta.shareDescription,
  },
  twitter: {
    card: "summary_large_image",
    site: APP_CONFIG.author.twitter,
    creator: APP_CONFIG.author.twitter,
    title: APP_CONFIG.meta.title,
    description: APP_CONFIG.meta.shareDescription,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  appleWebApp: {
    capable: true,
    title: APP_CONFIG.name,
    statusBarStyle: "default",
  },
  // Phone-number autolinking mangles lesson times and tuition figures on iOS.
  formatDetection: { telephone: false, address: false, email: false },
  category: "education",
};

/**
 * `themeColor` is Candy Floss's cotton pink so the mobile browser chrome
 * matches the app shell instead of flashing white. Split out of `metadata`
 * because Next 16 requires viewport fields in their own export.
 */
export const viewport: Viewport = {
  themeColor: "#ffd3dd",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${plusJakartaSans.variable} font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
