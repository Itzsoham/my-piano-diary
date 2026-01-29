import { auth } from "@/server/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthPage =
    req.nextUrl.pathname.startsWith("/login") ||
    req.nextUrl.pathname.startsWith("/register");

  // If user is not logged in and trying to access protected routes
  if (!isLoggedIn && !isAuthPage) {
    const loginUrl = new URL("/login", req.url);
    return Response.redirect(loginUrl);
  }

  // If user is logged in and trying to access auth pages, redirect to home
  if (isLoggedIn && isAuthPage) {
    const homeUrl = new URL("/", req.url);
    return Response.redirect(homeUrl);
  }

  return;
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
