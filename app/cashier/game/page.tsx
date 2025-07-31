"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import GameBoard from "@/components/game/GameBoard";
import GameSetUp from "@/components/game/GameSetUp";
import { toast } from "sonner";
import { LoaderPinwheelIcon, Wallet } from "lucide-react";
import { useGameStatusStore } from "@/lib/stores/gameStatusStore";

const LOCAL_STORAGE_KEY = "gameStatus";
const WALLET_POLL_INTERVAL_MS = 30000; // 30 seconds

const GamePage = () => {
  const [gameStatus, setGameStatus] = useState<"setup" | "ready">("setup");
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [loadingWallet, setLoadingWallet] = useState(true);

  const walletBalanceRef = useRef<number | null>(null);

  useEffect(() => {
    const storedStatus = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedStatus === "ready" || storedStatus === "setup") {
      setGameStatus(storedStatus);
    } else {
      localStorage.setItem(LOCAL_STORAGE_KEY, "setup");
      setGameStatus("setup");
    }
  }, []);

  const fetchWallet = useCallback(async () => {
    try {
      setLoadingWallet(true);
      const res = await fetch("/api/dashboard/wallet", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch wallet");
      const data = await res.json();
      if (walletBalanceRef.current !== data.wallet) {
        walletBalanceRef.current = data.wallet;
        setWalletBalance(data.wallet);
      }
    } catch (error) {
      toast.error("Failed to load wallet balance");
      walletBalanceRef.current = null;
      setWalletBalance(null);
    } finally {
      setLoadingWallet(false);
    }
  }, []);

  useEffect(() => {
    fetchWallet();
    const intervalId = setInterval(fetchWallet, WALLET_POLL_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [fetchWallet]);

  // To update:
  const setCurrentGameStatus = useGameStatusStore(
    (state) => state.setCurrentGameStatus
  );

  const updateGameStatus = (status: "setup" | "ready") => {
    localStorage.setItem(LOCAL_STORAGE_KEY, status);
    setGameStatus(status);
    setCurrentGameStatus(status);
  };

  if (walletBalance !== null && walletBalance <= 0) {
    return (
      <div className="flex flex-col justify-center items-center px-6">
        <div className="max-w-md w-full bg-white/80 rounded-xl shadow-lg p-8 text-center">
          <Wallet className="mx-auto text-red-500 text-6xl mb-6 animate-pulse" />
          <h2 className="text-2xl font-semibold mb-3 text-gray-800">
            Wallet Balance Empty
          </h2>
          <p className="text-gray-600 mb-6">
            Oops! You don't have enough balance to play the game.
          </p>
          <button
            onClick={fetchWallet}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-red-500 text-white rounded-lg font-medium shadow-md hover:bg-red-700 transition"
            aria-label="Reload Wallet"
          >
            <LoaderPinwheelIcon className="text-xl" />
            Check Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      {gameStatus === "setup" ? (
        <GameSetUp
          onStart={() => {
            updateGameStatus("ready");
          }}
        />
      ) : (
        <GameBoard
          onBackToSetup={() => {
            updateGameStatus("setup");
          }}
        />
      )}
    </div>
  );
};

export default GamePage;
