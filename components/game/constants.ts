import { toast } from "sonner";

export const LETTER_COLORS = {
  B: "text-yellow-500",
  I: "text-blue-500",
  N: "text-red-500",
  G: "text-green-500",
  O: "text-orange-500",
};

export const BG_COLORS = {
  B: "bg-yellow-500",
  I: "bg-blue-500",
  N: "bg-red-500",
  G: "bg-green-500",
  O: "bg-orange-500",
};

export const BORDER_COLORS = {
  B: "border-yellow-500",
  I: "border-blue-500",
  N: "border-red-500",
  G: "border-green-500",
  O: "border-orange-500",
};

export const getLetterForNumber = (num: number) => {
  if (num <= 15) return "B";
  if (num <= 30) return "I";
  if (num <= 45) return "N";
  if (num <= 60) return "G";
  return "O";
};

export const STATUS_CONFIG = {
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
    message: "CARD LOCKED - NO BINGO",
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
    message: "NO BINGO - CARD LOCKED",
    toast: () => toast.error("No Bingo - Card locked"),
  },
};