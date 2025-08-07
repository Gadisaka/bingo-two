"use client";

import { useEffect, useState } from "react";

export default function JackpotPage() {
  const [jackpotStartingAmount, setJackpotStartingAmount] = useState(200);
  const [dailyNumber, setDailyNumber] = useState(25);
  const [matchGap, setMatchGap] = useState(5);
  const [isClaimed, setIsClaimed] = useState(false);
  const [jackpotEnabled, setJackpotEnabled] = useState("On");
  const [jackpotPercent, setJackpotPercent] = useState(25);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("jackpotSettings");
    if (saved) {
      const data = JSON.parse(saved);
      setJackpotStartingAmount(
        data.jackpotStartingAmount || data.jackpotAmount || 200
      );
      setDailyNumber(data.dailyNumber);
      setMatchGap(data.matchGap);
      setIsClaimed(data.isClaimed);
      setJackpotEnabled(data.jackpotEnabled);
      setJackpotPercent(data.jackpotPercent);
    }
  }, []);

  const handleSave = () => {
    setLoading(true);
    const data = {
      jackpotStartingAmount,
      dailyNumber,
      matchGap,
      isClaimed,
      jackpotEnabled,
      jackpotPercent,
    };
    localStorage.setItem("jackpotSettings", JSON.stringify(data));
    setTimeout(() => {
      alert("✅ Jackpot settings saved!");
      setLoading(false);
    }, 300);
  };

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
          <p className="text-sm text-gray-600 mt-1">
            Jackpot amount will be calculated as this percentage of the total
            bet amount
          </p>
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
            Jackpot will only be active if total bet amount is equal to or
            greater than this amount
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
            min="0"
          />
          <p className="text-sm text-gray-600 mt-1">
            Maximum difference between winning number and daily number to
            trigger jackpot
          </p>
        </div>

        {/* Daily Number */}
        <div className="mb-6">
          <label className="block font-medium mb-1">Daily Jackpot Number</label>
          <input
            type="number"
            className="w-full border px-3 py-2 rounded"
            value={dailyNumber}
            onChange={(e) => setDailyNumber(parseInt(e.target.value))}
            min="1"
            max="75"
          />
          <p className="text-sm text-gray-600 mt-1">
            The target number for jackpot activation (1-75)
          </p>
        </div>

        {/* Buttons */}
        <div className="flex justify-between">
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
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
      </div>
    </div>
  );
}
