"use client";

import { bingoCardsSet1, bingoCardsSet2, bingoCardsSet3 ,bingoCardsSet4,bingoCardsSet5,bingoCardsSet6} from "@/lib/bingoData"; // assuming BingoCard type is here
import Image from "next/image";
import { BingoCardGrid } from "./BingoCardGrid";
import { BingoPatternVisualizer } from "./ShowPattern";
import { useState } from "react";
import { Gamepad } from "lucide-react";
import { BingoCard, BingoPattern, CardSetId } from "@/types/types";

// Define allowed card set ids

// Map card set ids to actual card arrays
const CARD_SETS: Record<CardSetId, BingoCard[]> = {
  set1: bingoCardsSet1,
  set2: bingoCardsSet2,
  set3: bingoCardsSet3,
  set4: bingoCardsSet4,
  set5: bingoCardsSet5,
  set6: bingoCardsSet6,
};

interface GameStatsProps {
  calledCount: number;
  gamePattern: BingoPattern;
  calledNumbers: number[];
  previousNumber: number | null;
  selectedCardSetId: CardSetId; // restrict to allowed ids
}

export const GameStats = ({
  calledNumbers,
  calledCount,
  gamePattern,
  previousNumber,
  selectedCardSetId,
}: GameStatsProps) => {
  const [changeView, setChangeView] = useState(false);

  const currentCardSet = CARD_SETS[selectedCardSetId];
  const cardToShow = currentCardSet[0]; // first card in selected set

  return (
    <div className="w-full sm:w-1/6 flex flex-col items-center text-gray-400">
      <Image src="/logo.png" alt="logo" width={160} height={160} />

      <div className="flex justify-between w-full px-4">
        <div className="text-center">
          <div className="text-2xl font-bold p-1 rounded bg-gray-800">
            {calledCount}
          </div>
          <div className="text-xs mt-1">TOTAL CALLS</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold p-1 rounded bg-gray-800">
            {previousNumber || "--"}
          </div>
          <div className="text-xs mt-1">PREVIOUS</div>
        </div>
      </div>

      <div onClick={() => setChangeView(!changeView)} className="cursor-pointer">
        {changeView ? (
          <BingoCardGrid calledNumbers={calledNumbers} cardSetId={selectedCardSetId} />
        ) : (
          <BingoPatternVisualizer pattern={gamePattern || "1line"} />
        )}
      </div>

      <span className="flex gap-2 items-center mt-2">
        <Gamepad />
        {gamePattern}
      </span>
    </div>
  );
};
