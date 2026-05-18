import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { signIn } from "@/app/(auth)/auth";
import { isDevelopmentEnvironment } from "@/lib/constants";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawRedirect = searchParams.get("redirectUrl") || "/";
    const redirectUrl =
      rawRedirect.startsWith("/") && !rawRedirect.startsWith("//")
        ? rawRedirect
        : "/";

    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
      secureCookie: !isDevelopmentEnvironment,
    });

    if (token) {
      const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
      return NextResponse.redirect(new URL(`${base}/`, request.url));
    }

    return signIn("guest", { redirect: true, redirectTo: redirectUrl });
  } catch (error) {
    console.error(
      "[auth] guest sign-in failed:",
      error instanceof Error ? error.message : error
    );

    const message =
      error instanceof Error ? error.message : "Guest sign-in failed";
    const isDatabase =
      message.includes("database") ||
      message.includes("POSTGRES") ||
      message.includes("connect");

    return NextResponse.json(
      {
        error: isDatabase
          ? "Database is unavailable. Check POSTGRES_URL on Vercel and that migrations ran during build."
          : "Could not start a guest session. Try again or sign in.",
      },
      { status: isDatabase ? 503 : 500 }
    );
  }
}