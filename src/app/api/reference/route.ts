import { NextRequest, NextResponse } from "next/server";
import { getReferencesByChatId } from "@/lib/db/queries";
export async function GET(request: NextRequest) {
  const chatId = request.nextUrl.searchParams.get("chatId");
  if (!chatId) {
    return NextResponse.json({ error: "Chat ID is required" }, { status: 400 });
  }
  const references = await getReferencesByChatId({ chatId });

  return NextResponse.json(references);
}
