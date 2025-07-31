export type BingoColumn = "B" | "I" | "N" | "G" | "O";

export type BingoCard = {
  id: number;
} & Record<BingoColumn, number[]>;

export type BingoPattern =
  | "1line"
  | "2line"
  | "3line"
  | "Large4Corner"
  | "Small4Corner"
  | "L"
  | "X"
  | "T"
  | "AnyLineOrLarge4Corner"
  | "AnyLineOrSmall4Corner"
  | "diagonals"
  | "x"
  | "outerSquare"
  | "innerSquare";

export type CardSetId = "set1" | "set2" | "set3" | "set4" | "set5" | "set6";
