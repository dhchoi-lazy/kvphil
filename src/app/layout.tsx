import type { Metadata } from "next";
import { SWRProvider } from "./swr-provider";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import localFont from "next/font/local";

const IMFellEnglish = localFont({
  src: [
    { path: "./fonts/IMFellEnglish-Regular.ttf", weight: "400" },
    {
      path: "./fonts/IMFellEnglish-Italic.ttf",
      weight: "400",
      style: "italic",
    },
  ],

  display: "swap",
});

export const metadata: Metadata = {
  title: "Virtual Philosophers",
  description: "",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <SessionProvider session={session} basePath="/kvphil/api/auth">
      <SWRProvider>
        <html lang="en">
          <body
            className={`${IMFellEnglish.className} min-h-screen items-center justify-center bg-background overflow-scroll `}
          >
            {children}
            <Toaster />
          </body>
        </html>
      </SWRProvider>
    </SessionProvider>
  );
}
