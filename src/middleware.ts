import {
  DEFAULT_LOGIN_REDIRECT,
  apiAuthPrefix,
  authRoutes,
  publicRoutes,
} from "@/routes";
import authConfig from "../auth.config";
import NextAuth from "next-auth";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

  const pathWithoutBase = nextUrl.pathname.replace(basePath, "") || "/";

  const isLoggedIn = !!req.auth;
  const isApiAuthRoute = pathWithoutBase.startsWith(apiAuthPrefix);
  const isPublicRoute = publicRoutes.includes(pathWithoutBase);
  const isAuthRoute = authRoutes.includes(pathWithoutBase);

  if (isApiAuthRoute) {
    return;
  }

  if (isAuthRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(
        new URL(`${basePath}${DEFAULT_LOGIN_REDIRECT}`, req.url)
      );
    }
    return;
  }

  if (!isLoggedIn && !isPublicRoute) {
    // Only include the path after basePath in the callback
    const callbackUrl = encodeURIComponent(pathWithoutBase + nextUrl.search);
    return NextResponse.redirect(
      new URL(`${basePath}/auth/login?callbackUrl=${callbackUrl}`, req.url)
    );
  }

  if (isLoggedIn && isPublicRoute) {
    return NextResponse.redirect(
      new URL(`${basePath}${DEFAULT_LOGIN_REDIRECT}`, req.url)
    );
  }

  return;
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
};
