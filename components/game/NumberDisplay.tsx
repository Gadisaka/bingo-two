"use client";

import { cn } from "@/lib/utils";
import { BG_COLORS, BORDER_COLORS, getLetterForNumber } from "./constants";

interface NumberDisplayProps {
  previousNumbers: number[];
  calledNumbers: number[];
  currentNumber: number | null;
}

export const NumberDisplay = ({
  previousNumbers,
  calledNumbers,
  currentNumber,
}: NumberDisplayProps) => {
  return (
    <div className="relative flex flex-col items-center">
      {/* Background Image Container */}
      <div className="relative w-80 h-100">
        <img
          src="/number_extract_bg.png"
          alt="bg"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        />

        {/* Big Number Overlay - Centered in the circular part */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center z-10">
            <div className="text-white text-[150px] mb-5 font-bold leading-none drop-shadow-2xl">
              {currentNumber ? currentNumber : "?"}
            </div>
          </div>
        </div>

        {/* Counter Overlay - Positioned in the rectangular card part */}
        <div className="absolute bottom-12 left-0 right-0 flex items-center justify-center pb-4">
          <div className="text-center z-10">
            <div className="text-white text-4xl font-bold drop-shadow-lg">
              {calledNumbers.length}
              <span className="mx-1">/</span>75
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
