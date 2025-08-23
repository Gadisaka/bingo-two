"use client";

import { cn } from "@/lib/utils";
import { BG_COLORS, BORDER_COLORS, getLetterForNumber } from "./constants";

interface NumberDisplayProps {
  previousNumbers: number[];
  calledNumbers: number[];
  currentNumber: number | null;
}

const getNumberColor = (number: number | null) => {
  if (!number) return "bg-gray-400";

  if (number <= 15) return "bg-blue-500"; // B column
  if (number <= 30) return "bg-red-500"; // I column
  if (number <= 45) return "bg-green-500"; // N column
  if (number <= 60) return "bg-yellow-500"; // G column
  if (number <= 75) return "bg-purple-500"; // O column

  return "bg-gray-400";
};

export const NumberDisplay = ({
  previousNumbers,
  calledNumbers,
  currentNumber,
}: NumberDisplayProps) => {
  return (
    <div className="relative font-varsity flex flex-col items-center">
      {/* Background Image Container */}
      <div className="relative w-88 h-88">
        <img
          src="/number_extract_bg.png"
          alt="bg"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none z-20 "
        />

        {/* Big Number Overlay - Centered in the circular part */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center z-10">
            {/* Layered circles */}
            <div
              key={currentNumber}
              className="relative w-72 mb-4 h-72 flex items-center justify-center animate-slideInFromLeft"
            >
              {/* Outer colored circle */}
              <div
                className={`absolute inset-0 rounded-full ${getNumberColor(
                  currentNumber
                )}`}
              ></div>
              {/* Thin white circle */}
              <div className="absolute inset-9 rounded-full bg-white"></div>
              {/* Thin colored circle */}
              <div
                className={`absolute inset-10 rounded-full ${getNumberColor(
                  currentNumber
                )}`}
              ></div>
              {/* White background for number */}
              <div className="absolute inset-12 rounded-full bg-white flex items-center justify-center">
                <div className="relative w-full h-full flex items-center justify-center">
                  <span className="text-black text-[140px] font-bold">
                    {currentNumber ? currentNumber : "?"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Counter Overlay - Positioned in the rectangular card part */}
        <div className="absolute bottom-2 z-20 left-0 right-0 flex items-center justify-center pb-4">
          <div className="text-center z-10">
            <div className="text-white text-5xl font-bold drop-shadow-lg">
              {calledNumbers.length}
              <span className="mx-1">/</span>75
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
