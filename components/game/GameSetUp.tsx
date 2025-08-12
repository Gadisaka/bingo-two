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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

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
  const [betAmount, setBetAmount] = useState<number>(10); // This will be updated to use BET_AMOUNTS[betAmountIndex]
  // const [commission, setCommission] = useState<number>(1);
  const [winning, setWinning] = useState<number>(0);
  const [inputCard, setInputCard] = useState<number>(0);
  const [gamePattern, setGamePattern] = useState<string>(GAME_PATTERNS[0]);
  const [showSelectedModal, setShowSelectedModal] = useState<boolean>(false);
  const [selectedCardSetId, setSelectedCardSetId] = useState<string>("set1");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [callSpeed, setCallSpeed] = useState<number>(3); // This represents seconds, will be converted to milliseconds
  const [bonusTypeIndex, setBonusTypeIndex] = useState<number>(0); // Default to "10 call"
  const [bonusAmountIndex, setBonusAmountIndex] = useState<number>(0); // Default to 100
  const [betAmountIndex, setBetAmountIndex] = useState<number>(8); // Default to 100 (index 8 in BET_AMOUNTS)
  const [gamePatternIndex, setGamePatternIndex] = useState<number>(0); // Default to "1line"
  const [showCardInputModal, setShowCardInputModal] = useState<boolean>(false);
  const [cardInputValue, setCardInputValue] = useState<string>("");
  const [showNumbersBoard, setShowNumbersBoard] = useState<boolean>(false);
  const audioRef = useRef(null);
  const [audioFolder, setAudioFolder] = useState<string>("Gold");
  // New: cache cashier winCutTable and cashier data
  const [winCutTable, setWinCutTable] = useState<
    {
      minCards: number;
      maxCards: number;
      percent5to30: number;
      percentAbove30: number;
    }[]
  >([]);

  // Cashier data for balance checking
  const [cashierData, setCashierData] = useState<{
    walletBalance: number;
    autoLock: boolean;
  } | null>(null);

  // Bonus type options
  const BONUS_TYPES = ["winner", "x", "L", "T", "8 call", "10 call", "13 call"];

  // Bonus amount options
  const BONUS_AMOUNTS = [
    0, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 1000, 1300,
  ];

  // Bet amount options
  const BET_AMOUNTS = [
    10, 15, 20, 30, 40, 50, 70, 90, 100, 150, 200, 300, 400, 500, 1000, 2000,
    3000,
  ];

  const toggleMute = () => {
    const newMutedState = !muted;
    setMuted(newMutedState);

    // Save mute state to localStorage
    localStorage.setItem("audioMuted", newMutedState.toString());

    // Mute/unmute all audio elements
    const audioElements = document.querySelectorAll("audio");
    audioElements.forEach((audio) => {
      audio.muted = newMutedState;
    });

    // Show feedback
    toast.info(newMutedState ? "Audio muted" : "Audio unmuted");
  };

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("gameSetup");
      const speed = localStorage.getItem("callSpeed");
      const savedAudioFolder = localStorage.getItem("audioFolder");
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
        if (parsed.bonusType) {
          const bonusTypeIndex = BONUS_TYPES.indexOf(parsed.bonusType);
          if (bonusTypeIndex !== -1) {
            setBonusTypeIndex(bonusTypeIndex);
          }
        }
        if (typeof parsed.bonusAmount === "number") {
          const bonusAmountIndex = BONUS_AMOUNTS.indexOf(parsed.bonusAmount);
          if (bonusAmountIndex !== -1) {
            setBonusAmountIndex(bonusAmountIndex);
          }
        }
        if (typeof parsed.betAmountIndex === "number") {
          setBetAmountIndex(parsed.betAmountIndex);
        }
        if (typeof parsed.gamePatternIndex === "number") {
          setGamePatternIndex(parsed.gamePatternIndex);
        }
      }
      if (speed) {
        // Convert milliseconds to seconds for display
        setCallSpeed(Number.parseInt(speed) / 1000);
      }

      if (savedAudioFolder) {
        setAudioFolder(savedAudioFolder);
      }

      // Load bonus settings
      const bonusType = localStorage.getItem("bonusTypeIndex");
      const bonusAmount = localStorage.getItem("bonusAmountIndex");
      const betAmountIdx = localStorage.getItem("betAmountIndex");
      const gamePatternIdx = localStorage.getItem("gamePatternIndex");
      if (bonusType) {
        setBonusTypeIndex(Number.parseInt(bonusType));
      }
      if (bonusAmount) {
        setBonusAmountIndex(Number.parseInt(bonusAmount));
      }
      if (betAmountIdx) {
        setBetAmountIndex(Number.parseInt(betAmountIdx));
      }
      if (gamePatternIdx) {
        setGamePatternIndex(Number.parseInt(gamePatternIdx));
      }

      // Load mute state
      const savedMuted = localStorage.getItem("audioMuted");
      if (savedMuted) {
        const mutedState = savedMuted === "true";
        setMuted(mutedState);

        // Apply mute state to all audio elements
        const audioElements = document.querySelectorAll("audio");
        audioElements.forEach((audio) => {
          audio.muted = mutedState;
        });
      }
    } catch (err) {
      console.error("Failed to parse localStorage:", err);
    }
    setHydrated(true);
  }, []);

  // Fetch cashier win cut table once
  useEffect(() => {
    (async () => {
      try {
        const meRes = await fetch("/api/auth/me", { cache: "no-store" });
        if (!meRes.ok) return;
        const me = await meRes.json();
        const id = me?.user?.id;
        const role = (me?.user?.role || "").toString().toUpperCase();
        if (!id || role !== "CASHIER") return;
        const cashRes = await fetch(`/api/cashiers/${id}`, {
          cache: "no-store",
        });
        if (!cashRes.ok) return;
        const cashier = await cashRes.json();

        // Store cashier data for balance checking
        setCashierData({
          walletBalance: Number(cashier.walletBalance || 0),
          autoLock: Boolean(cashier.autoLock),
        });

        if (Array.isArray(cashier?.winCutTables)) {
          setWinCutTable(
            cashier.winCutTables.map((r: any) => ({
              minCards: Number(r.minCards),
              maxCards: Number(r.maxCards),
              percent5to30: Number(r.percent5to30 ?? 0),
              percentAbove30: Number(r.percentAbove30 ?? 0),
            }))
          );
        }
      } catch (e) {
        // ignore; fallback handled below
      }
    })();
  }, []);

  // Helper: compute winning from table
  const computeWinningFromTable = useCallback(
    (numCards: number, bet: number): number => {
      if (
        !numCards ||
        !bet ||
        !Array.isArray(winCutTable) ||
        winCutTable.length === 0
      ) {
        return 0;
      }
      const rule = winCutTable.find(
        (r) => numCards >= r.minCards && numCards <= r.maxCards
      );
      const winCutPercent = rule
        ? bet <= 30
          ? rule.percent5to30
          : rule.percentAbove30
        : 0;
      const totalBet = numCards * bet;
      // winning amount = total bet - (total bet * win cut)
      return totalBet - totalBet * (winCutPercent / 100);
    },
    [winCutTable]
  );

  // Helper: check if game can proceed based on balance and auto-lock
  const canGameProceed = useCallback(() => {
    if (!cashierData || selectedCards.length === 0) return false;

    const totalBet = selectedCards.length * betAmount;
    const winningAmount = computeWinningFromTable(
      selectedCards.length,
      betAmount
    );
    const requiredBalance = totalBet - winningAmount; // Net amount cashier needs to pay (win cut)
    const hasSufficientBalance = cashierData.walletBalance >= requiredBalance;

    // Game can proceed if:
    // 1. Balance is sufficient for the win cut, OR
    // 2. Auto-lock is OFF (debt allowed)
    return hasSufficientBalance || !cashierData.autoLock;
  }, [cashierData, selectedCards.length, betAmount, computeWinningFromTable]);

  // Recalculate winning whenever relevant state changes (from table)
  useEffect(() => {
    const newWinning = computeWinningFromTable(selectedCards.length, betAmount);
    setWinning(newWinning);
  }, [selectedCards, betAmount, computeWinningFromTable]);

  // Update bet amount when betAmountIndex changes
  useEffect(() => {
    setBetAmount(BET_AMOUNTS[betAmountIndex]);
  }, [betAmountIndex]);

  // Save to localStorage on change
  useEffect(() => {
    if (!hydrated) return;

    const data = {
      selectedCards,
      betAmount,
      // commission,
      gamePattern,
      selectedCardSetId,
      bonusType: BONUS_TYPES[bonusTypeIndex],
      bonusAmount: BONUS_AMOUNTS[bonusAmountIndex],
      betAmountIndex: betAmountIndex,
      gamePatternIndex: gamePatternIndex,
      winning: computeWinningFromTable(selectedCards.length, betAmount),
    };

    localStorage.setItem("gameSetup", JSON.stringify(data));
    localStorage.setItem("audioFolder", audioFolder);
  }, [
    selectedCards,
    betAmount,
    /*commission,*/ gamePattern,
    hydrated,
    selectedCardSetId,
    bonusTypeIndex,
    bonusAmountIndex,
    betAmountIndex,
    gamePatternIndex,
    audioFolder,
    computeWinningFromTable,
  ]);

  // Save call speed to localStorage
  useEffect(() => {
    if (!hydrated) return;
    // Convert seconds to milliseconds for storage (to match GameBoard format)
    localStorage.setItem("callSpeed", (callSpeed * 1000).toString());
  }, [callSpeed, hydrated]);

  // Sync betAmount with BET_AMOUNTS array
  useEffect(() => {
    setBetAmount(BET_AMOUNTS[betAmountIndex]);
  }, [betAmountIndex]);

  // Sync gamePattern with GAME_PATTERNS array
  useEffect(() => {
    setGamePattern(GAME_PATTERNS[gamePatternIndex]);
  }, [gamePatternIndex]);

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

    // Check cashier balance before starting game
    if (cashierData) {
      const totalBet = selectedCards.length * betAmount;
      const winningAmount = computeWinningFromTable(
        selectedCards.length,
        betAmount
      );
      const requiredBalance = totalBet - winningAmount; // Net amount cashier needs to pay (win cut)

      if (cashierData.walletBalance < requiredBalance) {
        if (cashierData.autoLock) {
          // Auto-lock is ON and balance is insufficient - block the game
          toast.error("cannot start game, Insufficient balance");
          return;
        } else {
          // Auto-lock is OFF - allow game but show warning about debt
          toast.warning(
            `Low balance warning: You have $${cashierData.walletBalance.toFixed(
              2
            )} but need $${requiredBalance.toFixed(
              2
            )} (win cut). Game will proceed and debt will increase.`
          );
        }
      }
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

  const updateCallSpeed = useCallback((speed: number) => {
    setCallSpeed(speed);
    // Convert seconds to milliseconds for storage (to match GameBoard format)
    localStorage.setItem("callSpeed", (speed * 1000).toString());
  }, []);

  const incrementSpeed = () => {
    if (callSpeed < 6) {
      updateCallSpeed(callSpeed + 1);
    }
  };

  const decrementSpeed = () => {
    if (callSpeed > 2) {
      updateCallSpeed(callSpeed - 1);
    }
  };

  const incrementBonusType = () => {
    if (bonusTypeIndex < BONUS_TYPES.length - 1) {
      const newIndex = bonusTypeIndex + 1;
      setBonusTypeIndex(newIndex);
      localStorage.setItem("bonusTypeIndex", newIndex.toString());
    }
  };

  const decrementBonusType = () => {
    if (bonusTypeIndex > 0) {
      const newIndex = bonusTypeIndex - 1;
      setBonusTypeIndex(newIndex);
      localStorage.setItem("bonusTypeIndex", newIndex.toString());
    }
  };

  const incrementBonusAmount = () => {
    if (bonusAmountIndex < BONUS_AMOUNTS.length - 1) {
      const newIndex = bonusAmountIndex + 1;
      setBonusAmountIndex(newIndex);
      localStorage.setItem("bonusAmountIndex", newIndex.toString());
    }
  };

  const decrementBonusAmount = () => {
    if (bonusAmountIndex > 0) {
      const newIndex = bonusAmountIndex - 1;
      setBonusAmountIndex(newIndex);
      localStorage.setItem("bonusAmountIndex", newIndex.toString());
    }
  };

  const incrementBetAmount = () => {
    if (betAmountIndex < BET_AMOUNTS.length - 1) {
      const newIndex = betAmountIndex + 1;
      setBetAmountIndex(newIndex);
      localStorage.setItem("betAmountIndex", newIndex.toString());
    }
  };

  const decrementBetAmount = () => {
    if (betAmountIndex > 0) {
      const newIndex = betAmountIndex - 1;
      setBetAmountIndex(newIndex);
      localStorage.setItem("betAmountIndex", newIndex.toString());
    }
  };

  const incrementGamePattern = () => {
    if (gamePatternIndex < GAME_PATTERNS.length - 1) {
      const newIndex = gamePatternIndex + 1;
      setGamePatternIndex(newIndex);
      localStorage.setItem("gamePatternIndex", newIndex.toString());
    }
  };

  const decrementGamePattern = () => {
    if (gamePatternIndex > 0) {
      const newIndex = gamePatternIndex - 1;
      setGamePatternIndex(newIndex);
      localStorage.setItem("gamePatternIndex", newIndex.toString());
    }
  };

  const handleEnterCard = () => {
    setShowCardInputModal(true);
  };

  const handleCardInputSubmit = () => {
    const cardNumber = parseInt(cardInputValue);
    if (!isNaN(cardNumber) && cardNumber >= 1 && cardNumber <= 150) {
      toggleCardSelection(cardNumber);
      setCardInputValue("");
      toast.success(`Card ${cardNumber} selected!`);
    } else {
      toast.error("Please enter a valid card number between 1 and 100");
    }
  };

  const handleCardInputDone = () => {
    setCardInputValue("");
    setShowCardInputModal(false);
  };

  const handleCardInputCancel = () => {
    setCardInputValue("");
    setShowCardInputModal(false);
  };

  const handleShowNumbersBoard = () => {
    setShowNumbersBoard(true);
  };

  // Handle keyboard events for the numbers board and body scroll
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (showNumbersBoard && event.key === "Escape") {
        setShowNumbersBoard(false);
      }
    };

    if (showNumbersBoard) {
      document.addEventListener("keydown", handleKeyDown);
      // Prevent body scrolling when full-screen is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      // Restore body scrolling when full-screen is closed
      document.body.style.overflow = "unset";
    };
  }, [showNumbersBoard]);

  const handleSyncPrevious = () => {
    try {
      // First, let's check if there are any cards currently selected and save them
      if (selectedCards.length > 0) {
        console.log("Current selected cards:", selectedCards);
      }

      const stored = localStorage.getItem("previousGameSetup");

      if (stored) {
        const parsed = JSON.parse(stored);

        if (
          parsed &&
          Array.isArray(parsed.previousSelectedCards) &&
          parsed.previousSelectedCards.length > 0
        ) {
          setSelectedCards(parsed.previousSelectedCards);
          toast.success(
            `Restored ${parsed.previousSelectedCards.length} previously selected cards!`
          );
        } else {
          toast.info("No previously selected cards found.");
        }
      } else {
        toast.info("No previous game setup found.");
      }
    } catch (err) {
      console.error("Failed to sync previous cards:", err);
      toast.error("Failed to sync previous cards");
    }
  };

  // Create all cards array from the sets
  const allCards: BingoCard[] = bingoCardsSet1;

  // Pick cards based on current page (100 cards per page)
  const startIndex = (currentPage - 1) * 150;
  const endIndex = startIndex + 150;
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

      {/* Card Input Modal */}
      <Dialog
        open={showCardInputModal}
        onOpenChange={(open) => {
          if (!open) handleCardInputCancel();
        }}
      >
        <DialogContent className="max-w-md w-[95vw] z-50 bg-[#09519E] text-xl shadow text-white">
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
          <DialogHeader>
            <DialogTitle className="text-yellow-300 font-bold">
              Enter Card Number
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="card-number">Card Number</Label>
              <Input
                id="card-number"
                value={cardInputValue}
                onChange={(e) => setCardInputValue(e.target.value)}
                type="number"
                min="1"
                max="100"
                placeholder="Enter 1-150"
                onKeyDown={(e) => e.key === "Enter" && handleCardInputSubmit()}
                className="bg-white text-black"
              />
            </div>

            {/* Display selected numbers */}
            {selectedCards.length > 0 && (
              <div className="bg-gray-700 p-3 rounded">
                <Label className="text-white text-sm mb-2 block">
                  Selected Cards:
                </Label>
                <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
                  {selectedCards.map((cardId) => (
                    <span
                      key={cardId}
                      className="bg-orange-500 text-white px-2 py-1 rounded text-sm"
                    >
                      {cardId}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleCardInputSubmit}
                disabled={!cardInputValue}
                className="flex-1 bg-gradient-to-b cursor-pointer hover:opacity-90 from-yellow-400 to-yellow-500 text-black font-bold text-xl px-6 py-2 rounded-md shadow-inner shadow-yellow-700 ring-2 ring-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add
              </button>
              <button
                onClick={handleCardInputDone}
                className="flex-1 bg-gradient-to-b cursor-pointer hover:opacity-90 from-green-400 to-green-500 text-white font-bold text-xl px-6 py-2 rounded-md shadow-inner shadow-green-700 ring-2 ring-green-600"
              >
                Done
              </button>
              <button
                onClick={handleCardInputCancel}
                className="flex-1 bg-gradient-to-b cursor-pointer hover:opacity-90 from-gray-400 to-gray-500 text-white font-bold text-xl px-6 py-2 rounded-md shadow-inner shadow-gray-700 ring-2 ring-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Full Screen Numbers Board */}
      {showNumbersBoard && (
        <div className="fixed inset-0 w-screen h-screen z-[9999] bg-[#09519E]">
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

          <div className="relative z-10 h-full flex flex-col">
            {/* Floating Close Button */}
            <button
              onClick={() => setShowNumbersBoard(false)}
              className="absolute top-6 right-6 w-16 h-16 bg-red-500 hover:bg-red-600 text-white font-bold text-3xl rounded-full shadow-lg transition-all duration-200 hover:scale-110 z-20 flex items-center justify-center"
            >
              ×
            </button>

            {/* Numbers Grid */}
            <div className="flex-1 overflow-auto p-10 pt-20">
              <div className="grid grid-cols-15 gap-5 w-full">
                {Array.from({ length: 150 }, (_, i) => i + 1).map((number) => (
                  <button
                    key={number}
                    onClick={() => toggleCardSelection(number)}
                    className={cn(
                      "w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold border-2 transition-all duration-200 cursor-pointer shadow-lg",
                      selectedCards.includes(number)
                        ? "bg-orange-500 text-white border-orange-600 shadow-orange-500/50 hover:bg-orange-600 hover:scale-105"
                        : "bg-gray-300 text-gray-900 border-gray-400 hover:bg-gray-400 hover:scale-105"
                    )}
                  >
                    {number}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

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
          {/* <div className="text-white text-3xl font-bold">
            Players ({selectedCards.length})
          </div> */}
        </div>
        <h1 className="text-6xl  text-stroke-white font-bold my-3 z-10 text-orange-500 font-potta-one ">
          GOLD BINGO
        </h1>
        <div className="flex justify-center items-center gap-4">
          <div>
            <label className="text-white text-sm mr-2">Sound</label>
            <select
              value={audioFolder}
              onChange={(e) => setAudioFolder(e.target.value)}
              className="bg-gray-800 text-white border border-gray-700 rounded px-2 py-1"
            >
              <option value="Gold">Amh 1</option>
              <option value="Gold2">Amh 2</option>
              <option value="Gold3">Oro</option>
            </select>
          </div>
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

      {/* Selected Cards Modal */}
      {showSelectedModal && (
        <div className="fixed inset-0  bg-opacity-50 flex items-center justify-center z-[500]">
          <div className="bg-gray-900 rounded-lg shadow-2xl w-[90vw] h-[80vh] max-w-4xl overflow-hidden">
            {/* Header */}
            <div className="bg-orange-600 text-white p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">
                Selected Cards ({selectedCards.length})
              </h2>
              <button
                onClick={() => setShowSelectedModal(false)}
                className="text-white hover:text-gray-300 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="p-6 h-full overflow-y-auto">
              {selectedCards.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-400 text-lg">No cards selected.</p>
                </div>
              ) : (
                <div className="flex gap-3 flex-wrap">
                  {selectedCards.map((id) => (
                    <div
                      key={id}
                      className="bg-orange-500 text-white w-16 h-16 flex items-center justify-center rounded-lg font-mono font-bold text-lg shadow-lg hover:bg-orange-600 transition-colors"
                    >
                      {id}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}

      {/* Cards Grid */}
      <div className="flex justify-around w-full items-center">
        {/* <div className="flex flex-col justify-center items-center gap-6">
          <div className="flex flex-col justify-center items-center gap-2">
            <h1 className="text-xl white font-bold text-white font-potta-one">
              Bonus Type
            </h1>
            <div className="counter-container">
              <button
                className={`counter-button ${
                  bonusTypeIndex <= 0 ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onClick={decrementBonusType}
                disabled={bonusTypeIndex <= 0}
              >
                -
              </button>
              <div className="counter-display-wrapper">
                <div className="counter-display w-32 text-center py-2">
                  {BONUS_TYPES[bonusTypeIndex]}
                </div>
              </div>

              <button
                className={`counter-button ${
                  bonusTypeIndex >= BONUS_TYPES.length - 1
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                onClick={incrementBonusType}
                disabled={bonusTypeIndex >= BONUS_TYPES.length - 1}
              >
                +
              </button>
            </div>
          </div>
          <div className="flex flex-col justify-center items-center gap-2">
            <h1 className="text-xl white font-bold text-white font-potta-one">
              Bonus Amount
            </h1>
            <div className="counter-container">
              <button
                className={`counter-button ${
                  bonusAmountIndex <= 0 ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onClick={decrementBonusAmount}
                disabled={bonusAmountIndex <= 0}
              >
                -
              </button>
              <div className="counter-display-wrapper">
                <div className="counter-display w-32 text-center py-2">
                  {BONUS_AMOUNTS[bonusAmountIndex]}
                </div>
              </div>

              <button
                className={`counter-button ${
                  bonusAmountIndex >= BONUS_AMOUNTS.length - 1
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                onClick={incrementBonusAmount}
                disabled={bonusAmountIndex >= BONUS_AMOUNTS.length - 1}
              >
                +
              </button>
            </div>
          </div>
        </div> */}

        <div className="flex flex-col justify-center items-center gap-2">
          <h1 className="text-xl white font-bold text-white font-potta-one">
            Game Speed
          </h1>
          <div className="counter-container">
            <button
              className={`counter-button ${
                callSpeed <= 2 ? "opacity-50 cursor-not-allowed" : ""
              }`}
              onClick={decrementSpeed}
              disabled={callSpeed <= 2}
            >
              -
            </button>
            <div className="counter-display-wrapper">
              <div className="counter-display px-6 py-2">{callSpeed}</div>
            </div>
            <button
              className={`counter-button ${
                callSpeed >= 6 ? "opacity-50 cursor-not-allowed" : ""
              }`}
              onClick={incrementSpeed}
              disabled={callSpeed >= 6}
            >
              +
            </button>
          </div>
          <div className="w-full mx-auto mt-3 grid grid-cols-1 gap-3">
            <div className="bg-gray-900/70 border border-gray-700 rounded-lg px-4 py-3 text-white">
              <div className="text-xs text-gray-400">Players</div>
              <div className="text-xl font-semibold">
                {selectedCards.length}
              </div>
            </div>
            <div className="bg-gray-900/70 border border-gray-700 rounded-lg px-4 py-3 text-white">
              <div className="text-xs text-gray-400">Bet (Birr)</div>
              <div className="text-xl font-semibold">{betAmount}</div>
            </div>
            <div className="bg-gray-900/70 border border-gray-700 rounded-lg px-4 py-3 text-white">
              <div className="text-xs text-gray-400">Applied Win-Cut %</div>
              <div className="text-xl font-semibold">
                {(() => {
                  const rule = winCutTable.find(
                    (r) =>
                      selectedCards.length >= r.minCards &&
                      selectedCards.length <= r.maxCards
                  );
                  const percent = rule
                    ? betAmount <= 30
                      ? rule.percent5to30
                      : rule.percentAbove30
                    : 0;
                  return `${percent.toFixed(1)}%`;
                })()}
              </div>
            </div>
            <div className="bg-gray-900/70 border border-gray-700 rounded-lg px-4 py-3 text-white">
              <div className="text-xs text-gray-400">Winning (Birr)</div>
              <div className="text-xl font-semibold">{winning.toFixed(2)}</div>
            </div>
          </div>
        </div>
        <div className="max-h-[400px] overflow-y-scroll bg-gray-800 z-50 border-gray-700 p-10 space-y-10">
          <div
            className="grid grid-cols-7 gap-6"
            aria-label="Card selection grid"
          >
            {currentCards.map((card) => (
              <div
                key={card.id}
                className={`flex justify-center items-center w-32 h-32 rounded-full shadow-lg ${
                  selectedCards.includes(Number(card.id))
                    ? "bg-orange-500"
                    : "bg-gray-300"
                }`}
              >
                <div className="flex justify-center items-center w-28 h-28 bg-gray-800 rounded-full">
                  <button
                    type="button"
                    onClick={() => toggleCardSelection(Number(card.id))}
                    className={cn(
                      "w-24 h-24 rounded-full text-4xl font-normal flex items-center justify-center transition-colors",
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
                    <span className="text-4xl font-bold">{card.id}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col justify-center items-center gap-10">
          <div className="flex items-center gap-2 mb-2">
            <input
              id="showSelectedModalCheckbox"
              type="checkbox"
              checked={showSelectedModal}
              onChange={() => setShowSelectedModal((v) => !v)}
              className="accent-orange-500"
            />
            <label
              htmlFor="showSelectedModalCheckbox"
              className="text-sm text-gray-300 hover:text-orange-500 cursor-pointer"
            >
              Show Selected
            </label>
          </div>
          <button
            className="yellow-card-button text-center w-44 py-3 text-xl"
            onClick={handleEnterCard}
          >
            Enter Card
          </button>
          <button
            className="yellow-card-button w-44 text-center py-3 text-xl"
            onClick={handleSyncPrevious}
          >
            Sync Previous
          </button>
          <button
            className="yellow-card-button w-44 text-center py-3 text-xl"
            onClick={handleShowNumbersBoard}
          >
            Show Card
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
              <button
                className={`counter-button ${
                  gamePatternIndex <= 0 ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onClick={decrementGamePattern}
                disabled={gamePatternIndex <= 0}
              >
                -
              </button>
              <div className="counter-display-wrapper">
                <div className="counter-display py-2 w-32 text-center">
                  {GAME_PATTERNS[gamePatternIndex]}
                </div>
              </div>
              <button
                className={`counter-button ${
                  gamePatternIndex >= GAME_PATTERNS.length - 1
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                onClick={incrementGamePattern}
                disabled={gamePatternIndex >= GAME_PATTERNS.length - 1}
              >
                +
              </button>
            </div>
          </div>
          <div className="flex flex-col justify-center items-center gap-2">
            <h1 className="text-xl white font-bold text-white font-potta-one">
              Bet
            </h1>
            <div className="counter-container">
              <button
                className={`counter-button ${
                  betAmountIndex <= 0 ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onClick={decrementBetAmount}
                disabled={betAmountIndex <= 0}
              >
                -
              </button>
              <div className="counter-display-wrapper">
                <div className="counter-display w-32 text-center py-2">
                  {BET_AMOUNTS[betAmountIndex]}
                </div>
              </div>
              <button
                className={`counter-button ${
                  betAmountIndex >= BET_AMOUNTS.length - 1
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
                onClick={incrementBetAmount}
                disabled={betAmountIndex >= BET_AMOUNTS.length - 1}
              >
                +
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={handleStartGame}
          disabled={!canGameProceed()}
          className={`px-7 cursor-pointer py-4 text-4xl yellow-card-button ${
            !canGameProceed()
              ? "bg-gray-300 text-gray-900 cursor-not-allowed"
              : ""
          }`}
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
