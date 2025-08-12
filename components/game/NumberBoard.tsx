"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { LETTER_COLORS, getLetterForNumber } from "./constants";

interface NumberBoardProps {
  calledNumbers: number[];
  currentNumber: number | null;
  reset: boolean;
  isVisible: boolean;
}

export default function NumberBoard({
  calledNumbers,
  currentNumber,
  reset,
  isVisible,
}: NumberBoardProps) {
  const allNumbers = useMemo(
    () => Array.from({ length: 75 }, (_, i) => i + 1),
    []
  );
  const [highlightedNumbers, setHighlightedNumbers] = useState<number[]>([]);
  const [shuffleIntensity, setShuffleIntensity] = useState(0);
  const [shufflingNumbers, setShufflingNumbers] = useState<number[]>([]);

  useEffect(() => {
    if (!reset) {
      setHighlightedNumbers([]);
      setShuffleIntensity(0);
      setShufflingNumbers([]);
      return;
    }

    // Ramp up shuffle intensity
    const intensityInterval = setInterval(() => {
      setShuffleIntensity((prev) => Math.min(prev + 0.1, 1));
    }, 100);

    // Shuffling effect with number changes
    const shuffleInterval = setInterval(() => {
      const count = Math.floor(5 + shuffleIntensity * 20); // 5-25 numbers flashing
      const newHighlighted = [];
      const newShufflingNumbers = [];

      for (let i = 0; i < count; i++) {
        const randomIndex = Math.floor(Math.random() * 75);
        newHighlighted.push(allNumbers[randomIndex]);

        // Generate random numbers for shuffling effect
        const randomNumber = Math.floor(Math.random() * 75) + 1;
        newShufflingNumbers.push(randomNumber);
      }

      setHighlightedNumbers(newHighlighted);
      setShufflingNumbers(newShufflingNumbers);
    }, 100 - shuffleIntensity * 80); // Speed up from 100ms to 20ms

    return () => {
      clearInterval(intensityInterval);
      clearInterval(shuffleInterval);
    };
  }, [reset, shuffleIntensity, allNumbers]);

  const LETTER_BG_COLORS = {
    B: "bg-yellow-500",
    I: "bg-blue-500",
    N: "bg-red-500",
    G: "bg-green-500",
    O: "bg-orange-500",
  };

  return (
    <div className="flex gap-2 bg-gray-200 items-center h-full">
      <div className="flex flex-col p-2  justify-around items-center h-full  text-xl ">
        {["B", "I", "N", "G", "O"].map((letter) => (
          <div
            key={letter}
            className="w-[50px] h-[50px]  bg-white ring-8 ring-orange-500 flex items-center justify-center font-bold "
          >
            <h1 className=" bg-white  text-gray-800 font-bold text-2xl font-potta-one flex items-center justify-center ">
              {letter}
            </h1>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-15 gap-y-1">
        {allNumbers.map((num, index) => {
          const letter = getLetterForNumber(num);
          const isCalled = calledNumbers.includes(num);
          const isCurrent = currentNumber === num;
          const isHighlighted = highlightedNumbers.includes(num);
          const letterColor =
            LETTER_COLORS[letter as keyof typeof LETTER_COLORS];

          // Determine text color
          let textColor = "text-gray-200";
          if (!reset && isCalled) {
            textColor =
              letterColor.split(" ").find((c) => c.startsWith("text-")) ||
              "text-white";
          } else if (reset && isHighlighted) {
            textColor = "text-white";
          }

          // Get the shuffling number for this position if it's highlighted
          const shufflingNumber =
            isHighlighted && shufflingNumbers.length > 0
              ? shufflingNumbers[
                  Math.min(
                    index % shufflingNumbers.length,
                    shufflingNumbers.length - 1
                  )
                ]
              : num;

          return (
            <div
              key={num}
              className={cn(
                "w-[62px] h-[67px] flex items-center justify-center  text-3xl font-bold",
                reset
                  ? "transition-colors duration-75"
                  : "transition-colors duration-300",
                reset && "scale-up-down",
                reset && isHighlighted && "text-shadow-white-glow"
              )}
              style={{
                transform:
                  reset && isHighlighted
                    ? `scale(${1 + shuffleIntensity * 0.1})`
                    : "scale(1)",
              }}
            >
              <div
                className={cn(
                  "relative w-[50px] h-[50px] bg-gray-200 flex text-4xl items-center justify-center overflow-hidden shadow-inner font-bold transition-all duration-300",
                  isCalled
                    ? "ring-4 ring-orange-500 text-black shadow-lg"
                    : " text-gray-500 ",
                  isCurrent && "animate-bounce"
                )}
              >
                <div
                  className={cn(
                    "absolute w-[60%] h-[60%] -top-[20%] -left-[20%] rounded-full pointer-events-none",
                    isCalled ? "bg-black/10" : "bg-white/20 blur-sm"
                  )}
                />
                <span className="relative stroke-white ">
                  {reset && isHighlighted ? shufflingNumber : num}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
