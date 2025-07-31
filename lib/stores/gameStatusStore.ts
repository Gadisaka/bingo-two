import { create } from "zustand";

export type GameStatus = "setup" | "ready" | "playing" | "finished" | string;

interface GameStatusState {
  currentGameStatus: GameStatus;
  setCurrentGameStatus: (status: GameStatus) => void;
}

export const useGameStatusStore = create<GameStatusState>((set) => ({
  currentGameStatus: "setup", // default value
  setCurrentGameStatus: (status) => set({ currentGameStatus: status }),
}));
