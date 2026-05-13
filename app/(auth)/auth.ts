import { compare } from "bcrypt-ts";
import NextAuth, { type DefaultSession } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import { DUMMY_PASSWORD } from "@/lib/constants";
import { createGuestUser, createUser, getUser } from "@/lib/db/queries";
import type { UserPlan } from "@/lib/db/schema";
import { authConfig } from "./auth.config";

export type UserType = "guest" | "regular";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      type: UserType;
      plan: UserPlan;
      isAnonymous: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id?: string;
    email?: string | null;
    type: UserType;
    plan?: UserPlan;
    isAnonymous?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    type: UserType;
    plan: UserPlan;
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
    ...(authConfig.providers || []),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials.email ?? "");
        const password = String(credentials.password ?? "");
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
          isAnonymous: user.isAnonymous,
        };
      },
    }),
    Credentials({
      id: "guest",
      credentials: {},
      async authorize() {
        const [guestUser] = await createGuestUser();
        return {
          ...guestUser,
          type: "guest",
          plan: "free",
          isAnonymous: true,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id as string;
        token.type = user.type;
        token.plan = user.plan ?? "free";
        token.isAnonymous = user.isAnonymous ?? user.type === "guest";
      }
      if (account && account.provider === "google") {
        token.type = "regular";
        token.isAnonymous = false;
        if (token.email) {
          const users = await getUser(token.email);
          if (users.length > 0) {
            token.id = users[0].id;
            token.plan = users[0].plan ?? "free";
          }
        }
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.type = token.type;
        session.user.plan = token.plan ?? "free";
        session.user.isAnonymous =
          token.isAnonymous ?? token.type === "guest";
      }

      return session;
    },
    async signIn({ user, account, profile }) {
      // Allow credentials provider
      if (!account) {
        return true;
      }

      // Handle OAuth provider (Google)
      if (account.provider === "google" && profile?.email) {
        try {
          const existingUsers = await getUser(profile.email);

          if (existingUsers.length === 0) {
            // Create new user from Google profile
            await createUser(profile.email, "");
          }

          return true;
        } catch (error) {
          console.error("Error in signIn callback:", error);
          return false;
        }
      }

      return true;
    },
  },
});
