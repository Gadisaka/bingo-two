import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/components/AuthContext";

interface JackpotSettings {
  enabled: boolean;
  percent: number;
  startingAmount: number;
  matchGap: number;
  dailyNumber: number;
}

interface TodayStats {
  todayGamesCount: number;
  nextGameNumber: number;
  jackpotsAwarded: number;
  remainingJackpots: number;
  nextGameEligible: boolean;
}

interface NextGame {
  number: number;
  jackpotEligible: boolean;
  explanation: string;
}

interface JackpotInfo {
  jackpotSettings: JackpotSettings;
  todayStats: TodayStats;
  nextGame: NextGame;
}

export const useGameSession = () => {
  const { user } = useAuth();
  const [jackpotInfo, setJackpotInfo] = useState<JackpotInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch current jackpot information
  const fetchJackpotInfo = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/cashiers/${user.id}/jackpot-info`);
      if (!response.ok) {
        throw new Error("Failed to fetch jackpot info");
      }

      const data = await response.json();
      setJackpotInfo(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch jackpot info"
      );
      console.error("Error fetching jackpot info:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Check if next game is jackpot eligible
  const isNextGameJackpotEligible = useCallback(() => {
    return jackpotInfo?.todayStats.nextGameEligible || false;
  }, [jackpotInfo]);

  // Calculate jackpot amount for a given bet
  const calculateJackpotAmount = useCallback(
    (totalBet: number) => {
      if (!jackpotInfo || !isNextGameJackpotEligible()) return 0;

      return Math.round((totalBet * jackpotInfo.jackpotSettings.percent) / 100);
    },
    [jackpotInfo, isNextGameJackpotEligible]
  );

  // Get next game number
  const getNextGameNumber = useCallback(() => {
    return jackpotInfo?.todayStats.nextGameNumber || 1;
  }, [jackpotInfo]);

  // Get today's game count
  const getTodayGamesCount = useCallback(() => {
    return jackpotInfo?.todayStats.todayGamesCount || 0;
  }, [jackpotInfo]);

  // Check if jackpot is enabled
  const isJackpotEnabled = useCallback(() => {
    return jackpotInfo?.jackpotSettings.enabled || false;
  }, [jackpotInfo]);

  // Get remaining jackpots for today
  const getRemainingJackpots = useCallback(() => {
    return jackpotInfo?.todayStats.remainingJackpots || 0;
  }, [jackpotInfo]);

  // Refresh jackpot info
  const refresh = useCallback(() => {
    fetchJackpotInfo();
  }, [fetchJackpotInfo]);

  // Initialize on mount
  useEffect(() => {
    fetchJackpotInfo();
  }, [fetchJackpotInfo]);

  return {
    // State
    jackpotInfo,
    loading,
    error,

    // Actions
    refresh,

    // Computed values
    isNextGameJackpotEligible,
    calculateJackpotAmount,
    getNextGameNumber,
    getTodayGamesCount,
    isJackpotEnabled,
    getRemainingJackpots,
  };
};
