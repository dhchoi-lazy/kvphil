"use server";
import { db } from "@/lib/db";

export async function getPhilosophers() {
  const philosophers = await db.philosopher.findMany();
  return philosophers;
}

export async function getPhilosopher(id: string) {
  const philosopher = await db.philosopher.findUnique({
    where: { id },
  });

  return philosopher;
}
