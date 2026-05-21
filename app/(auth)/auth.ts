import { compare } from "bcrypt-ts";
import NextAuth, { type DefaultSession } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { isAdminEmail } from "@/lib/admin/allowed-emails";
import { getGoogleProfileFields } from "@/lib/auth/google-profile";
import { DUMMY_PASSWORD } from "@/lib/constants";
import {
  createGuestUser,
  createUser,
  getUser,
  getUserById,
  updateUserProfileFromOAuth,
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
    invalidUser?: boolean;
    userValidatedAt?: number;
  }
}

const USER_VALIDATION_INTERVAL_MS = 5 * 60 * 1000;

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
      id: "admin",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials.email ?? "").trim().toLowerCase();
        const password = String(credentials.password ?? "");

        if (!isAdminEmail(email)) {
          await compare(password, DUMMY_PASSWORD);
          return null;
        }

        try {
          const users = await getUser(email);

          if (users.length === 0) {
            await compare(password, DUMMY_PASSWORD);
            return null;
          }

          const [dbUser] = users;

          if (!dbUser.password) {
            await compare(password, DUMMY_PASSWORD);
            return null;
          }

          const passwordsMatch = await compare(password, dbUser.password);

          if (!passwordsMatch) {
            return null;
          }

          return {
            ...dbUser,
            type: "regular",
            plan: dbUser.plan,
            planExpiresAt: dbUser.planExpiresAt,
            isAnonymous: false,
          };
        } catch (error) {
          console.error(
            "[auth] admin authorize failed:",
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

      const shouldValidateUser =
        token.id &&
        (Boolean(user) ||
          trigger === "update" ||
          typeof token.userValidatedAt !== "number" ||
          Date.now() - token.userValidatedAt > USER_VALIDATION_INTERVAL_MS);

      if (shouldValidateUser && token.id) {
        const dbUser = await getUserById(token.id);
        token.userValidatedAt = Date.now();

        if (!dbUser) {
          token.invalidUser = true;
          return token;
        }

        token.invalidUser = false;
        token.plan = dbUser.plan ?? "free";
        token.planExpiresAt = dbUser.planExpiresAt
          ? dbUser.planExpiresAt.toISOString()
          : null;
        token.isAnonymous = dbUser.isAnonymous;
      }

      return token;
    },
    session({ session, token }) {
      if (token.invalidUser) {
        return null as never;
      }

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
    async signIn({ account, profile }) {
      if (account?.provider === "google" && profile?.email) {
        try {
          const email = profile.email;
          const oauthProfile = getGoogleProfileFields(profile);
          const existingUsers = await getUser(email);

          if (existingUsers.length === 0) {
            await createUser(email, undefined, oauthProfile);
          } else {
            await updateUserProfileFromOAuth(existingUsers[0].id, oauthProfile);
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
