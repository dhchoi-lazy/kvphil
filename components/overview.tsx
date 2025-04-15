"use client";

import { motion } from "framer-motion";
import TypeWriter from "@/components/type-writer";
import Image from "next/image";
import type { Philosopher } from "@prisma/client";

export const Overview = ({ philosopher }: { philosopher: Philosopher }) => {
  const text = `Hey there, great to meet you. I'm ${philosopher.name}, your personal AI Philosopher. My goal is to be useful, friendly and fun. Ask me for advice, for answers, or let's talk about whatever's on your mind. What do you want to know about me?`;

  return (
    <motion.div
      key="overview"
      className="max-w-3xl mx-auto md:mt-20"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: 0.5 }}
    >
      <div className="flex flex-col items-center justify-center">
        <Image
          src={`${process.env.NEXT_PUBLIC_BASE_PATH || "/kvphil"}/images${
            philosopher.image
          }`}
          alt={philosopher.name}
          width={240}
          height={240}
        />
      </div>
      <div className="rounded-xl p-6 flex flex-col gap-8 leading-relaxed text-center max-w-xl">
        <TypeWriter text={text} interval={100} startDelay={100} />
      </div>
    </motion.div>
  );
};
