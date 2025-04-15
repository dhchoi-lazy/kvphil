import { UserRole } from "@prisma/client";

import NextAuth, { type DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: ExtendedUser;
  }
}

export type ExtendedUser = DefaultSession["user"] & {
  role: UserRole;
};
