"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Fullscreen, Mic, MicOff, Play, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { bingoCardsSet1 } from "@/lib/bingoData";
import { BingoCard } from "@/types/types";
import { toast } from "sonner";
import { Input } from "../ui/input";

const GAME_PATTERNS = [
  "1line",
  "2line",
  "3line",
  "diagonals",
  "outerSquare",
  "innerSquare",
  "x",
  // "Large4Corner",
  // "Small4Corner",
  // "AnyLineOrLarge4Corner",
  // "AnyLineOrSmall4Corner",
  // "L",
  // "T",
];

// gameStatus

const COMMISSIONS = [2];

const CARD_SETS = [{ id: "set1", label: "Default", cards: bingoCardsSet1 }];

interface setUpProps {
  onStart: () => void;
}

export default function GameSetup({ onStart }: setUpProps) {
  const [hydrated, setHydrated] = useState(false);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [betAmount, setBetAmount] = useState<number>(100);
  // const [commission, setCommission] = useState<number>(1);
  const [winning, setWinning] = useState<number>(0);
  const [inputCard, setInputCard] = useState<number>(0);
  const [gamePattern, setGamePattern] = useState<string>(GAME_PATTERNS[0]);
  const [showSelectedModal, setShowSelectedModal] = useState<boolean>(false);
  const [selectedCardSetId, setSelectedCardSetId] = useState<string>("set1");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [muted, setMuted] = useState(false);
  const audioRef = useRef(null);

  const toggleMute = () => {
    setMuted(!muted);
    if (audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted;
    }
  };

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("gameSetup");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed.selectedCards))
          setSelectedCards(parsed.selectedCards);
        if (typeof parsed.betAmount === "number")
          setBetAmount(parsed.betAmount);
        // if (typeof parsed.commission === "number")
        //   setCommission(parsed.commission);
        if (typeof parsed.gamePattern === "string")
          setGamePattern(parsed.gamePattern);
        if (typeof parsed.selectedCardSetId === "string")
          setSelectedCardSetId(parsed.selectedCardSetId);
      }
    } catch (err) {
      console.error("Failed to parse localStorage:", err);
    }
    setHydrated(true);
  }, []);

  // Recalculate winning whenever relevant state changes
  useEffect(() => {
    const newWinning =
      selectedCards.length * betAmount >= 100
        ? selectedCards.length * betAmount * 0.8
        : selectedCards.length * betAmount;
    setWinning(newWinning);
  }, [selectedCards, betAmount /*, commission*/]);

  // Save to localStorage on change
  useEffect(() => {
    if (!hydrated) return;

    const data = {
      selectedCards,
      betAmount,
      // commission,
      gamePattern,
      selectedCardSetId,
      winning:
        selectedCards.length * betAmount >= 100
          ? selectedCards.length * betAmount * 0.8
          : selectedCards.length * betAmount,
    };

    localStorage.setItem("gameSetup", JSON.stringify(data));
  }, [
    selectedCards,
    betAmount,
    /*commission,*/ gamePattern,
    hydrated,
    selectedCardSetId,
  ]);

  const toggleCardSelection = useCallback((cardId: number) => {
    setSelectedCards((prev) =>
      prev.includes(cardId)
        ? prev.filter((id) => id !== cardId)
        : [...prev, cardId]
    );
  }, []);

  const handleClear = () => {
    const confirmed = window.confirm(
      "Are you sure you want to clear all selected cards?"
    );
    if (!confirmed) return;

    setSelectedCards([]);
    toast.success("Cards cleared");
  };

  const handleStartGame = () => {
    if (selectedCards.length < 3) {
      toast.error("Select at least 3 cards to start");
      return;
    }
    toast.success("Game Ready to Start!");
    onStart();
  };

  const handleNextPage = () => {
    if (currentPage < 6) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Create all cards array from the sets
  const allCards: BingoCard[] = bingoCardsSet1;

  // Pick cards based on current page (100 cards per page)
  const startIndex = (currentPage - 1) * 100;
  const endIndex = startIndex + 100;
  const currentCards = allCards.slice(startIndex, endIndex);

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }

  // Listen for fullscreen changes (for outside changes)
  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  if (!hydrated) return null;

  return (
    <div className="flex flex-col justify-start items-center h-screen px-6 bg-[#09519E] relative overflow-hidden ">
      {/* Diamond Pattern Overlay */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-10"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <pattern
            id="diamondPattern"
            x="0"
            y="0"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M10 0 L20 10 L10 20 L0 10 Z"
              stroke="white"
              strokeWidth="0.5"
              fill="none"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#diamondPattern)" />
      </svg>
      <div className="flex justify-between w-full z-10 m-2 items-center">
        <div className="flex justify-center items-center gap-4">
          <button
            type="button"
            aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            className="yellow-card-button p-2"
            onClick={toggleFullscreen}
          >
            <Fullscreen className="h-10 w-10" />
          </button>
          <div className="flex flex-col justify-center items-center gap-2">
            <h1 className="text-xl white font-bold text-white font-potta-one">
              Game Speed
            </h1>
            <div className="counter-container">
              <button className="counter-button">-</button>
              <div className="counter-display-wrapper">
                <div className="counter-display px-6 py-2">3</div>
              </div>
              <button className="counter-button">+</button>
            </div>
          </div>
        </div>
        <h1 className="text-6xl  text-stroke-white font-bold my-3 z-10 text-orange-500 font-potta-one ">
          SELECT CARDS
        </h1>
        <div className="flex justify-center items-center gap-4">
          <button
            className="yellow-card-button p-3 text-3xl"
            onClick={toggleMute}
          >
            {muted ? "🔇" : "🔊"}
          </button>
        </div>
      </div>

      {/* Settings grid */}
      {/* <div className="flex justify-around z-10 items-center w-full gap-2 mb-3"> */}
      {/* Card Set Selector */}
      {/* <div>
          <Label className="text-[#1abc9c] font-semibold">Cartela</Label>
          <select
            value={selectedCardSetId}
            onChange={(e) => {
              const newSetId = e.target.value;
              const confirmed = window.confirm(
                "Changing the card set will clear all selected cards. Do you want to continue?"
              );
              if (confirmed) {
                setSelectedCardSetId(newSetId);
                setSelectedCards([]); // Clear selected cards when switching sets
              }
              // If not confirmed, do nothing — selection stays on old value
            }}
            className="w-full mt-2 p-2 bg-gray-900 border border-gray-700 rounded shadow text-white"
          >
            {CARD_SETS.map((set) => (
              <option key={set.id} value={set.id}>
                {set.label}
              </option>
            ))}
          </select>
        </div> */}

      {/* Commission selector commented out as requested */}
      {/* <div>
          <Label className="text-[#1abc9c] font-semibold">Commission</Label>
          <select
            value={commission}
            onChange={(e) => setCommission(Number(e.target.value))}
            className="w-full mt-2 p-2 bg-gray-900 border border-gray-700 rounded shadow text-white"
          >
            {COMMISSIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div> */}

      {/* <div className="flex flex-col justify-center  items-start">
          <label className="text-gray-800 text-md font-semibold">Game:</label>
          <input
            type="number"
            min={1}
            // value={betAmount}
            // onChange={(e) => setBetAmount(Number(e.target.value))}
            className="w-[100px]  py-1 px-4 border border-gray-700  shadow text-gray-700"
          />
        </div>
        <div className="flex flex-col justify-center  items-start">
          <label className="text-gray-800 text-md font-semibold">
            Bet birr:
          </label>
          <input
            type="number"
            min={1}
            value={betAmount}
            onChange={(e) => setBetAmount(Number(e.target.value))}
            className="w-[100px]  py-1 px-4 border border-gray-700  shadow text-gray-700"
          />
        </div>
        <div className="flex flex-col justify-center  items-start">
          <label className="text-gray-800 text-md font-semibold">
            No of Players:
          </label>
          <input
            type="number"
            min={1}
            value={selectedCards.length}
            // onChange={(e) => setBetAmount(Number(e.target.value))}
            className="w-[100px]  py-1 px-4 border border-gray-700  shadow text-gray-700"
          />
        </div>
        <div className="flex flex-col justify-center  items-start">
          <label className="text-gray-800 text-md font-semibold">
            Win Birr:
          </label>
          <input
            type="number"
            min={1}
            value={winning}
            // onChange={(e) => setBetAmount(Number(e.target.value))}
            className="w-[100px]  py-1 px-4 border border-gray-700  shadow text-gray-700"
          />
        </div>
        <div className="flex flex-col justify-center  items-start">
          <label className="text-gray-800 text-md font-semibold">Bonus:</label>
          <input type="checkbox" className="w-4 h-4" />
        </div>
        <div className="flex flex-col justify-center  items-start">
          <label className="text-gray-800 text-md font-semibold">
            Free Hit:
          </label>
          <input type="checkbox" className="w-4 h-4" />
        </div>

        <div className="flex  justify-center  items-end">
          <select
            value={gamePattern}
            onChange={(e) => setGamePattern(e.target.value)}
            className="w-[100px]  py-1 px-4 border bg-gray-300 border-gray-700  shadow text-gray-700"
          >
            {GAME_PATTERNS.map((pattern) => (
              <option key={pattern} value={pattern}>
                {pattern}
              </option>
            ))}
          </select>
        </div>
      </div> */}
      {/* Show Selected Modal Toggle */}
      {/* <div className="flex items-center gap-2 mb-2">
        <input
          id="showSelectedModalCheckbox"
          type="checkbox"
          checked={showSelectedModal}
          onChange={() => setShowSelectedModal((v) => !v)}
          className="accent-[#1abc9c]"
        />
        <label
          htmlFor="showSelectedModalCheckbox"
          className="text-sm text-gray-300 hover:text-[#1abc9c] cursor-pointer"
        >
          Show Selected
        </label>
      </div> */}

      {/* Selected Cards Modal */}
      {/* {showSelectedModal && (
        <div className="relative bg-gray-900 rounded-md shadow-lg w-full max-h-[50vh] overflow-y-auto p-2 mb-2">
          <p className="text-[#1abc9c] font-bold mb-2">
            Selected Cards ({selectedCards.length})
          </p>
          {selectedCards.length === 0 ? (
            <p className="text-gray-400">No cards selected.</p>
          ) : (
            <div className="flex gap-2 flex-wrap">
              {selectedCards.map((id) => (
                <div
                  key={id}
                  className="bg-cyan-600 text-white w-10 h-10 flex items-center justify-center rounded font-mono font-semibold"
                >
                  {id}
                </div>
              ))}
            </div>
          )}
        </div>
      )} */}

      {/* Action Buttons */}

      {/* Cards Grid */}
      <div className="flex justify-around w-full items-center">
        <div className="flex flex-col justify-center items-center gap-6">
          <div className="flex flex-col justify-center items-center gap-2">
            <h1 className="text-xl white font-bold text-white font-potta-one">
              Bonus Type
            </h1>
            <div className="counter-container">
              <button className="counter-button">-</button>
              <div className="counter-display-wrapper">
                <div className="counter-display px-6 py-2">10 call</div>
              </div>
              <button className="counter-button">+</button>
            </div>
          </div>
          <div className="flex flex-col justify-center items-center gap-2">
            <h1 className="text-xl white font-bold text-white font-potta-one">
              Bonus Amount
            </h1>
            <div className="counter-container">
              <button className="counter-button">-</button>
              <div className="counter-display-wrapper">
                <div className="counter-display px-6 py-2">100</div>
              </div>
              <button className="counter-button">+</button>
            </div>
          </div>
        </div>
        <div className="max-h-[320px] overflow-y-scroll bg-gray-800 z-50 border-gray-700 p-6 space-y-4">
          {Array.from(
            { length: Math.ceil(currentCards.length / 20) },
            (_, rowIndex) => {
              const startIdx = rowIndex * 20;
              const rowCards = currentCards.slice(startIdx, startIdx + 20);
              return (
                <div
                  key={rowIndex}
                  className="grid grid-cols-7 gap-2 "
                  aria-label={`Row ${rowIndex + 1} of cards`}
                >
                  {rowCards.map((card) => (
                    <div
                      className={`flex justify-center items-center w-26 h-26  rounded-full shadow-lg ${
                        selectedCards.includes(Number(card.id))
                          ? "bg-orange-500"
                          : "bg-gray-300"
                      }`}
                    >
                      <div className="flex justify-center items-center w-25 h-25 bg-gray-800 rounded-full">
                        <button
                          key={card.id}
                          type="button"
                          onClick={() => toggleCardSelection(Number(card.id))}
                          className={cn(
                            "w-20 h-20 rounded-full  text-3xl font-normal flex items-center justify-center transition-colors",
                            selectedCards.includes(Number(card.id))
                              ? "bg-orange-500 text-white shadow-lg"
                              : "bg-gray-300 text-gray-900 hover:bg-gray-400"
                          )}
                          aria-pressed={selectedCards.includes(Number(card.id))}
                          aria-label={`Card ${card.id} ${
                            selectedCards.includes(Number(card.id))
                              ? "selected"
                              : "not selected"
                          }`}
                        >
                          <span className="text-3xl font-bold">{card.id}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            }
          )}
        </div>
        <div className="flex flex-col justify-center items-center gap-10">
          <button className="yellow-card-button px-6 py-3 text-xl">
            Enter Card
          </button>
          <button className="yellow-card-button px-6 py-3 text-xl">
            Sync Previous
          </button>
          <button className="yellow-card-button px-6 py-3 text-xl">
            Show Card
          </button>
          <button className="yellow-card-button px-6 py-3 text-xl">
            Sync Mobile
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 mt-16 px-6 w-1/2 mx-auto">
        <div className="flex items-center justify-center gap-4">
          <div className="flex flex-col justify-center items-center gap-2">
            <h1 className="text-xl white font-bold text-white font-potta-one">
              Game Type
            </h1>
            <div className="counter-container">
              <button className="counter-button">-</button>
              <div className="counter-display-wrapper">
                <div className="counter-display px-6 py-2">100</div>
              </div>
              <button className="counter-button">+</button>
            </div>
          </div>
          <div className="flex flex-col justify-center items-center gap-2">
            <h1 className="text-xl white font-bold text-white font-potta-one">
              Bet
            </h1>
            <div className="counter-container">
              <button className="counter-button">-</button>
              <div className="counter-display-wrapper">
                <div className="counter-display px-6 py-2">100</div>
              </div>
              <button className="counter-button">+</button>
            </div>
          </div>
        </div>
        <button
          onClick={handleStartGame}
          disabled={selectedCards.length < 1}
          className={`  px-7 cursor-pointer py-4 text-4xl yellow-card-button ${
            selectedCards.length < 1 && "bg-gray-300 text-gray-900"
          }  `}
        >
          Play
        </button>
        {/* Input + Button styled like a search box */}
        {/* <div className="flex shadow-lg rounded-lg overflow-hidden">
          <Input
          value={inputCard}
            onChange={(e) => setInputCard(parseInt(e.target.value))}
            type="number"
            placeholder="Enter Card"
            className="rounded-none rounded-l-lg px-2 w-20 py-2 border-none focus:ring-0 focus:outline-none"
            />
          <Button
            onClick={() => toggleCardSelection(inputCard)}
            className="bg-[#1abc9c] px-4 py-2 rounded-none rounded-r-lg"
          >
          Select
          </Button>
          </div> */}
      </div>

      {/* Navigation Buttons */}
      {/* <div className="flex justify-center gap-4 mt-4">
        <Button
          onClick={handlePrevPage}
          disabled={currentPage === 1}
          className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2"
        >
          Previous
        </Button>
        <span className="flex items-center text-white font-semibold">
          Page {currentPage} of 6
        </span>
        <Button
          onClick={handleNextPage}
          disabled={currentPage === 6}
          className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2"
        >
          Next
        </Button>
      </div> */}
    </div>
  );
}
