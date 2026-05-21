import { NextResponse } from "next/server";
import { auth } from "@/app/(auth)/auth.middleware";
import { isAdminEmail } from "@/lib/admin/allowed-emails";

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/pricing",
  "/payment",
];

const ADMIN_PUBLIC_PATHS = ["/admin/login", "/admin/auth/complete"];

export default auth((req) => {
  const isAuth = !!req.auth;
  const isAnonymous = req.auth?.user?.isAnonymous === true;
  const pathname = req.nextUrl.pathname;
  const isAuthPage =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password");
  const isApiAuth = pathname.startsWith("/api/auth");
  const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
  const isAdminPath = pathname.startsWith("/admin");
  const isAdminPublicPath = ADMIN_PUBLIC_PATHS.some((path) =>
    pathname.startsWith(path)
  );

  if (isApiAuth) {
    return NextResponse.next();
  }

  if (isAdminPublicPath) {
    return NextResponse.next();
  }

  if (isAdminPath && (!isAuth || isAnonymous)) {
    const loginUrl = new URL("/admin/login", req.url);
    loginUrl.searchParams.set(
      "redirectUrl",
      `${pathname}${req.nextUrl.search}`
    );
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminPath && isAuth && !isAnonymous && !isAdminEmail(req.auth?.user?.email)) {
    const loginUrl = new URL("/admin/login", req.url);
    loginUrl.searchParams.set("error", "not_authorized");
    return NextResponse.redirect(loginUrl);
  }

  if (isAuth && !isAnonymous && isAuthPage) {
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
