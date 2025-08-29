"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Play, Pause, Fullscreen } from "lucide-react";

interface GameControlsProps {
  isAutoPlaying: boolean;
  toggleAutoPlay: () => void;
  setup: () => void;
  callSpeed: number;
  handleSpeedChange: (speed: number) => void;
  gameOver: boolean;
  shuffel: () => void;
  handleResetConfirm: () => void;
  handleCheckCard: () => void;
  callNextNumber: () => void;
  debugJackpot: () => void;
}

export default function GameControls({
  setup,
  shuffel,
  isAutoPlaying,
  toggleAutoPlay,
  callSpeed,
  handleSpeedChange,
  gameOver,
  handleResetConfirm,
  handleCheckCard,
  callNextNumber,
  debugJackpot,
}: GameControlsProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isGameFinished, setIsGameFinished] = useState(false);
  const [isShuffleAnimating, setIsShuffleAnimating] = useState(false);

  // Preload the shuffle video for smooth playback
  useEffect(() => {
    const video = document.createElement("video");
    video.preload = "auto";
    video.src = "/shuffleAnimation.mp4";
    video.muted = true;
    // Load the video into browser cache
    video.load();
  }, []);

  const handleFinishGame = () => {
    setIsGameFinished(true);
  };

  // Toggle fullscreen on button click
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

  // Play shuffle sound effect
  const playShuffleSound = () => {
    new Audio("/sounds/shuffle.mp3")
      .play()
      .catch((e) => console.warn("Shuffle sound failed", e));
  };

  // Handle shuffle with animation
  const handleShuffleWithAnimation = () => {
    setIsShuffleAnimating(true);
    // Call the original shuffle function
    shuffel();

    // Set timer to match shuffle duration (10 seconds)
    setTimeout(() => {
      setIsShuffleAnimating(false);
    }, 10000);
  };

  // Handle animation end (fallback)
  const handleAnimationEnd = () => {
    // This will be called when video ends, but timer will handle the 10-second duration
  };

  return (
    <div className="p-4 font-varsity w-fit">
      <div className="space-y-2 flex gap-4 md:gap-20 flex-col md:flex-row">
        {/* <div className="flex flex-col gap-2 justify-center items-center w-full"> */}
        <div className="flex ">
          <button
            className="relative text-white cursor-pointer font-bold text-3xl h-16 w-48 px-6 py-3"
            onClick={handleCheckCard}
          >
            <img
              src="/button_bg.png"
              alt="bg"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <span className="relative z-10">CHECK</span>
          </button>
          <button
            className={`relative cursor-pointer text-white font-bold text-3xl h-16 w-48 px-6 py-3 ${
              gameOver && "text-white"
            }`}
            onClick={toggleAutoPlay}
            disabled={gameOver}
          >
            <img
              src="/button_bg.png"
              alt="bg"
              className={`absolute inset-0 w-full h-full object-cover ${
                gameOver ? "grayscale" : ""
              }`}
            />
            <span className="relative z-10">
              {isAutoPlaying ? <>PAUSE</> : <>START</>}
            </span>
          </button>

          {/* <button
                className="yellow-card-button px-6 py-3 text-2xl "
                onClick={() => {
                  playShuffleSound();
                  callNextNumber();
                }}
                disabled={isAutoPlaying || gameOver}
              >
                CALL NEXT
              </button> */}

          <button
            className="relative text-white cursor-pointer font-bold text-3xl h-16 w-48 px-6 py-3"
            onClick={handleResetConfirm}
          >
            <img
              src="/button_bg.png"
              alt="bg"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <span className="relative z-10">RESTART</span>
          </button>

          <button
            className={`relative cursor-pointer text-white font-bold text-3xl h-16 w-48 px-6 py-3 ${
              isAutoPlaying && "text-white"
            }`}
            disabled={isAutoPlaying || isShuffleAnimating}
            onClick={handleShuffleWithAnimation}
          >
            <img
              src="/button_bg.png"
              alt="bg"
              className={`absolute inset-0 w-full h-full object-cover ${
                isAutoPlaying ? "grayscale " : ""
              }`}
            />
            <span className="relative z-10"> SHUFFLE</span>
          </button>

          {/* Debug button for jackpot troubleshooting */}
          {/* <button
            className="relative text-white cursor-pointer font-bold text-xl h-16 w-32 px-4 py-3 bg-red-600 hover:bg-red-700"
            onClick={debugJackpot}
            title="Debug Jackpot Settings"
          >
            <span className="relative z-10">DEBUG</span>
          </button> */}
        </div>
        {/* <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              onClick={setup}
            >
              Select Cards
            </Button>
          </div> */}

        {/* <div className="flex items-center justify-around w-full gap-2"> */}
        {/* <div className="flex flex-col w-1/2 items-center gap-2">
              <input
                type="range"
                id="speed-control"
                min="3"
                max="10"
                step="1"
                value={callSpeed / 1000}
                onChange={(e) =>
                  handleSpeedChange(Number(e.target.value) * 1000)
                }
                className="w-full cursor-pointer accent-sky-600 "
              />
              <Label
                htmlFor="speed-control"
                className="text-gray-800 font-bold text-md"
              >
                Auto Call {callSpeed / 1000} seconds
              </Label>
            </div> */}

        {/* <button
              type="button"
              aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              className="text-white  rounded hover:bg-sky-700"
              onClick={toggleFullscreen}
            >
              <Fullscreen className="h-10 w-10" />
            </button> */}
        {/* </div> */}
        {/* </div> */}
      </div>

      {/* Shuffle Animation Overlay */}
      {isShuffleAnimating && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
          <video
            className="w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            onError={handleAnimationEnd}
            style={{
              willChange: "transform",
              backfaceVisibility: "hidden",
              transform: "translateZ(0)",
            }}
          >
            <source src="/shuffleAnimation.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      )}
    </div>
  );
}
