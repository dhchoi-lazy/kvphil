// Import necessary modules
import { Prisma, User, Message, Suggestion } from "@prisma/client";
import { genSaltSync, hashSync } from "bcrypt-ts";
import { db } from "@/lib/db";
// Function to get a user by email
export async function getUser(email: string): Promise<User | null> {
  try {
    return await db.user.findUnique({
      where: { email },
    });
  } catch (error) {
    console.error("Failed to get user from database", error);
    throw error;
  }
}

// Function to create a new user
export async function createUser(email: string, password: string) {
  const salt = genSaltSync(10);
  const hash = hashSync(password, salt);

  try {
    return await db.user.create({
      data: {
        email,
        password: hash,
      },
    });
  } catch (error) {
    console.error("Failed to create user in database", error);
    throw error;
  }
}

// Function to save a new chat
export async function saveChat({
  id,
  userId,
  title,
  philosopherId,
}: {
  id: string;
  userId: string;
  title: string;
  philosopherId: string;
}) {
  try {
    return await db.chat.create({
      data: {
        id,
        createdAt: new Date(),
        userId,
        title,
        philosopherId,
      },
    });
  } catch (error) {
    console.error("Failed to save chat in database:", {
      message: error instanceof Error ? error.message : "Unknown error",
      error,
    });
    throw error;
  }
}

// Function to delete a chat by ID
export async function deleteChatById({ id }: { id: string }) {
  try {
    await db.vote.deleteMany({
      where: { chatId: id },
    });
    await db.message.deleteMany({
      where: { chatId: id },
    });
    return await db.chat.delete({
      where: { id },
    });
  } catch (error) {
    console.error("Failed to delete chat by id from database", error);
    throw error;
  }
}

// Function to get chats by user ID
export async function getChatsByUserId({ id }: { id: string }) {
  try {
    return await db.chat.findMany({
      where: { userId: id },
      orderBy: {
        createdAt: "desc",
      },
    });
  } catch (error) {
    console.error("Failed to get chats by user from database", error);
    throw error;
  }
}

// Function to get a chat by ID
export async function getChatById({ id }: { id: string }) {
  try {
    return await db.chat.findUnique({
      where: { id },
      include: {
        philosopher: true,
      },
    });
  } catch (error) {
    console.error("Failed to get chat by id from database", error);
    throw error;
  }
}

// Function to save multiple messages
export async function saveMessages({ messages }: { messages: Message[] }) {
  try {
    if (messages === null) {
      return;
    } else {
      const formattedMessages = messages.map((message) => ({
        ...message,
        content: message.content as Prisma.InputJsonValue,
        references: message.references
          ? (message.references as Prisma.InputJsonValue)
          : [],
      }));

      return await db.message.createMany({
        data: formattedMessages,
      });
    }
  } catch (error) {
    console.error("Failed to save messages in database", error);
    throw error;
  }
}

// Function to get messages by chat ID
export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await db.message.findMany({
      where: { chatId: id },
      orderBy: {
        createdAt: "asc",
      },
    });
  } catch (error) {
    console.error("Failed to get messages by chat id from database", error);
    throw error;
  }
}

// Function to vote on a message
export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: "up" | "down";
}) {
  try {
    const existingVote = await db.vote.findUnique({
      where: {
        chatId_messageId: {
          chatId,
          messageId,
        },
      },
    });

    if (existingVote) {
      return await db.vote.update({
        where: {
          chatId_messageId: {
            chatId,
            messageId,
          },
        },
        data: {
          isUpvoted: type === "up",
        },
      });
    } else {
      return await db.vote.create({
        data: {
          chatId,
          messageId,
          isUpvoted: type === "up",
        },
      });
    }
  } catch (error) {
    console.error("Failed to upvote message in database", error);
    throw error;
  }
}

// Function to get votes by chat ID
export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await db.vote.findMany({
      where: { chatId: id },
    });
  } catch (error) {
    console.error("Failed to get votes by chat id from database", error);
    throw error;
  }
}

// Function to save a new document
export async function saveDocument({
  id,
  title,
  content,
  userId,
}: {
  id: string;
  title: string;
  content: string;
  userId: string;
}) {
  try {
    return await db.document.create({
      data: {
        id,
        createdAt: new Date(),
        title,
        content,
        userId,
      },
    });
  } catch (error) {
    console.error("Failed to save document in database", error);
    throw error;
  }
}

// Function to get documents by ID
export async function getDocumentsById({ id }: { id: string }) {
  try {
    return await db.document.findMany({
      where: { id },
      orderBy: {
        createdAt: "asc",
      },
    });
  } catch (error) {
    console.error("Failed to get documents by id from database", error);
    throw error;
  }
}

// Function to get the latest document by ID
export async function getDocumentById({ id }: { id: string }) {
  try {
    const documents = await db.document.findMany({
      where: { id },
      orderBy: {
        createdAt: "desc",
      },
      take: 1,
    });
    return documents[0];
  } catch (error) {
    console.error("Failed to get document by id from database", error);
    throw error;
  }
}

// Function to delete documents by ID after a specific timestamp
export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    await db.suggestion.deleteMany({
      where: {
        documentId: id,
        documentCreatedAt: {
          gt: timestamp,
        },
      },
    });

    await db.document.deleteMany({
      where: {
        id,
        createdAt: {
          gt: timestamp,
        },
      },
    });
  } catch (error) {
    console.error(
      "Failed to delete documents by id after timestamp from database",
      error
    );
    throw error;
  }
}

// Function to save multiple suggestions
export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Suggestion[];
}) {
  try {
    return await db.suggestion.createMany({
      data: suggestions,
    });
  } catch (error) {
    console.error("Failed to save suggestions in database", error);
    throw error;
  }
}

// Function to get suggestions by document ID
export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    return await db.suggestion.findMany({
      where: { documentId },
    });
  } catch (error) {
    console.error(
      "Failed to get suggestions by document id from database",
      error
    );
    throw error;
  }
}

// Function to get references by chat ID
export async function getReferencesByChatId({ chatId }: { chatId: string }) {
  try {
    return await db.message.findMany({
      where: { chatId },
      select: { references: true, id: true },
    });
  } catch (error) {
    console.error("Failed to get references by chat id from database", error);
    throw error;
  }
}
