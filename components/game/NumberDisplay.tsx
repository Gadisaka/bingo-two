"use client";

import { cn } from "@/lib/utils";
import { BG_COLORS, BORDER_COLORS, getLetterForNumber } from "./constants";

interface NumberDisplayProps {
  currentNumber: number | null;
  calledNumbers: number[];
  previousNumbers: number[];
}

export const NumberDisplay = ({
  currentNumber,
  previousNumbers,
  calledNumbers,
}: NumberDisplayProps) => {
  return (
    <div className="flex flex-col items-center">
      <div
        className={cn(
          "relative w-48 h-48 rounded-full flex items-center justify-center shadow-md",
          currentNumber
            ? BG_COLORS[getLetterForNumber(currentNumber)]
            : "bg-gray-500"
        )}
      >
        <div className="relative w-36 h-36 rounded-full bg-gradient-to-br from-white via-slate-200 to-slate-500 flex items-center justify-center shadow-inner overflow-hidden">
          {/* Optional top-left shine */}
          <div className="absolute w-3/4 h-3/4 top-[-10%] left-[-10%] rounded-full bg-white/20 blur-sm pointer-events-none z-0" />

          {/* Decorative border ring */}
          <div
            className={cn(
              "absolute inset-0 m-1 rounded-full border-2 z-1",
              currentNumber
                ? BORDER_COLORS[getLetterForNumber(currentNumber)]
                : "border-gray-500"
            )}
          ></div>

          {/* Number and Letter */}
          <div className="relative text-center z-10">
            <div className="text-black text-2xl font-bold leading-none">
              {currentNumber && getLetterForNumber(currentNumber)}
            </div>
            <div className="text-black text-5xl font-bold leading-none">
              {currentNumber ? currentNumber : "?"}
            </div>
          </div>
        </div>
      </div>
      <div className="text-center">
        <div className="w-44 h-14 bg-gradient-to-b  from-blue-700 to-blue-800 rounded border-4 border-slate-300 shadow-inner flex items-center justify-center text-white font-bold font-acme text-4xl">
          {calledNumbers.length}
          <span className="mx-1 text-white">/</span>75
        </div>
      </div>

      <div className="flex flex-col items-center mt-2">
        <div className="flex flex-wrap justify-center gap-2 mb-2">
          {previousNumbers.map((num, index) => {
            const letter = getLetterForNumber(num);
            return (
              <div
                key={index}
                className={cn(
                  "relative w-16 h-16 rounded-full flex items-center justify-center shadow-md",
                  BG_COLORS[letter]
                )}
              >
                <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-white via-slate-200 to-slate-500 flex items-center justify-center shadow-inner overflow-hidden">
                  {/* Optional highlight glare */}
                  <div className="absolute w-3/4 h-3/4 top-[-10%] left-[-10%] rounded-full bg-white/20 blur-sm pointer-events-none z-0" />

                  {/* Decorative border */}
                  <div
                    className={cn(
                      "absolute inset-0 m-1 rounded-full border-2 z-1",
                      BORDER_COLORS[letter]
                    )}
                  ></div>

                  {/* Letter + Number Content */}
                  <div className="relative text-center z-10">
                    <div className="text-black font-bold leading-none">
                      {letter}
                    </div>
                    <div className="text-black font-bold leading-none">
                      {num}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
