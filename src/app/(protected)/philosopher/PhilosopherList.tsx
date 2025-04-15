"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Philosopher } from "@prisma/client";

interface PhilosophersListProps {
  philosophers: Philosopher[];
}

export function PhilosophersList({ philosophers }: PhilosophersListProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-wrap -mx-4">
        {philosophers.map((philosopher) => (
          <div key={philosopher.id} className="w-full sm:w-1/2 px-4 mb-8">
            <Link
              href={`/philosopher/${philosopher.id}/`}
              className="block transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <Card className="overflow-hidden h-full flex flex-col ">
                <div className="relative h-[300px] w-[300px] mx-auto">
                  <Image
                    src={`${
                      process.env.NEXT_PUBLIC_BASE_PATH || "/kvphil"
                    }/images${philosopher.image}`}
                    alt={philosopher.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority
                  />
                </div>
                <CardContent className="bg-secondary p-6">
                  <CardHeader className="p-0">
                    <CardTitle className="text-center text-2xl font-bold">
                      {philosopher.name}
                    </CardTitle>
                  </CardHeader>
                </CardContent>
              </Card>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
