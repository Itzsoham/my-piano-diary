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

const PUBLIC_PATHS = ["/login", "/register", "/forever"];

export function middleware(req: NextRequest) {
  const isLoggedIn = hasSessionCookie(req);
  const isPublicPage = PUBLIC_PATHS.some((p) =>
    req.nextUrl.pathname.startsWith(p),
  );

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

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
