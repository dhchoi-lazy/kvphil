"use client";

import { Button } from "@/components/ui/button";
import { Poppins } from "next/font/google";
import { cn } from "@/lib/utils";
import { LoginButton } from "@/components/auth/login-button";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600"],
});

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center overflow-hidden">
      <div className="relative z-10 flex flex-col items-center space-y-8 text-center bg-gradient-to-br  rounded-xl backdrop-blur-sm">
        <LoginButton asChild>
          <Button
            variant="secondary"
            size="lg"
            className={cn(
              "text-xl px-8 py-4 bg-white text-gray-900 border-2 border-white hover:bg-transparent hover:text-white transition-all duration-300 mt-8 rounded-full shadow-lg",
              poppins.className
            )}
          >
            Sign in
          </Button>
        </LoginButton>
      </div>
    </main>
  );
}
