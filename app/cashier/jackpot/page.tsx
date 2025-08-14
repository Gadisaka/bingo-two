"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthContext";
import { toast } from "sonner";

export default function JackpotPage() {
  const { user } = useAuth();
  const [jackpotStartingAmount, setJackpotStartingAmount] = useState(200);
  const [dailyNumber, setDailyNumber] = useState(25);
  const [matchGap, setMatchGap] = useState(5);
  const [isClaimed, setIsClaimed] = useState(false);
  const [jackpotEnabled, setJackpotEnabled] = useState("Off");
  const [jackpotPercent, setJackpotPercent] = useState(25);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchJackpotSettings();
    }
  }, [user]);

  const fetchJackpotSettings = async () => {
    try {
      const response = await fetch(`/api/cashiers/${user.id}/jackpot`);
      if (response.ok) {
        const data = await response.json();
        setJackpotStartingAmount(data.jackpotStartingAmount || 200);
        setDailyNumber(data.dailyNumber || 25);
        setMatchGap(data.matchGap || 5);
        setIsClaimed(data.isClaimed || false);
        setJackpotEnabled(data.jackpotEnabled || "Off");
        setJackpotPercent(data.jackpotPercent || 25);
      } else {
        console.error("Failed to fetch jackpot settings");
        toast.error("Failed to load jackpot settings");
      }
    } catch (error) {
      console.error("Error fetching jackpot settings:", error);
      toast.error("Failed to load jackpot settings");
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.id) {
      toast.error("User not authenticated");
      return;
    }

    setLoading(true);
    try {
      const data = {
        jackpotStartingAmount,
        dailyNumber,
        matchGap,
        isClaimed,
        jackpotEnabled,
        jackpotPercent,
      };

      const response = await fetch(`/api/cashiers/${user.id}/jackpot`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success("Jackpot settings saved!");
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to save jackpot settings");
      }
    } catch (error) {
      console.error("Error saving jackpot settings:", error);
      toast.error("Failed to save jackpot settings");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen flex justify-center items-start bg-gray-50 py-10">
        <div className="w-full max-w-md bg-white p-6 shadow rounded">
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-2">Loading jackpot settings...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex justify-center items-start bg-gray-50 py-10">
      <div className="w-full max-w-md bg-white p-6 shadow rounded">
        {/* Jackpot Toggle */}
        <div className="mb-4">
          <label className="block font-medium mb-1">Jackpot</label>
          <select
            className="w-full border px-3 py-2 rounded"
            value={jackpotEnabled}
            onChange={(e) => setJackpotEnabled(e.target.value)}
          >
            <option value="On">On</option>
            <option value="Off">Off</option>
          </select>
        </div>

        {/* Jackpot Percent */}
        <div className="mb-4">
          <label className="block font-medium mb-1">Jackpot Percent (%)</label>
          <input
            type="number"
            className="w-full border px-3 py-2 rounded"
            value={jackpotPercent}
            onChange={(e) => setJackpotPercent(parseInt(e.target.value))}
            min="1"
            max="100"
          />
          <p className="text-sm text-gray-600 mt-1">የ ጃክፖት ሽልማት በ % ከደራሽ ላይ</p>
        </div>

        {/* Starting Amount */}
        <div className="mb-4">
          <label className="block font-medium mb-1">
            Minimum Total Bet to Activate Jackpot
          </label>
          <input
            type="number"
            className="w-full border px-3 py-2 rounded"
            value={jackpotStartingAmount}
            onChange={(e) => setJackpotStartingAmount(parseInt(e.target.value))}
            min="1"
          />
          <p className="text-sm text-gray-600 mt-1">
            የ ጃክፖት ሽልማት የሚጀምርበት የደራሽ መጠን
          </p>
        </div>

        {/* Match Gap */}
        <div className="mb-4">
          <label className="block font-medium mb-1">Jackpot Match Gap</label>
          <input
            type="number"
            className="w-full border px-3 py-2 rounded"
            value={matchGap}
            onChange={(e) => setMatchGap(parseInt(e.target.value))}
            min="1"
          />
          <p className="text-sm text-gray-600 mt-1">በስንት ጨዋታ ልዩነት</p>
        </div>

        {/* Daily Number */}
        <div className="mb-6">
          <label className="block font-medium mb-1">Daily Jackpot Count</label>
          <input
            type="number"
            className="w-full border px-3 py-2 rounded"
            value={dailyNumber}
            onChange={(e) => setDailyNumber(parseInt(e.target.value))}
            min="1"
            max="75"
          />
          <p className="text-sm text-gray-600 mt-1">
            በ ቀን ውስጥ የሚሰጠው የጃክፖት ሽልማት ብዛት
          </p>
        </div>

        {/* Buttons */}
        <div className="flex justify-between">
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
          <button
            className="bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2 rounded"
            onClick={() => window.history.back()}
          >
            Back
          </button>
        </div>

        {/* Reset Daily Jackpot Data */}
        {/* <div className="mt-4 pt-4 border-t">
          <button
            className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm"
            onClick={() => {
              const today = new Date().toDateString();
              const dailyJackpotKey = `dailyJackpot_${today}`;
              localStorage.removeItem(dailyJackpotKey);
              alert("Daily jackpot data reset for today!");
            }}
          >
            Reset Today's Jackpot Data
          </button>
          <p className="text-xs text-gray-500 mt-1 text-center">
            Use this to reset jackpot tracking for testing purposes
          </p>
        </div> */}
      </div>
    </div>
  );
}
