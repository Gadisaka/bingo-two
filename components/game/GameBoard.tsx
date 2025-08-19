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
  DialogFooter,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { createReport } from "@/lib/api";
import { WinningAmountDisplay } from "./WinningAmountDisplay";
import { NumberDisplay } from "./NumberDisplay";
import { GameStats } from "./GameStats";
import NumberBoard from "./NumberBoard";
import { checkWinningPattern } from "@/lib/bingoUtils";
import { useGameSession } from "@/lib/hooks/useGameSession";

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
  const [audioFolder, setAudioFolder] = useState<string>("Gold");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [currentReportId, setCurrentReportId] = useState<number | null>(null);

  // NEW CLEAN SYSTEM: Use the simplified jackpot hook
  const {
    jackpotInfo,
    loading: jackpotLoading,
    error: jackpotError,
    isNextGameJackpotEligible,
    calculateJackpotAmount,
    getNextGameNumber,
    getTodayGamesCount,
    isJackpotEnabled,
    getRemainingJackpots,
    refresh: refreshJackpotInfo,
  } = useGameSession();

  // NEW: Manage jackpot count in localStorage
  const getTodayJackpotCount = useCallback(() => {
    const today = new Date().toDateString();
    const key = `jackpotCount_${today}`;
    const count = localStorage.getItem(key);
    return count ? parseInt(count) : 0;
  }, []);

  const incrementTodayJackpotCount = useCallback(() => {
    const today = new Date().toDateString();
    const key = `jackpotCount_${today}`;
    const currentCount = getTodayJackpotCount();
    const newCount = currentCount + 1;
    localStorage.setItem(key, newCount.toString());
    console.log("🎉 JACKPOT COUNT INCREMENTED:", newCount);
    return newCount;
  }, [getTodayJackpotCount]);

  const getRemainingJackpotsLocal = useCallback(() => {
    if (!jackpotInfo) return 0;
    const todayCount = getTodayJackpotCount();
    return Math.max(0, jackpotInfo.jackpotSettings.dailyNumber - todayCount);
  }, [jackpotInfo, getTodayJackpotCount]);

  // Show jackpot error if any
  useEffect(() => {
    if (jackpotError) {
      console.error("🎰 JACKPOT ERROR:", jackpotError);
      toast.error(`Jackpot system error: ${jackpotError}`);
    }
  }, [jackpotError]);

  // NEW CLEAN SYSTEM: Debug jackpot settings
  const debugJackpotSettings = useCallback(() => {
    // console.log("🔍 CURRENT JACKPOT INFO:", jackpotInfo);
    // console.log("🔍 TOTAL BET:", selectedCards.length * (betAmount || 0));
    // console.log("🔍 JACKPOT ENABLED:", isJackpotEnabled());
    // console.log("🔍 REMAINING JACKPOTS (API):", getRemainingJackpots());
    // console.log("🔍 REMAINING JACKPOTS (LOCAL):", getRemainingJackpotsLocal());
    // console.log("🔍 TODAY'S JACKPOT COUNT (LOCAL):", getTodayJackpotCount());
    // console.log(
    //   "🔍 NEXT GAME ELIGIBLE:",
    //   jackpotInfo?.todayStats.nextGameEligible
    // );
    // console.log("🔍 NEXT GAME NUMBER:", getNextGameNumber());
    // console.log("🔍 TODAY'S GAMES:", getTodayGamesCount());
    // console.log("🔍 CURRENT REPORT ID:", currentReportId);
    // console.log("🔍 JACKPOT SETTINGS:", jackpotInfo?.jackpotSettings);
  }, [
    jackpotInfo,
    selectedCards.length,
    betAmount,
    isJackpotEnabled,
    getRemainingJackpots,
    getRemainingJackpotsLocal,
    getTodayJackpotCount,
    getNextGameNumber,
    getTodayGamesCount,
    currentReportId,
  ]);

  // NEW CLEAN SYSTEM: Reset game session for testing
  const resetGameSession = useCallback(async () => {
    console.log("🔄 RESETTING GAME SESSION FOR TESTING...");
    await refreshJackpotInfo();
    console.log("✅ GAME SESSION REFRESHED");
  }, [refreshJackpotInfo]);

  const currentCardSet = CARD_SETS[selectedCardSetId];

  // Bonus type and amount arrays (same as GameSetUp)
  const BONUS_TYPES = ["winner", "x", "L", "T", "8 call", "10 call", "13 call"];
  const BONUS_AMOUNTS = [
    0, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 1000, 1300,
  ];

  // Add at the top of your GameBoard component, after `useRef`:
  const audioCache = useRef<Record<string, HTMLAudioElement>>({});
  const audioLoader = useRef<
    ((folder: string, fileName: string) => HTMLAudioElement) | null
  >(null);
  const lastAudioFolder = useRef<string>("Gold");

  useEffect(() => {
    const preloadAudios = () => {
      // Get the selected audio folder from localStorage
      const selectedFolder = localStorage.getItem("audioFolder") || "Gold";

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
        "pass",
      ];

      // Only preload from the selected folder
      numbers.forEach((num) => {
        const key = `${selectedFolder}/${num}`;
        if (!audioCache.current[key]) {
          const audio = new Audio(`/${selectedFolder}/${num}.mp3`);
          audio.preload = "auto";
          audioCache.current[key] = audio;
        }
      });

      extraFiles.forEach((file) => {
        const key = `${selectedFolder}/${file}`;
        if (!audioCache.current[key]) {
          const audio = new Audio(`/${selectedFolder}/${file}.mp3`);
          audio.preload = "auto";
          audioCache.current[key] = audio;
        }
      });

      // Add a function to dynamically load audio from other folders when needed
      audioLoader.current = (folder: string, fileName: string) => {
        const key = `${folder}/${fileName}`;
        if (!audioCache.current[key]) {
          const audio = new Audio(`/${folder}/${fileName}.mp3`);
          audio.preload = "auto";
          audioCache.current[key] = audio;
        }
        return audioCache.current[key];
      };

      // Initialize the last audio folder
      lastAudioFolder.current = selectedFolder;
    };
    preloadAudios();
  }, []);

  // Function to handle audio folder changes
  const handleAudioFolderChange = useCallback((newFolder: string) => {
    // Clear existing audio cache for the old folder
    const oldFolder = localStorage.getItem("audioFolder") || "Gold";
    if (oldFolder !== newFolder) {
      // Remove old folder audio files from cache
      Object.keys(audioCache.current).forEach((key) => {
        if (key.startsWith(`${oldFolder}/`)) {
          delete audioCache.current[key];
        }
      });

      // Preload new folder audio files
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
        "pass",
      ];

      numbers.forEach((num) => {
        const key = `${newFolder}/${num}`;
        if (!audioCache.current[key]) {
          const audio = new Audio(`/${newFolder}/${num}.mp3`);
          audio.preload = "auto";
          audioCache.current[key] = audio;
        }
      });

      extraFiles.forEach((file) => {
        const key = `${newFolder}/${file}`;
        if (!audioCache.current[key]) {
          const audio = new Audio(`/${newFolder}/${file}.mp3`);
          audio.preload = "auto";
          audioCache.current[key] = audio;
        }
      });
    }
  }, []);

  // Listen for audio folder changes in localStorage
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "audioFolder" && e.newValue) {
        handleAudioFolderChange(e.newValue);
      }
    };

    // Listen for changes from other tabs/windows
    window.addEventListener("storage", handleStorageChange);

    // Also check for changes in the current tab
    const checkAudioFolder = () => {
      const currentFolder = localStorage.getItem("audioFolder") || "Gold";
      if (lastAudioFolder.current !== currentFolder) {
        handleAudioFolderChange(currentFolder);
        lastAudioFolder.current = currentFolder;
      }
    };

    // Check every second for changes
    const interval = setInterval(checkAudioFolder, 1000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [handleAudioFolderChange]);

  // Updated playAudioForNumber function using selected folder
  const playAudioForNumber = useCallback((num: number) => {
    // Check if audio is muted
    const isMuted = localStorage.getItem("audioMuted") === "true";
    if (isMuted) return;

    const selectedFolder = localStorage.getItem("audioFolder") || "Gold";
    const key = `${selectedFolder}/${num}`;
    let audio = audioCache.current[key];

    // If audio is not cached, load it dynamically
    if (!audio && audioLoader.current) {
      audio = audioLoader.current(selectedFolder, num.toString());
    }

    if (audio) {
      try {
        audio.currentTime = 0;
        audio.play();
      } catch (err) {
        console.warn("Playback failed for", key, err);
      }
    }
  }, []);

  const playAudio = useCallback((path: string) => {
    // Check if audio is muted
    const isMuted = localStorage.getItem("audioMuted") === "true";
    if (isMuted) return;

    // Use selected folder for all audio
    const selectedFolder = localStorage.getItem("audioFolder") || "Gold";
    let file = path.split("/").pop() || "";
    if (!file.endsWith(".mp3")) file += ".mp3";
    const key = `${selectedFolder}/${file.replace(".mp3", "")}`;
    let audio = audioCache.current[key];

    // If audio is not cached, load it dynamically
    if (!audio && audioLoader.current) {
      audio = audioLoader.current(selectedFolder, file.replace(".mp3", ""));
    }

    if (audio) {
      try {
        audio.currentTime = 0;
        audio.play();
      } catch (err) {
        console.warn("Audio playback failed for", key, err);
      }
    }
  }, []);

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

      const reportResult = await createReport({
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

      if (reportResult.error) {
        toast.error(reportResult.error);
        return;
      }

      // Store the report ID for jackpot tracking
      if (reportResult.data?.id) {
        setCurrentReportId(reportResult.data.id);
        console.log("📊 REPORT CREATED WITH ID:", reportResult.data.id);
      }

      // NEW CLEAN SYSTEM: Check if this game won jackpot and update report
      const totalBetAmount = selectedCards.length * (betAmount || 0);
      const currentGameNumber = getTodayGamesCount(); // This game just completed

      // Check if this game was jackpot eligible
      let jackpotWon = false;
      let jackpotAmount = 0;

      if (
        jackpotInfo &&
        currentGameNumber % jackpotInfo.jackpotSettings.matchGap === 0
      ) {
        jackpotWon = true;
        jackpotAmount = Math.round(
          (totalBetAmount * jackpotInfo.jackpotSettings.percent) / 100
        );

        console.log("🎉 JACKPOT WIN RECORDED:", {
          gameNumber: currentGameNumber,
          jackpotAmount: jackpotAmount,
          totalBet: totalBetAmount,
        });
      }

      // Update the report with jackpot information
      if (jackpotWon) {
        // We need to update the report that was just created
        // For now, we'll refresh jackpot info to show the updated count
        await refreshJackpotInfo();
        console.log("🎮 GAME COMPLETED WITH JACKPOT, INFO REFRESHED");
      } else {
        await refreshJackpotInfo();
        console.log("🎮 GAME COMPLETED, JACKPOT INFO REFRESHED");
      }

      // Reset all game state
      setCalledNumbers([]);
      setCurrentNumber(null);
      setPreviousNumber(null);
      setWinners([]);
      setBlacklistedCards([]);
      setGameOver(false);
      setCurrentReportId(null); // Clear current report ID
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
  }, [
    calledNumbers.length,
    selectedCards.length,
    betAmount,
    winningAmount,
    refreshJackpotInfo,
  ]);

  const resetGame = useCallback(async () => {
    setShowResetConfirm(false);
    await startNewGame(); // ensure the report is saved and state is reset first
    onBackToSetup(); // go back to setup only after everything finishes
  }, [onBackToSetup, startNewGame]);

  const openResetConfirm = useCallback(() => {
    setShowResetConfirm(true);
  }, []);

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

  // NEW CLEAN SYSTEM: Log jackpot info changes for debugging
  useEffect(() => {
    if (jackpotInfo) {
      console.log("🎰 JACKPOT INFO UPDATED:", {
        nextGame: jackpotInfo.todayStats.nextGameNumber,
        jackpotsAwarded: jackpotInfo.todayStats.jackpotsAwarded,
        remainingJackpots: jackpotInfo.todayStats.remainingJackpots,
        nextGameEligible: jackpotInfo.todayStats.nextGameEligible,
      });
    }
  }, [jackpotInfo]);

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
        message: "NO BINGO",
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
        message: "NO BINGO",
        toast: () => toast.error("No Bingo"),
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

  const handleCardCheck = async () => {
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

    // Check if the current number is part of ANY winning pattern
    if (isWinner) {
      // Check if current number is part of any winning pattern
      const hasCurrentNumberInAnyPattern = result.winningCells.some(
        ({ row, col }) => {
          const columns = ["B", "I", "N", "G", "O"];
          const num = card[columns[col]][row];
          return num === currentNumber;
        }
      );

      if (!hasCurrentNumberInAnyPattern) {
        isWinner = false;
        status = "not_now";
      }
    }

    // NEW CLEAN SYSTEM: Jackpot logic using reports table
    let jackpotResult = { isJackpot: false, jackpotAmount: 0 };
    if (isWinner) {
      // Check if this game was jackpot eligible
      const totalBetAmount = selectedCards.length * (betAmount || 0);
      const currentGameNumber = getTodayGamesCount(); // This game just completed

      // Check if this game number matches jackpot pattern
      if (
        jackpotInfo &&
        currentGameNumber % jackpotInfo.jackpotSettings.matchGap === 0
      ) {
        const jackpotAmount = Math.round(
          (totalBetAmount * jackpotInfo.jackpotSettings.percent) / 100
        );

        jackpotResult = {
          isJackpot: true,
          jackpotAmount: jackpotAmount,
        };

        console.log("🎉 JACKPOT AWARDED:", {
          gameNumber: currentGameNumber,
          jackpotAmount: jackpotAmount,
          totalBet: totalBetAmount,
          matchGap: jackpotInfo.jackpotSettings.matchGap,
          calculation: `${totalBetAmount} * ${jackpotInfo.jackpotSettings.percent}% = ${jackpotAmount}`,
        });

        // Update the report with jackpot information
        if (currentReportId) {
          try {
            const response = await fetch(
              `/api/reports/${currentReportId}/jackpot`,
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  jackpotAwarded: true,
                  jackpotAmount: jackpotAmount,
                }),
              }
            );

            if (response.ok) {
              console.log("✅ REPORT UPDATED WITH JACKPOT:", currentReportId);
            } else {
              console.error("❌ FAILED TO UPDATE REPORT WITH JACKPOT");
            }
          } catch (err) {
            console.error("❌ ERROR UPDATING REPORT WITH JACKPOT:", err);
          }
        }

        // NEW: Increment localStorage jackpot count immediately
        const newCount = incrementTodayJackpotCount();
        console.log("🎉 JACKPOT COUNT UPDATED IN LOCALSTORAGE:", newCount);
      } else {
        console.log("🎰 GAME NOT JACKPOT ELIGIBLE:", {
          gameNumber: currentGameNumber,
          matchGap: jackpotInfo?.jackpotSettings.matchGap || 1,
          remainder: jackpotInfo
            ? currentGameNumber % jackpotInfo.jackpotSettings.matchGap
            : "N/A",
        });
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
      playAudio(`pass.mp3`);
    } else {
      // For lose status, don't automatically blacklist - let user manually lock
      playAudio(`lose.mp3`);
    }

    setCheckResult({ status: status as (typeof checkResult)["status"], card });
    setJackpotResult(jackpotResult);
    getStatusConfig(status).toast();
  };

  const resetModal = () => {
    setInputCardId("");
    setCheckResult(null);
    setJackpotResult(null);
  };

  const handleBlockCard = () => {
    if (
      checkResult?.card &&
      (checkResult.status === "not_now" || checkResult.status === "lose")
    ) {
      const cardId = checkResult.card.id;
      setBlacklistedCards((prev) => {
        const updated = [...prev, cardId];
        localStorage.setItem("blacklist", JSON.stringify(updated));
        return updated;
      });

      // Update the check result to show as already checked
      setCheckResult({
        status: "already_checked",
        card: checkResult.card,
      });

      toast.success("Card has been blocked");
    }
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
            const isCurrent = num === currentNumber;

            return (
              <div
                key={`${letter}-${rowIndex}`}
                className={cn(
                  "border p-1 text-center font-bold w-10 h-10 flex  items-center justify-center bg-white text-black",
                  num === 0 ? "bg-yellow-600 text-black border-gray-700" : "",
                  isCalled ? "bg-orange-500 text-white" : "border-gray-700",
                  isCurrent ? "border-4 border-red-500" : "",
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
    <div className="flex flex-col justify-start items-center h-screen px-6  relative overflow-hidden z-0">
      {/* Diamond Pattern Overlay */}
      {/* <svg
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
      </svg> */}
      <img
        src="/bingo-bg.jpg"
        alt="bg"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />
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
                    <div className="mt-2 p-3 bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 rounded-lg border-2 border-yellow-400 shadow-lg">
                      <div className="text-center">
                        <div className="text-3xl mb-1">🎉</div>
                        <div className="text-4xl font-black text-yellow-300 mb-1 drop-shadow-xl">
                          JACKPOT WINNER!
                        </div>
                        <div className="text-xl font-bold text-yellow-200 mt-1 drop-shadow-lg">
                          Jackpot Amount:
                        </div>
                        <div className="text-3xl font-black text-yellow-300 mt-1 drop-shadow-lg">
                          {jackpotResult.jackpotAmount} Birr
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Block button for not_now status */}
                {checkResult.status === "not_now" && (
                  <button
                    onClick={handleBlockCard}
                    className="w-full bg-gradient-to-b cursor-pointer hover:opacity-90 from-red-400 to-red-500 text-white font-bold text-lg px-6 py-2 rounded-md shadow-inner shadow-red-700 ring-2 ring-red-600 mb-2"
                  >
                    Lock Card
                  </button>
                )}

                {/* Manual lock button for lose status */}
                {checkResult.status === "lose" && (
                  <button
                    onClick={handleBlockCard}
                    className="w-full bg-gradient-to-b cursor-pointer hover:opacity-90 from-red-400 to-red-500 text-white font-bold text-lg px-6 py-2 rounded-md shadow-inner shadow-red-700 ring-2 ring-red-600 mb-2"
                  >
                    Lock Card
                  </button>
                )}
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

      <div className="flex flex-col justify-between ml-10 z-10 items-center w-full h-full">
        {/* <GameStats
          calledNumbers={calledNumbers}
          calledCount={calledNumbers.length}
          previousNumber={previousNumber}
          gamePattern={gamePattern}
          selectedCardSetId={selectedCardSetId}
        /> */}

        <div className="hidden sm:flex w-full h mt-4 justify-around items-start gap-4 z-10">
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
        <div className="flex w-full justify-start h-fit  items-start z-10">
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
                isJackpotEnabled() ? "opacity-100" : "opacity-30"
              }`}
              alt="jackpot"
              width={200}
              height={200}
            />

            {/* NEW CLEAN SYSTEM: Jackpot Status Display */}
            {jackpotLoading ? (
              <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded text-xs font-bold">
                <div className="flex items-center">
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                  Loading...
                </div>
              </div>
            ) : isJackpotEnabled() && jackpotInfo ? (
              <div className="absolute top-2 right-2 bg-yellow-500 text-black px-2 py-1 rounded text-xs font-bold">
                <div>
                  {getRemainingJackpotsLocal()}/
                  {jackpotInfo.jackpotSettings.dailyNumber}
                </div>
                {/* <div className="text-xs opacity-75">
                  Game {getNextGameNumber()}
                </div> */}
              </div>
            ) : null}

            {/* {!jackpotEnabled && (
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
            )} */}
          </div>
        </div>
        <div className="flex w-full justify-around px items-center gap-4 mb-22 z-10">
          <div className="flex w-fit items-center gap-4 ">
            <div className="flex flex-col items-center justify-center">
              <h2 className="font-bold text-3xl text-white mb-2 drop-shadow-lg">
                BET
              </h2>
              <div className="relative">
                <img
                  src="/big_money.png"
                  alt="bg"
                  className="w-48 h-16 object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-2xl mb-1 drop-shadow-lg">
                  {betAmount} Birr
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <h2 className="font-bold text-3xl text-white mb-2 drop-shadow-lg">
                TOT BET
              </h2>
              <div className="relative">
                <img
                  src="/big_money.png"
                  alt="bg"
                  className="w-48 h-16 object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-2xl mb-1 drop-shadow-lg">
                  {winningAmount} Birr
                </div>
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
            handleResetConfirm={openResetConfirm}
            handleCheckCard={() => {
              if (autoCall) {
                toggleAutoCall(); // stop auto play
              }
              setIsModalOpen(true);
            }}
            callNextNumber={callNextNumber}
            debugJackpot={() => {
              debugJackpotSettings();
              resetGameSession();
            }}
          />

          {/* <WinningAmountDisplay amount={winningAmount} /> */}
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/5 bg-opacity-50 h-full w-full flex items-center justify-center z-50">
          <div className="relative w-full h-full">
            <img
              src="/small_bg.png"
              alt=""
              className="w-full h-full object-cover"
            />
            {/* Content overlay */}[{" "}
            <div className="absolute inset-0 flex flex-col items-center h-[500px] justify-between p-6 z-10">
              ]{" "}
              <div className="text-center mb-6">
                <p className="text-white text-6xl font-bold drop-shadow-lg">
                  ARE YOU SURE?
                </p>
              </div>
              {/* Buttons */}
              <div className="flex justify-between items-center w-[400px]">
                <button
                  className="relative px-8 py-4 text-4xl w-40 cursor-pointer font-bold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 shadow-lg overflow-hidden"
                  onClick={() => setShowResetConfirm(false)}
                >
                  <img
                    src="/button_bg.png"
                    alt="bg"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <span className="relative z-10">NO</span>
                </button>
                <button
                  className="relative px-8 py-4 text-4xl w-40 cursor-pointer font-bold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 shadow-lg overflow-hidden"
                  onClick={resetGame}
                >
                  <img
                    src="/button_bg.png"
                    alt="bg"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <span className="relative z-10">YES</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameBoard;
