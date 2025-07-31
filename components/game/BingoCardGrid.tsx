"use client";

import { bingoCardsSet1 } from "@/lib/bingoData";
import { cn } from "@/lib/utils";
import { BingoCard, CardSetId } from "@/types/types";

// Map card set ids to actual card arrays
const CARD_SETS: Record<CardSetId, BingoCard[]> = {
  set1: bingoCardsSet1,
  set2: bingoCardsSet1,
  set3: bingoCardsSet1,
  set4: bingoCardsSet1,
  set5: bingoCardsSet1,
  set6: bingoCardsSet1,
};

interface BingoCardGridProps {
  cardSetId: CardSetId;
  calledNumbers: number[];
}

export const BingoCardGrid = ({
  cardSetId,
  calledNumbers,
}: BingoCardGridProps) => {
  const currentCardSet = CARD_SETS[cardSetId];
  const card = currentCardSet[0];

  if (!card) {
    return <div className="text-red-500">Card not found</div>;
  }

  return (
    <div className="grid grid-cols-5 gap-1 mb-1 text-center font-bold w-fit">
      <div className="bg-blue-500 text-white p-1 rounded">B</div>
      <div className="bg-red-500 text-white p-1 rounded">I</div>
      <div className="bg-green-500 text-white p-1 rounded">N</div>
      <div className="bg-yellow-600 text-white p-1 rounded">G</div>
      <div className="bg-purple-500 text-white p-1 rounded">O</div>

      {Array.from({ length: 5 }).map((_, rowIndex) =>
        ["B", "I", "N", "G", "O"].map((letter) => {
          const column = letter as keyof BingoCard;
          const columnNumbers = card[column] as number[]; // Tell TS this is a number[]
          const num = columnNumbers[rowIndex];

          return (
            <div
              key={`${letter}-${rowIndex}`}
              className={cn(
                "border p-1 text-center border-gray-700 font-normal",
                num === 0 ? "bg-yellow-600 text-black" : "",
                num !== undefined && calledNumbers.includes(num)
                  ? "bg-cyan-600 text-white"
                  : ""
              )}
            >
              {num === 0 ? (
                <div className="text-xs leading-tight">
                  FREE
                  <br />
                  SPACE
                </div>
              ) : (
                num
              )}
            </div>
          );
        })
      )}
    </div>
  );
};
