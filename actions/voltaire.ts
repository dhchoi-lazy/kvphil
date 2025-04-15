"use server";
import { db } from "@/lib/db";

export async function getVoltaireSource(sourceId: string) {
  const source = await db.sources.findFirst({
    where: {
      philosopher_id: "voltaire",
      paragraph_id: sourceId,
    },
    select: {
      id: true,
      paragraph_id: true,
      paragraph: true,
      section_name: true,
    },
  });
  return source;
}
