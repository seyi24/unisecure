import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import { createUser, getUser } from "@/lib/db/queries";

const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const authConfig = {
  basePath: "/api/auth",
  trustHost: true,
  pages: {
    signIn: `${base}/login`,
    newUser: `${base}/`,
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" && user.email) {
        // Check if user exists, if not create one
        const existingUsers = await getUser(user.email);
        if (existingUsers.length === 0) {
          // Create user without password for OAuth
          await createUser(user.email);
        }
        return true;
      }
      return true;
    },
  },
} satisfies NextAuthConfig;
