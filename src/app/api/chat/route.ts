import { convertToCoreMessages } from "ai";

import { auth } from "@/auth";
import { models } from "@/lib/ai/models";
import { deleteChatById, getChatById, saveMessages } from "@/lib/db/queries";
import { generateUUID, getMostRecentUserMessage } from "@/lib/utils";
import { generateTitleFromUserMessage } from "@/actions/actions";
import { saveChat } from "@/lib/db/queries";
import { Prisma } from "@prisma/client";

export const maxDuration = 60;

export async function POST(request: Request) {
  const { id, messages, modelId, philosopher } = await request.json();

  const session = await auth();

  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!id || !messages) {
    return new Response("Missing required fields", { status: 400 });
  }

  const model = models.find((model) => model.id === modelId);

  if (!model) {
    return new Response("Model not found", { status: 404 });
  }

  const coreMessages = convertToCoreMessages(messages);
  const userMessage = getMostRecentUserMessage(coreMessages);

  if (!userMessage) {
    return new Response("No user message found", { status: 400 });
  }

  const chat = await getChatById({ id });

  if (!chat) {
    const chatData = {
      id,
      userId: session.user.id,
      title:
        (await generateTitleFromUserMessage({ message: userMessage })) ||
        "New Chat",
    };

    await saveChat({ ...chatData, philosopherId: philosopher.id });
  }

  await saveMessages({
    messages: [
      {
        ...userMessage,
        id: generateUUID(),
        createdAt: new Date(),
        chatId: id,
        content: userMessage.content as Prisma.JsonValue,
        references: [],
      },
    ],
  });

  const requestMessages = coreMessages
    .map((message) => {
      if (message.role === "user" || message.role === "assistant") {
        return {
          role: message.role,
          content: JSON.stringify(message.content),
        };
      }
    })
    .filter((message) => message !== undefined);

  const requestBody = {
    id,
    messages: requestMessages,
  };

  const backendUrl =
    process.env.NODE_ENV === "development"
      ? "http://localhost:8080"
      : process.env.NEXT_PUBLIC_INTERNAL_API_URL;

  const response = await fetch(
    `${backendUrl}/api/chat?protocol=text&philosopher_name=${philosopher.name}&philosopher_id=${philosopher.id}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    }
  );

  return new Response(response.body, {
    status: 200,
    headers: {
      "x-documents": response.headers.get("x-documents") ?? "",
      "x-chat-id": id,
    },
  });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new Response("Not Found", { status: 404 });
  }

  const session = await auth();

  if (!session || !session.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const chat = await getChatById({ id });

    if (chat?.userId !== session.user.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    await deleteChatById({ id });

    return new Response("Chat deleted", { status: 200 });
  } catch (error) {
    return new Response(
      `An error occurred while processing your request: ${error}`,
      {
        status: 500,
      }
    );
  }
}
