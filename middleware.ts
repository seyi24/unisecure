import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth";

const PUBLIC_PATHS = ["/login", "/register", "/pricing"];

export default auth((req) => {
  const isAuth = !!req.auth;
  const pathname = req.nextUrl.pathname;
  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/register");
  const isApiAuth = pathname.startsWith("/api/auth");
  const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  if (isApiAuth) {
    return NextResponse.next();
  }

  if (isAuth && isAuthPage) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (!(isAuth || isPublicPath)) {
    const redirectUrl = encodeURIComponent(`${pathname}${req.nextUrl.search}`);
    return NextResponse.redirect(
      new URL(`/api/auth/guest?redirectUrl=${redirectUrl}`, req.url)
    );
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
