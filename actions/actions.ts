"use server";

import { type CoreUserMessage } from "ai";
import { cookies } from "next/headers";
import { signOut } from "@/auth";
import { DEFAULT_LOGOUT_REDIRECT } from "@/routes";
export async function saveModelId(model: string) {
  const cookieStore = await cookies();
  cookieStore.set("model-id", model);
}

export async function generateTitleFromUserMessage({
  message,
}: {
  message: CoreUserMessage;
}) {
  const backendUrl =
    process.env.NODE_ENV === "development"
      ? "http://localhost:8080"
      : process.env.NEXT_PUBLIC_INTERNAL_API_URL;
  const response = await fetch(`${backendUrl}/api/chat/generate_title`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message: message.content }),
  });
  const data = await response.json();
  const title = data.title;

  return title;
}

export async function serverSignOut() {
  await signOut({
    redirect: true,
    redirectTo: `${
      process.env.NEXT_PUBLIC_BASE_PATH || ""
    }${DEFAULT_LOGOUT_REDIRECT}`,
  });
}
