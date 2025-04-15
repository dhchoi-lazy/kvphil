import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import authConfig from "./auth.config";
const prisma = new PrismaClient();
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role?: string;
  }
  interface Session {
    user: DefaultSession["user"] & {
      role?: string;
    };
  }
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  debug: true,

  pages: {
    signIn: `/auth/login`,
    error: `/auth/error`,
  },

  callbacks: {
    async signIn({ account }) {
      if (account?.provider !== "credentials") return true;

      return true;
    },

    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }

      if (trigger === "update" && session?.user) {
        token.name = session.user.name;
        token.email = session.user.email;
        token.role = session.user.role;
      }

      return token;
    },

    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      if (token.role && session.user) {
        session.user.role = token.role as string;
      }

      if (session.user && token.name && token.email) {
        session.user.name = token.name as string;
        session.user.email = token.email;
      }

      return session;
    },
  },
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7,
  },
  ...authConfig,
});
