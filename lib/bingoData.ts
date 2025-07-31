import { BingoCard } from "@/types/types";
import { bingoCards100 } from "./bingoCards100";

// Use the imported 100 cards for the first set
export const bingoCardsSet1 = bingoCards100;

// Create different sets by duplicating and modifying the predefined cards
const createCardSet = (setId: number): BingoCard[] => {
  return bingoCards100.map((card) => ({
    ...card,
    id: card.id + (setId - 1) * 100, // Ensure unique IDs across sets
  }));
};

// Export 6 different sets based on the 100 predefined cards
export const bingoCardsSet2 = createCardSet(2);
export const bingoCardsSet3 = createCardSet(3);
export const bingoCardsSet4 = createCardSet(4);
export const bingoCardsSet5 = createCardSet(5);
export const bingoCardsSet6 = createCardSet(6);

// Export the base 100 cards for direct access
export const baseBingoCards = bingoCards100;
