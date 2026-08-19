import { type NextRequest, NextResponse } from "next/server";

const AUTH_COOKIES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
];

function hasSessionCookie(req: NextRequest) {
  return AUTH_COOKIES.some((name) => req.cookies.has(name));
}

/** Prefix-matched: everything under these trees is public. "/design-mockups"
 *  is here because the landing page links to /design-mockups/index.html and the
 *  matcher below only excludes image/audio extensions, not .html. */
const PUBLIC_PATHS = ["/login", "/register", "/forever", "/design-mockups"];

/** Matched EXACTLY, never by prefix. The landing page lives at "/", and every
 *  pathname starts with "/" — putting it in PUBLIC_PATHS would make the whole
 *  app public. */
const EXACT_PUBLIC_PATHS = ["/"];

export function proxy(req: NextRequest) {
  const isLoggedIn = hasSessionCookie(req);
  const isPublicPage =
    EXACT_PUBLIC_PATHS.includes(req.nextUrl.pathname) ||
    PUBLIC_PATHS.some((p) => req.nextUrl.pathname.startsWith(p));

  if (!isLoggedIn && !isPublicPage) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const isAuthPage =
    req.nextUrl.pathname.startsWith("/login") ||
    req.nextUrl.pathname.startsWith("/register");

  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

/**
 * The metadata routes in the first half of this lookahead are excluded
 * deliberately. /robots.txt, /sitemap.xml, /manifest.webmanifest and the
 * generated /icon, /apple-icon and /opengraph-image are fetched by crawlers and
 * link-preview bots that never carry a session cookie — without these
 * exclusions the guard above answered every one of them with a 307 to /login,
 * which silently breaks indexing and every share card. None of them expose user
 * data. The trailing extension group covers the same files by suffix, plus the
 * static assets the app serves from /public.
 */
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots\.txt|sitemap\.xml|manifest\.webmanifest|icon|apple-icon|opengraph-image|twitter-image|.*\.(?:svg|png|jpg|jpeg|gif|webp|mp3|wav|ogg|m4a|mpeg|txt|xml|webmanifest)$).*)",
  ],
};
