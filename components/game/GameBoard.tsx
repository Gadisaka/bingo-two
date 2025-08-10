"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { BingoCard, BingoPattern, CardSetId } from "@/types/types";
import {
  bingoCardsSet1,
  bingoCardsSet2,
  bingoCardsSet3,
  bingoCardsSet4,
  bingoCardsSet5,
  bingoCardsSet6,
} from "@/lib/bingoData";
import GameControls from "./GameControls";
import { Input } from "../ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { createReport } from "@/lib/api";
import { WinningAmountDisplay } from "./WinningAmountDisplay";
import { NumberDisplay } from "./NumberDisplay";
import { GameStats } from "./GameStats";
import { NumberBoard } from "./NumberBoard";
import { checkWinningPattern } from "@/lib/bingoUtils";

interface BoardProps {
  onBackToSetup: () => void;
}

const CARD_SETS: Record<CardSetId, BingoCard[]> = {
  set1: bingoCardsSet1,
  set2: bingoCardsSet2,
  set3: bingoCardsSet3,
  set4: bingoCardsSet4,
  set5: bingoCardsSet5,
  set6: bingoCardsSet6,
};

const generateNumbers = () => Array.from({ length: 75 }, (_, i) => i + 1);

const GameBoard = ({ onBackToSetup }: BoardProps) => {
  const [allNumbers] = useState(generateNumbers);
  const [calledNumbers, setCalledNumbers] = useState<number[]>([]);
  const [currentNumber, setCurrentNumber] = useState<number | null>(null);
  const [previousNumber, setPreviousNumber] = useState<number | null>(null);
  const [winningAmount, setWinningAmount] = useState<number | null>(null);
  const [betAmount, setBetAmount] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [autoCall, setAutoCall] = useState(false);
  const [isReseting, setisReseting] = useState(false);
  const [callSpeed, setCallSpeed] = useState(3000);
  const [selectedCards, setSelectedCards] = useState<BingoCard[]>([]);
  const [gamePattern, setGamePattern] = useState<BingoPattern>("1line");
  const [selectedCardSetId, setselectedCardSetId] = useState<CardSetId>("set1");
  const [winners, setWinners] = useState<number[]>([]);
  const [blacklistedCards, setBlacklistedCards] = useState<number[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [bonusType, setBonusType] = useState<string>("winner");
  const [bonusAmount, setBonusAmount] = useState<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [jackpotResult, setJackpotResult] = useState<null | {
    isJackpot: boolean;
    jackpotAmount: number;
  }>(null);
  const [jackpotEnabled, setJackpotEnabled] = useState(true);
  const [audioFolder, setAudioFolder] = useState<string>("Gold");

  const currentCardSet = CARD_SETS[selectedCardSetId];

  // Bonus type and amount arrays (same as GameSetUp)
  const BONUS_TYPES = ["winner", "x", "L", "T", "8 call", "10 call", "13 call"];
  const BONUS_AMOUNTS = [
    0, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 1000, 1300,
  ];

  // Add at the top of your GameBoard component, after `useRef`:
  const audioCache = useRef<Record<string, HTMLAudioElement>>({});

  // Preload audios (Gold and Gold2) once on mount
  useEffect(() => {
    const preloadAudios = () => {
      const numbers = Array.from({ length: 75 }, (_, i) => i + 1);
      const extraFiles = [
        "win",
        "lose",
        "cardnotfound",
        "reset",
        "startgame",
        "stopgame",
        "bingo_ball",
        "bonus",
        "shuffle",
        "start",
        "stop",
      ];
      ["Gold", "Gold2"].forEach((folder) => {
        numbers.forEach((num) => {
          const key = `${folder}/${num}`;
          if (!audioCache.current[key]) {
            const audio = new Audio(`/${folder}/${num}.mp3`);
            audio.preload = "auto";
            audioCache.current[key] = audio;
          }
        });
        extraFiles.forEach((file) => {
          const key = `${folder}/${file}`;
          if (!audioCache.current[key]) {
            const audio = new Audio(`/${folder}/${file}.mp3`);
            audio.preload = "auto";
            audioCache.current[key] = audio;
          }
        });
      });
    };
    preloadAudios();
  }, []);

  // Updated playAudioForNumber function using selected folder
  const playAudioForNumber = useCallback(
    (num: number) => {
      // Check if audio is muted
      const isMuted = localStorage.getItem("audioMuted") === "true";
      if (isMuted) return;

      const key = `${audioFolder}/${num}`;
      let audio = audioCache.current[key];
      if (!audio) {
        const created = new Audio(`/${audioFolder}/${num}.mp3`);
        created.preload = "auto";
        audioCache.current[key] = created;
        audio = created;
      }
      try {
        audio.currentTime = 0;
        audio.play();
      } catch (err) {
        console.warn("Playback failed for", key, err);
      }
    },
    [audioFolder]
  );

  const playAudio = useCallback(
    (path: string) => {
      // Check if audio is muted
      const isMuted = localStorage.getItem("audioMuted") === "true";
      if (isMuted) return;

      // Use selected folder for all audio
      let file = path.split("/").pop() || "";
      if (!file.endsWith(".mp3")) file += ".mp3";
      const key = `${audioFolder}/${file.replace(".mp3", "")}`;
      let audio = audioCache.current[key];
      if (!audio) {
        audio = new Audio(`/${audioFolder}/${file}`);
        audioCache.current[key] = audio;
      }
      try {
        audio.currentTime = 0;
        audio.play();
      } catch (err) {
        console.warn("Audio playback failed for", key, err);
      }
    },
    [audioFolder]
  );

  const callNextNumber = useCallback(() => {
    const remaining = allNumbers.filter((n) => !calledNumbers.includes(n));
    if (remaining.length === 0) {
      setGameOver(true);
      return;
    }
    const next = remaining[Math.floor(Math.random() * remaining.length)];
    setPreviousNumber(currentNumber);
    setCurrentNumber(next);
    setCalledNumbers((prev) => {
      const updated = [...prev, next];
      localStorage.setItem("calledNumbers", JSON.stringify(updated));
      return updated;
    });
    playAudioForNumber(next);
  }, [allNumbers, calledNumbers, currentNumber, playAudioForNumber]);

  function clearSelectedCards() {
    const gameSetupRaw = localStorage.getItem("gameSetup");
    if (!gameSetupRaw) return;

    const gameSetup = JSON.parse(gameSetupRaw);

    // Save previous game data before clearing
    if (gameSetup.selectedCards && gameSetup.selectedCards.length > 0) {
      const previousGameData = {
        ...gameSetup,
        previousSelectedCards: gameSetup.selectedCards,
        previousGameDate: new Date().toISOString(),
      };
      localStorage.setItem(
        "previousGameSetup",
        JSON.stringify(previousGameData)
      );
    }

    // Clear current game data
    gameSetup.selectedCards = [];
    localStorage.setItem("gameSetup", JSON.stringify(gameSetup));
  }

  const startNewGame = useCallback(async () => {
    try {
      // Save game report first
      if (autoCall) {
        setAutoCall(false);
        localStorage.setItem("autoCall", "false");
      }
      setisReseting(true);

      const { error } = await createReport({
        totalCall: calledNumbers.length,
        registeredNumbers: selectedCards.length,
        revenue: selectedCards.length * (betAmount || 0) - (winningAmount || 0),
        betAmount: betAmount || 0,
        date: new Date().toISOString(),
        status: calledNumbers.length < 4 ? "INACTIVE" : "ACTIVE",
        walletDeduction:
          calledNumbers.length < 4
            ? 0
            : selectedCards.length * (betAmount || 0) - (winningAmount || 0),
      });

      if (error) {
        toast.error(error);
        return;
      }

      // Reset all game state
      setCalledNumbers([]);
      setCurrentNumber(null);
      setPreviousNumber(null);
      setWinners([]);
      setBlacklistedCards([]);
      setGameOver(false);
      clearSelectedCards();
      // Clear localStorage
      localStorage.removeItem("calledNumbers");
      localStorage.removeItem("blacklist");
      localStorage.removeItem("winners");
      // localStorage.removeItem("gameSetup");

      toast.success("New game started successfully");
    } catch (err) {
      console.error("Failed to start new game", err);
      toast.error("Failed to start new game");
    }
  }, [calledNumbers.length, selectedCards.length, betAmount, winningAmount]);

  const resetGame = useCallback(async () => {
    const confirmed = window.confirm("Are you sure you want to start new game");
    if (!confirmed) return;

    await startNewGame(); // ensure the report is saved and state is reset first
    onBackToSetup(); // go back to setup only after everything finishes
  }, [onBackToSetup, startNewGame]);

  const toggleAutoCall = useCallback(() => {
    if (autoCall) {
      playAudio("stop.mp3");
    } else {
      playAudio("start.mp3");
    }
    setAutoCall((prev) => !prev);
    localStorage.setItem("autoCall", String(!autoCall));
  }, [autoCall, playAudio]);

  const updateCallSpeed = useCallback((speed: number) => {
    setCallSpeed(speed);
    localStorage.setItem("callSpeed", speed.toString());
  }, []);

  useEffect(() => {
    const loadGameState = () => {
      try {
        const savedSetup = localStorage.getItem("gameSetup");
        const called = localStorage.getItem("calledNumbers");
        const speed = localStorage.getItem("callSpeed");
        const lang = localStorage.getItem("audioLang");
        const blacklist = localStorage.getItem("blacklist");
        const winnersData = localStorage.getItem("winners");
        const auto = localStorage.getItem("autoCall");
        const savedAudioFolder = localStorage.getItem("audioFolder");

        if (savedSetup) {
          const {
            selectedCards: ids,
            gamePattern,
            betAmount,
            selectedCardSetId,
            winning,
          } = JSON.parse(savedSetup);
          if (gamePattern) setGamePattern(gamePattern);
          if (selectedCardSetId) setselectedCardSetId(selectedCardSetId);
          setBetAmount(betAmount || 0);
          setWinningAmount(winning || 0);
          // Use the correct card set based on the loaded selectedCardSetId
          const correctCardSet =
            CARD_SETS[selectedCardSetId as CardSetId] || [];
          const allCards: BingoCard[] = JSON.parse(
            JSON.stringify(correctCardSet)
          );
          setSelectedCards(allCards.filter((c) => ids.includes(c.id)));
        }
        if (called) {
          const calledParsed = JSON.parse(called);
          setCalledNumbers(calledParsed);
          setCurrentNumber(calledParsed[calledParsed.length - 1] || null);
          setPreviousNumber(
            calledParsed.length > 1
              ? calledParsed[calledParsed.length - 2]
              : null
          );
        }
        if (speed) setCallSpeed(Number.parseInt(speed));
        if (lang) {
          // This line is removed as per the edit hint
        }
        if (savedAudioFolder) setAudioFolder(savedAudioFolder);
        if (blacklist) setBlacklistedCards(JSON.parse(blacklist));
        if (winnersData) setWinners(JSON.parse(winnersData));
        if (auto) setAutoCall(auto === "true");

        // Load bonus settings
        const bonusTypeIndex = localStorage.getItem("bonusTypeIndex");
        const bonusAmountIndex = localStorage.getItem("bonusAmountIndex");
        if (bonusTypeIndex) {
          const index = Number.parseInt(bonusTypeIndex);
          setBonusType(BONUS_TYPES[index] || "winner");
        }
        if (bonusAmountIndex) {
          const index = Number.parseInt(bonusAmountIndex);
          setBonusAmount(BONUS_AMOUNTS[index] || 0);
        }
      } catch (err) {
        console.error("Error loading saved game", err);
      }
    };

    loadGameState();
  }, []);

  useEffect(() => {
    if (autoCall && !gameOver) {
      intervalRef.current = setInterval(callNextNumber, callSpeed);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoCall, callNextNumber, callSpeed, gameOver]);

  useEffect(() => {
    if (!currentNumber) return;
    setIsVisible(true);
    const interval = setInterval(() => setIsVisible((v) => !v), 500);
    return () => clearInterval(interval);
  }, [currentNumber]);

  useEffect(() => {
    // Read jackpotEnabled from localStorage on mount and check if it should be active
    const jackpotSettingsRaw = localStorage.getItem("jackpotSettings");
    if (jackpotSettingsRaw) {
      try {
        const jackpotSettings = JSON.parse(jackpotSettingsRaw);
        const jackpotStartingAmount = Number(
          jackpotSettings.jackpotStartingAmount || jackpotSettings.jackpotAmount
        );
        const totalBetAmount = selectedCards.length * (betAmount || 0);

        // Jackpot is enabled if setting is "On" AND total bet meets minimum requirement
        const shouldBeEnabled =
          jackpotSettings.jackpotEnabled === "On" &&
          totalBetAmount >= jackpotStartingAmount;
        setJackpotEnabled(shouldBeEnabled);
      } catch (e) {
        setJackpotEnabled(true); // fallback to enabled
      }
    } else {
      setJackpotEnabled(true); // fallback to enabled
    }
  }, [selectedCards.length, betAmount]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputCardId, setInputCardId] = useState("");
  const [checkResult, setCheckResult] = useState<null | {
    status:
      | "win"
      | "lose"
      | "not_in_game"
      | "already_checked"
      | "already_won"
      | "not_now";
    card?: BingoCard;
  }>(null);

  const getStatusConfig = (status: string) => {
    const configs = {
      win: {
        bg: "bg-green-100",
        text: "text-green-800",
        message: "GOOD BINGO!",
        toast: () => toast.success("Bingo! This card is a winner!"),
      },
      not_in_game: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        message: "CARD NOT IN CURRENT GAME",
        toast: () => toast.warning("This card isn't in the current game"),
      },
      already_checked: {
        bg: "bg-gray-100",
        text: "text-red-800",
        message: "CARD LOCKED - NO BINGO",
        toast: () => toast.error("Card already checked - No Bingo"),
      },
      already_won: {
        bg: "bg-blue-100",
        text: "text-blue-800",
        message: "CARD ALREADY WON!",
        toast: () => toast.info("This card has already won!"),
      },
      lose: {
        bg: "bg-red-100",
        text: "text-red-800",
        message: "NO BINGO - CARD LOCKED",
        toast: () => toast.error("No Bingo - Card locked"),
      },
      not_now: {
        bg: "bg-orange-100",
        text: "text-orange-800",
        message: "አልፎታል።",
        toast: () => toast("አልፎታል።"),
      },
    };

    return configs[status as keyof typeof configs] || configs.lose;
  };

  const handleCardCheck = () => {
    const cardId = Number.parseInt(inputCardId);
    if (isNaN(cardId)) {
      toast.error("Please enter a valid card number");
      setCheckResult({ status: "lose" });
      setJackpotResult(null);
      return;
    }

    const card = currentCardSet.find((c) => c.id === cardId);
    if (!card) {
      toast.error("Card not found");
      playAudio("cardnotfound.mp3");
      setCheckResult({ status: "lose" });
      setJackpotResult(null);
      return;
    }

    const isInGame = selectedCards.some((c) => c.id === cardId);
    if (!isInGame) {
      setCheckResult({ status: "not_in_game", card });
      setJackpotResult(null);
      playAudio(`cardnotfound.mp3`);
      getStatusConfig("not_in_game").toast();
      return;
    }

    if (winners.includes(cardId)) {
      setCheckResult({ status: "already_won", card });
      setJackpotResult(null);
      getStatusConfig("already_won").toast();
      return;
    }

    if (blacklistedCards.includes(cardId)) {
      setCheckResult({ status: "already_checked", card });
      setJackpotResult(null);
      getStatusConfig("already_checked").toast();
      return;
    }

    const result = checkWinningPattern(card, calledNumbers, gamePattern);
    let isWinner = result.isWinner;
    let status = isWinner ? "win" : "lose";

    // Only allow win if currentNumber is in the winning pattern
    if (isWinner) {
      const columns = ["B", "I", "N", "G", "O"];
      const winningNumbers = result.winningCells
        .map(({ row, col }) => card[columns[col]][row])
        .filter((num) => num !== 0); // Exclude free space
      if (!winningNumbers.includes(currentNumber!)) {
        isWinner = false;
        status = "not_now";
      }
    }

    // Jackpot logic
    let jackpotInfo = { isJackpot: false, jackpotAmount: 0 };
    if (isWinner) {
      // Find the player's winning number (the last called number in the winning cells)
      const columns = ["B", "I", "N", "G", "O"];
      const winningNumbers = result.winningCells
        .map(({ row, col }) => card[columns[col]][row])
        .filter((num) => num !== 0);
      const playerWinningNumber = [...calledNumbers]
        .reverse()
        .find((num) => winningNumbers.includes(num));

      // Read jackpot settings
      const jackpotSettingsRaw = localStorage.getItem("jackpotSettings");
      if (jackpotSettingsRaw) {
        try {
          const jackpotSettings = JSON.parse(jackpotSettingsRaw);
          const dailyNumber = Number(jackpotSettings.dailyNumber);
          const matchGap = Number(jackpotSettings.matchGap);
          const jackpotStartingAmount = Number(
            jackpotSettings.jackpotStartingAmount ||
              jackpotSettings.jackpotAmount
          );
          const jackpotPercent = Number(jackpotSettings.jackpotPercent);
          const jackpotEnabled = jackpotSettings.jackpotEnabled;

          // Calculate total bet amount for this game
          const totalBetAmount = selectedCards.length * (betAmount || 0);

          // Check if jackpot should be active (total bet >= minimum required)
          const isJackpotActive =
            jackpotEnabled === "On" && totalBetAmount >= jackpotStartingAmount;

          // Check if winning number matches daily number within gap
          const isNumberMatch =
            typeof playerWinningNumber === "number" &&
            Math.abs(playerWinningNumber - dailyNumber) <= matchGap;

          if (isJackpotActive && isNumberMatch) {
            // Calculate jackpot amount as percentage of total bet
            const calculatedJackpotAmount = Math.round(
              (totalBetAmount * jackpotPercent) / 100
            );
            jackpotInfo = {
              isJackpot: true,
              jackpotAmount: calculatedJackpotAmount,
            };
          }
        } catch (e) {
          // ignore parse error
        }
      }
    }

    if (isWinner) {
      playAudio(`win.mp3`);
      setWinners((prev) => {
        const updated = [...prev, cardId];
        localStorage.setItem("winners", JSON.stringify(updated));
        return updated;
      });
      //alfotal
    } else if (status === "not_now") {
      // Do not blacklist or mark as win, just show message
      playAudio(`lose.mp3`);
    } else {
      playAudio(`lose.mp3`);
      setBlacklistedCards((prev) => {
        const updated = [...prev, cardId];
        localStorage.setItem("blacklist", JSON.stringify(updated));
        return updated;
      });
    }

    setCheckResult({ status: status as (typeof checkResult)["status"], card });
    setJackpotResult(jackpotInfo);
    getStatusConfig(status).toast();
  };

  const resetModal = () => {
    setInputCardId("");
    setCheckResult(null);
    setJackpotResult(null);
  };

  const renderCardGrid = (cardId: number) => {
    const card = currentCardSet.find((c) => c.id === cardId);
    if (!card) return null;

    // Get winning cells if this is a winning card
    const winningCells =
      checkResult?.status === "win"
        ? checkWinningPattern(card, calledNumbers, gamePattern).winningCells
        : [];

    return (
      <div className="grid grid-cols-5 gap-1 mb-4 text-center font-bold w-fit mx-auto">
        <div className="bg-blue-500 text-white p-1 rounded">B</div>
        <div className="bg-red-500 text-white p-1 rounded">I</div>
        <div className="bg-green-500 text-white p-1 rounded">N</div>
        <div className="bg-yellow-600 text-white p-1 rounded">G</div>
        <div className="bg-purple-500 text-white p-1 rounded">O</div>

        {Array.from({ length: 5 }).map((_, rowIndex) =>
          ["B", "I", "N", "G", "O"].map((letter, colIndex) => {
            const column = card[letter as keyof typeof card] as number[];
            const num = column?.[rowIndex];
            const isWinningCell = winningCells.some(
              (cell) => cell.row === rowIndex && cell.col === colIndex
            );
            const isCalled = num !== undefined && calledNumbers.includes(num);
            const isCurrentOrPrevious =
              num === currentNumber || num === previousNumber;

            return (
              <div
                key={`${letter}-${rowIndex}`}
                className={cn(
                  "border p-1 text-center font-normal w-10 h-10 flex items-center justify-center",
                  num === 0 ? "bg-yellow-600 text-black border-gray-700" : "",
                  isCalled ? "bg-gray-600 text-white" : "border-gray-700",
                  isCurrentOrPrevious ? "border-4 border-red-500" : "",
                  isWinningCell ? "!bg-green-500 !text-white" : ""
                )}
              >
                {num === 0 ? (
                  <div className="text-xs leading-tight">FREE</div>
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

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const shuffel = () => {
    const confirmed = window.confirm("Are you sure you want to shuffle?");
    if (!confirmed) return;
    if (autoCall) {
      setAutoCall(false);
    }
    setisReseting(true);
    playAudio("bingo_ball.mp3");
    timeoutRef.current = setTimeout(() => {
      setisReseting(false);
    }, 10000);
  };

  // Cleanup timeout on component unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

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
      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) resetModal();
        }}
      >
        <DialogContent className="max-w-md w-[95vw] z-50 bg-[#09519E] text-xl shadow text-white ">
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
              Check Bingo Card
            </DialogTitle>
            <DialogDescription className="text-white text-sm">
              Enter the card number to check if it has a winning pattern.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="card-number">Card Number</Label>
              <Input
                id="card-number"
                value={inputCardId}
                onChange={(e) => setInputCardId(e.target.value)}
                type="number"
                min="1"
                onKeyDown={(e) => e.key === "Enter" && handleCardCheck()}
                className="bg-white text-black"
              />
            </div>

            {inputCardId && checkResult?.card && (
              <>
                {!(
                  checkResult.status === "already_checked" ||
                  checkResult.status === "not_in_game"
                ) && renderCardGrid(Number.parseInt(inputCardId))}

                <div
                  className={cn(
                    "p-4 rounded text-center font-bold text-lg",
                    getStatusConfig(checkResult.status).bg,
                    getStatusConfig(checkResult.status).text
                  )}
                >
                  {getStatusConfig(checkResult.status).message}
                  {/* Jackpot message */}
                  {checkResult.status === "win" && jackpotResult?.isJackpot && (
                    <div className="mt-2 text-2xl text-yellow-400 font-extrabold">
                      🎉 JACKPOT WINNER!
                      <br />
                      Jackpot: {jackpotResult.jackpotAmount} Birr
                    </div>
                  )}
                </div>
              </>
            )}

            <button
              onClick={handleCardCheck}
              disabled={!inputCardId}
              className="w-full bg-gradient-to-b cursor-pointer hover:opacity-90 from-yellow-400 to-yellow-500 text-black font-bold text-xl px-6 py-2 rounded-md shadow-inner shadow-yellow-700 ring-2 ring-yellow-600 "
            >
              Check Card
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col justify-between ml-10 z-50 items-center w-full h-full">
        {/* <GameStats
          calledNumbers={calledNumbers}
          calledCount={calledNumbers.length}
          previousNumber={previousNumber}
          gamePattern={gamePattern}
          selectedCardSetId={selectedCardSetId}
        /> */}

        <div className="hidden sm:flex w-full h mt-4 justify-around items-start gap-4 ">
          <div className="h-full w-[250px] flex items-center justify-center">
            <NumberDisplay
              previousNumbers={[...calledNumbers].slice(-4).reverse().slice(1)}
              calledNumbers={calledNumbers}
              currentNumber={currentNumber}
            />
          </div>
          <NumberBoard
            isVisible={isVisible}
            reset={isReseting}
            calledNumbers={calledNumbers}
            currentNumber={currentNumber}
          />
        </div>
        <div className="flex w-full justify-start h-fit  items-start">
          {/* <div className="tot-bet-card ml-4">
            <h2 className="tot-bet-title font-potta-one text-2xl">
              Bonus Type
            </h2>
            <div className="tot-bet-display-wrapper">
              <div className="tot-bet-display">{bonusType}</div>
            </div>
          </div>
          <div className="tot-bet-card">
            <h2 className="tot-bet-title font-potta-one text-2xl">
              Bonus Amount
            </h2>
            <div className="tot-bet-display-wrapper">
              <div className="tot-bet-display">{bonusAmount} birr</div>
            </div>
          </div> */}
          <div className="relative group">
            <Image
              src="/jackpot.png"
              className={`object-cover ${
                jackpotEnabled ? "opacity-100" : "opacity-30"
              }`}
              alt="jackpot"
              width={200}
              height={200}
            />
            {!jackpotEnabled && (
              <>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">
                    INACTIVE
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {(() => {
                    const jackpotSettingsRaw =
                      localStorage.getItem("jackpotSettings");
                    if (jackpotSettingsRaw) {
                      try {
                        const jackpotSettings = JSON.parse(jackpotSettingsRaw);
                        const jackpotStartingAmount = Number(
                          jackpotSettings.jackpotStartingAmount ||
                            jackpotSettings.jackpotAmount
                        );
                        const totalBetAmount =
                          selectedCards.length * (betAmount || 0);
                        return `Need ${
                          jackpotStartingAmount - totalBetAmount
                        } more bet to activate`;
                      } catch (e) {
                        return "Jackpot disabled";
                      }
                    }
                    return "Jackpot disabled";
                  })()}
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex w-full justify-around px items-center gap-4 mb-22 ">
          <div className="flex w-fit items-center gap-4 ">
            <div className="tot-bet-card">
              <h2 className="tot-bet-title font-potta-one text-2xl"> BET</h2>
              <div className="tot-bet-display-wrapper">
                <div className="tot-bet-display">{betAmount}Birr</div>
              </div>
            </div>
            <div className="tot-bet-card">
              <h2 className="tot-bet-title font-potta-one text-2xl">TOT BET</h2>
              <div className="tot-bet-display-wrapper">
                <div className="tot-bet-display">{winningAmount}Birr</div>
              </div>
            </div>
          </div>
          <GameControls
            setup={() => {
              if (autoCall) {
                setAutoCall(false);
                localStorage.setItem("autoCall", "false");
              }
              onBackToSetup();
            }}
            isAutoPlaying={autoCall}
            shuffel={shuffel}
            toggleAutoPlay={toggleAutoCall}
            callSpeed={callSpeed}
            handleSpeedChange={updateCallSpeed}
            gameOver={gameOver}
            handleResetConfirm={resetGame}
            handleCheckCard={() => {
              if (autoCall) {
                toggleAutoCall(); // stop auto play
              }
              setIsModalOpen(true);
            }}
            callNextNumber={callNextNumber}
          />

          {/* <WinningAmountDisplay amount={winningAmount} /> */}
        </div>
      </div>
    </div>
  );
};

export default GameBoard;
