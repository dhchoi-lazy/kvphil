import React, { useEffect, useState, useRef } from "react";

interface TypeWriterProps {
  text: string;
  interval?: number;
  startDelay?: number;
  onComplete?: () => void;
}

const TypeWriter: React.FC<TypeWriterProps> = ({
  text = "",
  interval = 100,
  startDelay = 500,
  onComplete,
}) => {
  const [currentIndex, setCurrentIndex] = useState(-1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const words = text.split(/\s+/);

  useEffect(() => {
    const typeWord = () => {
      if (currentIndex < words.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        timerRef.current = setTimeout(typeWord, interval);
      } else if (onComplete) {
        onComplete();
      }
    };

    timerRef.current = setTimeout(typeWord, startDelay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [words.length, interval, startDelay, currentIndex, onComplete]);

  return (
    <span className="inline-block">
      {words.map((word, index) => (
        <span
          key={index}
          className={
            index <= currentIndex
              ? "animate-fadeIn inline-block mr-1 text-lg font-semibold"
              : "opacity-0 inline-block mr-1 text-lg font-semibold"
          }
        >
          {word}
        </span>
      ))}
    </span>
  );
};

export default TypeWriter;
