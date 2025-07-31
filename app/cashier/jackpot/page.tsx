"use client";

import { useEffect, useState } from "react";

const MOCK_COUNTDOWN_HOURS = 7;
const MOCK_COUNTDOWN_MS = MOCK_COUNTDOWN_HOURS * 60 * 60 * 1000; // 7 hours in milliseconds
const STORAGE_KEY = "jackpotCountdownEndTime";

const CountdownTimer = () => {
  const [timeLeft, setTimeLeft] = useState(MOCK_COUNTDOWN_MS);

  useEffect(() => {
    // Load target end time from localStorage or set new one
    let targetTime = localStorage.getItem(STORAGE_KEY);
    let targetTimestamp: number;

    if (targetTime) {
      targetTimestamp = parseInt(targetTime, 10);
      if (isNaN(targetTimestamp) || targetTimestamp < Date.now()) {
        // Expired or invalid, reset
        targetTimestamp = Date.now() + MOCK_COUNTDOWN_MS;
        localStorage.setItem(STORAGE_KEY, targetTimestamp.toString());
      }
    } else {
      targetTimestamp = Date.now() + MOCK_COUNTDOWN_MS;
      localStorage.setItem(STORAGE_KEY, targetTimestamp.toString());
    }

    const update = () => {
      const now = Date.now();
      const diff = targetTimestamp - now;
      if (diff <= 0) {
        // Reset countdown and update target time
        const newTarget = now + MOCK_COUNTDOWN_MS;
        localStorage.setItem(STORAGE_KEY, newTarget.toString());
        setTimeLeft(MOCK_COUNTDOWN_MS);
        targetTimestamp = newTarget;
      } else {
        setTimeLeft(diff);
      }
    };

    update(); // Initial call

    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="text-center p-4 rounded bg-gray-100 dark:bg-gray-800 max-w-xs mx-auto">
      <p className="text-lg font-semibold mb-2">Next Jackpot Countdown</p>
      <p className="text-3xl font-mono text-indigo-600 dark:text-indigo-400">
        {formatTime(timeLeft)}
      </p>
    </div>
  );
};

export default CountdownTimer;
