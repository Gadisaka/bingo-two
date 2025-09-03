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
import { Button } from "../ui/button";
import { toast } from "sonner";
import { createReport } from "@/lib/api";
import { WinningAmountDisplay } from "./WinningAmountDisplay";
import { NumberDisplay } from "./NumberDisplay";
import { GameStats } from "./GameStats";
import NumberBoard from "./NumberBoard";
import {
  checkWinningPattern,
  checkCardValidation,
  type WinningResult,
} from "@/lib/bingoUtils";
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

  // OPTIMIZATION: Audio preloading queue to limit concurrent downloads
  const audioPreloadQueue = useRef<Array<{ folder: string; fileName: string }>>(
    []
  );
  const isPreloading = useRef<boolean>(false);
  const maxConcurrentPreloads = 3;
  const activePreloads = useRef<number>(0);

  useEffect(() => {
    const preloadAudios = () => {
      // Get the selected audio folder from localStorage
      const selectedFolder = localStorage.getItem("audioFolder") || "Gold";

      // OPTIMIZATION: Only preload essential sounds, not all 75 numbers
      const essentialFiles = [
        "win",
        "win_classical",
        "jackpot_winner",
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

      // Preload only essential sounds
      essentialFiles.forEach((file) => {
        const key = `${selectedFolder}/${file}`;
        if (!audioCache.current[key]) {
          const audio = new Audio(`/${selectedFolder}/${file}.mp3`);
          audio.preload = "auto";
          audioCache.current[key] = audio;
        }
      });

      // Add a function to dynamically load audio from any folder when needed
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

  // OPTIMIZATION: Audio preloading queue system
  const processPreloadQueue = useCallback(() => {
    if (isPreloading.current || audioPreloadQueue.current.length === 0) return;

    isPreloading.current = true;

    const processNext = () => {
      if (
        audioPreloadQueue.current.length === 0 ||
        activePreloads.current >= maxConcurrentPreloads
      ) {
        isPreloading.current = false;
        return;
      }

      const { folder, fileName } = audioPreloadQueue.current.shift()!;
      const key = `${folder}/${fileName}`;

      if (!audioCache.current[key]) {
        activePreloads.current++;
        const audio = new Audio(`/${folder}/${fileName}.mp3`);

        audio.addEventListener("canplaythrough", () => {
          audioCache.current[key] = audio;
          activePreloads.current--;
          processNext();
        });

        audio.addEventListener("error", () => {
          console.warn(`Failed to preload audio: ${key}`);
          activePreloads.current--;
          processNext();
        });

        audio.preload = "auto";
      } else {
        processNext();
      }
    };

    processNext();
  }, []);

  const queueAudioPreload = useCallback(
    (folder: string, fileName: string) => {
      const key = `${folder}/${fileName}`;
      if (
        !audioCache.current[key] &&
        !audioPreloadQueue.current.some(
          (item) => item.folder === folder && item.fileName === fileName
        )
      ) {
        audioPreloadQueue.current.push({ folder, fileName });
        processPreloadQueue();
      }
    },
    [processPreloadQueue]
  );

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

      // OPTIMIZATION: Only preload essential sounds, not all 75 numbers
      const essentialFiles = [
        "win",
        "win_classical",
        "jackpot_winner",
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

      // Preload only essential sounds from new folder
      essentialFiles.forEach((file) => {
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
        lastAudioFolder.current = e.newValue;
      }
    };

    // Listen for changes from other tabs/windows
    window.addEventListener("storage", handleStorageChange);

    // OPTIMIZATION: Remove polling, use event-driven approach only
    // The storage event will handle cross-tab changes
    // For same-tab changes, we'll rely on the component that changes the folder
    // to call handleAudioFolderChange directly

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [handleAudioFolderChange]);

  // Updated playAudioForNumber function using selected folder
  const playAudioForNumber = useCallback(
    (num: number) => {
      // Check if audio is muted
      const isMuted = localStorage.getItem("audioMuted") === "true";
      if (isMuted) return;

      const selectedFolder = localStorage.getItem("audioFolder") || "Gold";
      const key = `${selectedFolder}/${num}`;
      let audio = audioCache.current[key];

      // If audio is not cached, load it immediately for playback
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

      // OPTIMIZATION: Preload next few numbers in background
      for (let i = 1; i <= 5; i++) {
        const nextNum = num + i;
        if (nextNum <= 75) {
          queueAudioPreload(selectedFolder, nextNum.toString());
        }
      }
    },
    [queueAudioPreload]
  );

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

  // Helper function to play multiple sounds with proper timing
  const playMultipleSounds = useCallback(
    (sounds: Array<{ file: string; delay: number }>) => {
      // Check if audio is muted
      const isMuted = localStorage.getItem("audioMuted") === "true";
      if (isMuted) return;

      sounds.forEach(({ file, delay }) => {
        setTimeout(() => {
          playAudio(file);
        }, delay);
      });
    },
    [playAudio]
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
        jackpotInfo.jackpotSettings.enabled &&
        currentGameNumber % jackpotInfo.jackpotSettings.matchGap === 0 &&
        totalBetAmount >= jackpotInfo.jackpotSettings.startingAmount
      ) {
        jackpotWon = true;
        jackpotAmount = Math.round(
          (totalBetAmount * jackpotInfo.jackpotSettings.percent) / 100
        );

        console.log("🎉 JACKPOT WIN RECORDED:", {
          gameNumber: currentGameNumber,
          jackpotAmount: jackpotAmount,
          totalBet: totalBetAmount,
          minimumRequired: jackpotInfo.jackpotSettings.startingAmount,
        });
      } else if (
        jackpotInfo &&
        jackpotInfo.jackpotSettings.enabled &&
        currentGameNumber % jackpotInfo.jackpotSettings.matchGap === 0
      ) {
        console.log("❌ JACKPOT ELIGIBLE BUT INSUFFICIENT BET:", {
          gameNumber: currentGameNumber,
          totalBet: totalBetAmount,
          minimumRequired: jackpotInfo.jackpotSettings.startingAmount,
          shortfall:
            jackpotInfo.jackpotSettings.startingAmount - totalBetAmount,
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
          console.log(`🎮 Loading game setup from localStorage:`, {
            gamePattern,
            selectedCards: ids?.length,
          });
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
        text: "text-green-500",
        message: "አሸንፏል",
        toast: () => toast.success("አሸንፏል"),
      },
      not_in_game: {
        bg: "bg-yellow-100",
        text: "text-yellow-500",
        message: "ይህ ካርድ አልተመዘገበም",
        toast: () => toast.warning("ይህ ካርድ አልተመዘገበም"),
      },
      already_checked: {
        bg: "bg-gray-100",
        text: "text-red-500",
        message: "አላሸነፈም",
        toast: () => toast.error("አላሸነፈም"),
      },
      already_won: {
        bg: "bg-blue-100",
        text: "text-blue-500",
        message: "አሸንፏል",
        toast: () => toast.info("አሸንፏል"),
      },
      lose: {
        bg: "bg-red-100",
        text: "text-red-500",
        message: "አላሸነፈም",
        toast: () => toast.error("አላሸነፈም"),
      },
      not_now: {
        bg: "bg-orange-100",
        text: "text-orange-500",
        message: "አልፎታል",
        toast: () => toast("አልፎታል"),
      },
    };

    return configs[status as keyof typeof configs] || configs.lose;
  };

  const handleCardCheck = async () => {
    // Use prompt instead of dialog input
    const cardId = prompt("Enter card number to check:");
    if (!cardId || cardId.trim() === "") return;

    // Validate that it's a valid number
    const parsedId = Number.parseInt(cardId);
    if (isNaN(parsedId)) {
      toast.error("Please enter a valid card number");
      return;
    }

    const card = currentCardSet.find((c) => c.id === parsedId);
    const isInGame = selectedCards.some((c) => c.id === parsedId);
    const isAlreadyWon = winners.includes(parsedId);
    const isAlreadyChecked = blacklistedCards.includes(parsedId);

    // Use the new validation function from bingoUtils
    const validation = checkCardValidation(
      parsedId.toString(),
      card,
      isInGame,
      isAlreadyWon,
      isAlreadyChecked
    );

    if (validation.shouldLose) {
      toast.error(validation.reason);
      setCheckResult({ status: "lose", card });
      setJackpotResult(null);
      return;
    }

    // Handle special statuses that aren't "lose"
    if (validation.reason === "not_in_game") {
      setCheckResult({ status: "not_in_game", card });
      setJackpotResult(null);
      playAudio(`cardnotfound.mp3`);
      getStatusConfig("not_in_game").toast();
      return;
    }

    if (validation.reason === "already_won") {
      setCheckResult({ status: "already_won", card });
      setJackpotResult(null);
      getStatusConfig("already_won").toast();
      return;
    }

    if (validation.reason === "already_checked") {
      setCheckResult({ status: "already_checked", card });
      setJackpotResult(null);
      getStatusConfig("already_checked").toast();
      return;
    }

    console.log(
      `🔍 Checking winning pattern for card ${card.id}: pattern="${gamePattern}", calledNumbers=${calledNumbers.length}`
    );
    const result = checkWinningPattern(
      card,
      calledNumbers,
      gamePattern,
      currentNumber
    );
    const status = result.status;
    const isWinner = status === "win"; // Only true if status is actually "win"

    // NEW CLEAN SYSTEM: Jackpot logic using reports table
    let jackpotResult = { isJackpot: false, jackpotAmount: 0 };
    if (isWinner) {
      // Check if this game was jackpot eligible
      const totalBetAmount = selectedCards.length * (betAmount || 0);
      const currentGameNumber = getTodayGamesCount(); // This game just completed

      // Check if this game number matches jackpot pattern AND meets minimum bet requirement
      if (
        jackpotInfo &&
        jackpotInfo.jackpotSettings.enabled &&
        currentGameNumber % jackpotInfo.jackpotSettings.matchGap === 0 &&
        totalBetAmount >= jackpotInfo.jackpotSettings.startingAmount
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
          minimumRequired: jackpotInfo.jackpotSettings.startingAmount,
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
      } else if (
        jackpotInfo &&
        jackpotInfo.jackpotSettings.enabled &&
        currentGameNumber % jackpotInfo.jackpotSettings.matchGap === 0
      ) {
        console.log("❌ JACKPOT ELIGIBLE BUT INSUFFICIENT BET:", {
          gameNumber: currentGameNumber,
          totalBet: totalBetAmount,
          minimumRequired: jackpotInfo.jackpotSettings.startingAmount,
          shortfall:
            jackpotInfo.jackpotSettings.startingAmount - totalBetAmount,
        });
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
      // Play win sound with additional sounds based on win type
      if (jackpotResult.isJackpot) {
        // For jackpot wins: win.mp3 + jackpot_winner.mp3
        playMultipleSounds([
          { file: "win_classical.mp3", delay: 0 },
          // { file: "win.mp3", delay: 0 },
          { file: "jackpot_winner.mp3", delay: 600 },
        ]);
      } else {
        // For regular wins: win.mp3 + win_classical.mp3
        playMultipleSounds([
          { file: "win_classical.mp3", delay: 0 },
          { file: "win.mp3", delay: 600 },
        ]);
      }

      setWinners((prev) => {
        const updated = [...prev, parsedId];
        localStorage.setItem("winners", JSON.stringify(updated));
        return updated;
      });
      //alfotal
    } else if (status === "not_now") {
      // Do not blacklist or mark as win, just show message
      console.log(
        `🔄 Card ${parsedId} got "not_now" - can be checked again later`
      );
      playAudio(`pass.mp3`);
    } else {
      // For lose status, don't automatically blacklist - let user manually lock
      console.log(`❌ Card ${parsedId} lost - can be manually blocked`);
      playAudio(`lose.mp3`);
    }

    setCheckResult({ status: status as (typeof checkResult)["status"], card });
    setJackpotResult(jackpotResult);
    getStatusConfig(status).toast();

    // No need to show dialog since we removed it
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
      <div className="grid grid-cols-5 gap-1 bg-white mb-4 text-center font-bold w-[320px] p-2">
        {/* <div className="bg-blue-500 text-white p-1 rounded">B</div>
        <div className="bg-red-500 text-white p-1 rounded">I</div>
        <div className="bg-green-500 text-white p-1 rounded">N</div>
        <div className="bg-yellow-600 text-white p-1 rounded">G</div>
        <div className="bg-purple-500 text-white p-1 rounded">O</div> */}

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
                  "border p-1 text-center font-bold w-16 h-16 flex text-4xl font-varsity items-center justify-center bg-white text-black",
                  String(num) === "FREE" ? "bg-orange-500 text-black " : "",
                  isCalled ? "bg-orange-500 rounded-full" : "",
                  isCurrent ? "border-4 border-red-500" : "",
                  isWinningCell ? "!bg-green-600 !text-white rounded-none" : ""
                )}
              >
                {String(num) === "FREE" ? (
                  <div className=" leading-tight">f</div>
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
  const shuffleAudioRef = useRef<HTMLAudioElement | null>(null);

  const shuffel = () => {
    const confirmed = window.confirm("Are you sure you want to shuffle?");
    if (!confirmed) return;
    if (autoCall) {
      setAutoCall(false);
    }
    setisReseting(true);

    // Stop any previously playing shuffle audio
    if (shuffleAudioRef.current) {
      shuffleAudioRef.current.pause();
      shuffleAudioRef.current.currentTime = 0;
    }

    // Play shuffle audio and store reference
    const selectedFolder = localStorage.getItem("audioFolder") || "Gold";
    const key = `${selectedFolder}/bingo_ball`;
    let audio = audioCache.current[key];

    // If audio is not cached, load it dynamically
    if (!audio && audioLoader.current) {
      audio = audioLoader.current(selectedFolder, "bingo_ball");
    }

    if (audio) {
      try {
        audio.currentTime = 0;
        audio.play();
        shuffleAudioRef.current = audio;
      } catch (err) {
        console.warn("Shuffle audio playback failed", err);
      }
    }

    timeoutRef.current = setTimeout(() => {
      setisReseting(false);
      // Stop the shuffle audio after 5 seconds
      if (shuffleAudioRef.current) {
        shuffleAudioRef.current.pause();
        shuffleAudioRef.current.currentTime = 0;
        shuffleAudioRef.current = null;
      }
    }, 5000);
  };

  // Cleanup timeout and audio on component unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (shuffleAudioRef.current) {
        shuffleAudioRef.current.pause();
        shuffleAudioRef.current.currentTime = 0;
        shuffleAudioRef.current = null;
      }
    };
  }, []);

  // Add click listener to hide result display when anything is clicked
  useEffect(() => {
    const handleDocumentClick = () => {
      if (checkResult) {
        setCheckResult(null);
        setJackpotResult(null);
      }
    };

    // Add click listener to document
    document.addEventListener("click", handleDocumentClick);

    // Cleanup on unmount
    return () => {
      document.removeEventListener("click", handleDocumentClick);
    };
  }, [checkResult]);

  return (
    <div className="flex flex-col justify-start  items-center h-screen px-6  relative overflow-hidden z-0">
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
            <h2 className="tot-bet-title font-potta-one text-3xl">
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
              <>
                <div className="absolute top-2 right-2 bg-yellow-500 text-black px-2 py-1 rounded text-xs font-bold">
                  <div>
                    {getRemainingJackpotsLocal()}/
                    {jackpotInfo.jackpotSettings.dailyNumber}
                  </div>
                </div>
                {/* Jackpot Amount Display */}
                <div className="absolute  w-fit left-2 right-2 bg-yellow-500 text-black px-2 py-1 rounded text-3xl font-bold">
                  <div className="">
                    {(() => {
                      const totalBetAmount =
                        selectedCards.length * (betAmount || 0);
                      if (
                        totalBetAmount >=
                        jackpotInfo.jackpotSettings.startingAmount
                      ) {
                        const jackpotAmount = Math.round(
                          (totalBetAmount *
                            jackpotInfo.jackpotSettings.percent) /
                            100
                        );
                        return `${jackpotAmount} Birr`;
                      } else {
                        return (
                          <h1 className=" text-xl font-bold">low bet amount</h1>
                        );
                      }
                    })()}
                  </div>
                </div>
              </>
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
          {/* Card Check Result Display */}
          {checkResult && checkResult.card && (
            <div className="w-full flex justify-center z-10">
              <div className=" text-white w-1/2">
                <div className="flex gap-6">
                  {/* Left Side - Jackpot Result */}
                  <div className="flex-1">
                    {checkResult.status === "win" &&
                      jackpotResult?.isJackpot && (
                        <div className="p-4 bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 rounded-lg border-2 border-yellow-400 shadow-lg">
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

                  {/* Center - Card Grid */}
                  <div className="flex-1">
                    {!(
                      checkResult.status === "already_checked" ||
                      checkResult.status === "not_in_game"
                    ) && renderCardGrid(checkResult.card.id)}
                  </div>

                  {/* Right Side - Game Result */}
                  <div className="flex-1 flex flex-col items-center justify-center">
                    {/* Result Message */}
                    <div
                      className={cn(
                        "p-4 rounded text-center font-bold text-4xl",
                        // getStatusConfig(checkResult.status).bg,
                        getStatusConfig(checkResult.status).text
                      )}
                    >
                      {getStatusConfig(checkResult.status).message}
                      <h1 className="text-orange-500">
                        ካርድ ቁጥር: {checkResult.card.id}
                      </h1>
                    </div>
                    <div className="flex gap-2 mt-4 justify-center">
                      {/* Block button for not_now status */}
                      {checkResult.status === "not_now" && (
                        <button
                          className="relative text-white cursor-pointer font-bold text-2xl h-12 w-44 px-6 py-3"
                          onClick={handleBlockCard}
                        >
                          <img
                            src="/button_bg.png"
                            alt="bg"
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                          <span className="relative font-varsity z-10">
                            lock
                          </span>
                        </button>
                      )}

                      {/* Manual lock button for lose status */}
                      {checkResult.status === "lose" && (
                        <button
                          className="relative text-white cursor-pointer font-bold text-2xl h-12 w-44 px-6 py-3"
                          onClick={handleBlockCard}
                        >
                          <img
                            src="/button_bg.png"
                            alt="bg"
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                          <span className="relative font-varsity z-10">
                            lock
                          </span>
                        </button>
                      )}

                      {/* Always show a button for other statuses */}
                    </div>
                  </div>
                </div>

                {/* Action Buttons - Always Visible */}
              </div>
            </div>
          )}
        </div>
        <div className="flex w-full justify-around px items-center gap-4 mb-22 z-10">
          <div className="flex w-fit items-center gap-4 ">
            <div className="flex flex-col items-center justify-center">
              <h2 className="font-bold text-3xl text-white mb-2 font-varsity drop-shadow-lg">
                BET
              </h2>
              <div className="relative">
                <img
                  src="/big_money.png"
                  alt="bg"
                  className="w-48 h-16 object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-4xl mb-1 drop-shadow-lg">
                  {betAmount} <span className="text-3xl"> Birr</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <h2 className="font-bold text-3xl text-white mb-2 font-varsity drop-shadow-lg">
                TOT BET
              </h2>
              <div className="relative">
                <img
                  src="/big_money.png"
                  alt="bg"
                  className="w-48 h-16 object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-4xl mb-1 drop-shadow-lg">
                  {winningAmount} <span className="text-3xl "> Birr</span>
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
              handleCardCheck(); // Call the card check function directly
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
        <div className="fixed inset-0 bg-black/5 bg-opacity-50 h-full font-varsity w-full flex items-center justify-center z-50">
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
