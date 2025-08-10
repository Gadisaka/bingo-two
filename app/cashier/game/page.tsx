"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import GameBoard from "@/components/game/GameBoard";
import GameSetUp from "@/components/game/GameSetUp";
import { toast } from "sonner";
import { LoaderPinwheelIcon, Wallet, AlertTriangle } from "lucide-react";
import { useGameStatusStore } from "@/lib/stores/gameStatusStore";

const LOCAL_STORAGE_KEY = "gameStatus";
const WALLET_POLL_INTERVAL_MS = 30000; // 30 seconds

interface WalletData {
  wallet: number;
  debtBalance?: number;
}

const GamePage = () => {
  const [gameStatus, setGameStatus] = useState<"setup" | "ready">("setup");
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loadingWallet, setLoadingWallet] = useState(true);

  const walletDataRef = useRef<WalletData | null>(null);

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
      if (
        walletDataRef.current?.wallet !== data.wallet ||
        walletDataRef.current?.debtBalance !== data.debtBalance
      ) {
        walletDataRef.current = data;
        setWalletData(data);
      }
    } catch (error) {
      toast.error("Failed to load wallet balance");
      walletDataRef.current = null;
      setWalletData(null);
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

  if (walletData !== null && walletData.wallet <= 0) {
    return (
      <div className="flex flex-col justify-center items-center px-6">
        <div className="max-w-md w-full bg-white/80 rounded-xl shadow-lg p-8 text-center">
          <Wallet className="mx-auto text-red-500 text-6xl mb-6 animate-pulse" />
          <h2 className="text-2xl font-semibold mb-3 text-gray-800">
            Wallet Balance Empty
          </h2>
          <p className="text-gray-600 mb-6">
            Oops! You don't have enough balance to play the game.
            {walletData.debtBalance && walletData.debtBalance > 0 && (
              <span className="block mt-2 text-red-600 font-semibold">
                Current Debt: ${walletData.debtBalance.toFixed(2)}
              </span>
            )}
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
      {/* {walletData && walletData.debtBalance && walletData.debtBalance > 0 && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <span className="text-yellow-800 font-medium">
              You have an outstanding debt of $
              {walletData.debtBalance.toFixed(2)}
            </span>
          </div>
        </div>
      )} */}

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
