import type { NextAuthConfig } from "next-auth";
import type { UserPlan } from "@/lib/db/schema";

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const authConfig = {
  basePath: "/api/auth",
  trustHost: true,
  pages: {
    signIn: `${base}/login`,
    newUser: `${base}/`,
  },
  providers: [],
  callbacks: {
    jwt({ token, user, account }) {
      if (user) {
        token.id = user.id as string;
        token.type = user.type;
        token.plan = (user.plan ?? "free") as UserPlan;
        token.planExpiresAt = user.planExpiresAt
          ? new Date(user.planExpiresAt).toISOString()
          : null;
        token.isAnonymous = user.isAnonymous ?? user.type === "guest";
      }

      if (account?.provider === "google") {
        token.type = "regular";
        token.isAnonymous = false;
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.type = token.type;
        session.user.plan = token.plan ?? "free";
        session.user.planExpiresAt = token.planExpiresAt ?? null;
        session.user.isAnonymous =
          token.isAnonymous ?? token.type === "guest";
      }

      return session;
    },
  },
} satisfies NextAuthConfig;
