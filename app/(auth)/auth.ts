import { compare } from "bcrypt-ts";
import NextAuth, { type DefaultSession } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { DUMMY_PASSWORD } from "@/lib/constants";
import {
  createGuestUser,
  createUser,
  getUser,
  getUserById,
} from "@/lib/db/queries";
import type { UserPlan } from "@/lib/db/schema";
import { authConfig } from "./auth.config";

export type UserType = "guest" | "regular";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      type: UserType;
      plan: UserPlan;
      planExpiresAt: string | null;
      isAnonymous: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id?: string;
    email?: string | null;
    type: UserType;
    plan?: UserPlan;
    planExpiresAt?: Date | string | null;
    isAnonymous?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    type: UserType;
    plan: UserPlan;
    planExpiresAt: string | null;
    isAnonymous: boolean;
  }
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials.email ?? "");
        const password = String(credentials.password ?? "");

        try {
          const users = await getUser(email);

          if (users.length === 0) {
            await compare(password, DUMMY_PASSWORD);
            return null;
          }

          const [user] = users;

          if (!user.password) {
            await compare(password, DUMMY_PASSWORD);
            return null;
          }

          const passwordsMatch = await compare(password, user.password);

          if (!passwordsMatch) {
            return null;
          }

          return {
            ...user,
            type: "regular",
            plan: user.plan,
            planExpiresAt: user.planExpiresAt,
            isAnonymous: user.isAnonymous,
          };
        } catch (error) {
          console.error(
            "[auth] credentials authorize failed:",
            error instanceof Error ? error.message : error
          );
          throw error;
        }
      },
    }),
    Credentials({
      id: "guest",
      credentials: {},
      async authorize() {
        try {
          const [guestUser] = await createGuestUser();
          return {
            ...guestUser,
            type: "guest",
            plan: "free",
            planExpiresAt: null,
            isAnonymous: true,
          };
        } catch (error) {
          console.error(
            "[auth] guest authorize failed:",
            error instanceof Error ? error.message : error
          );
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, account, trigger }) {
      if (user) {
        token.id = user.id as string;
        token.type = user.type;
        token.plan = user.plan ?? "free";
        token.planExpiresAt = user.planExpiresAt
          ? new Date(user.planExpiresAt).toISOString()
          : null;
        token.isAnonymous = user.isAnonymous ?? user.type === "guest";
      }

      if (account?.provider === "google") {
        token.type = "regular";
        token.isAnonymous = false;
        if (token.email) {
          const users = await getUser(token.email);
          if (users.length > 0) {
            token.id = users[0].id;
            token.plan = users[0].plan ?? "free";
            token.planExpiresAt = users[0].planExpiresAt
              ? users[0].planExpiresAt.toISOString()
              : null;
          }
        }
      }

      if (trigger === "update" && token.id) {
        const refreshed = await getUserById(token.id);
        if (refreshed) {
          token.plan = refreshed.plan ?? "free";
          token.planExpiresAt = refreshed.planExpiresAt
            ? refreshed.planExpiresAt.toISOString()
            : null;
          token.isAnonymous = refreshed.isAnonymous;
        }
      }

      return token;
    },
    async signIn({ account, profile }) {
      if (account?.provider === "google" && profile?.email) {
        try {
          const existingUsers = await getUser(profile.email);

          if (existingUsers.length === 0) {
            await createUser(profile.email);
          }

          return true;
        } catch (error) {
          console.error("[auth] google signIn failed:", error);
          return false;
        }
      }

      return true;
    },
  },
});
