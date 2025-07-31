import { BingoCard, BingoPattern } from "@/types/types";

interface WinningResult {
  isWinner: boolean;
  winningCells: Array<{ row: number; col: number }>;
}

export function checkWinningPattern(
  card: BingoCard,
  calledNumbers: number[],
  pattern: BingoPattern = "1line"
): WinningResult {
  const columns = ["B", "I", "N", "G", "O"] as const;
  const size = 5;
  const winningCells: Array<{ row: number; col: number }> = [];

  // Helper function to check if a number is called
  const isCalled = (num: number) => calledNumbers.includes(num);

  // Helper function to get number at position
  const getNumberAt = (row: number, col: number) => {
    const column = columns[col];
    return card[column][row];
  };

  // Helper function to check if a cell is marked (called or free space)
  const isMarked = (row: number, col: number) => {
    if (row === 2 && col === 2) return true; // Free space
    const num = getNumberAt(row, col);
    return isCalled(num);
  };

  // Check rows
  const winningRows: Array<{ row: number; col: number }>[] = [];
  for (let row = 0; row < size; row++) {
    let rowWin = true;
    const rowCells: Array<{ row: number; col: number }> = [];

    for (let col = 0; col < size; col++) {
      if (!isMarked(row, col)) {
        rowWin = false;
        break;
      }
      rowCells.push({ row, col });
    }

    if (rowWin) {
      winningRows.push(rowCells);
      winningCells.push(...rowCells);
    }
  }

  // Check columns
  const winningColumns: Array<{ row: number; col: number }>[] = [];
  for (let col = 0; col < size; col++) {
    let colWin = true;
    const colCells: Array<{ row: number; col: number }> = [];

    for (let row = 0; row < size; row++) {
      if (!isMarked(row, col)) {
        colWin = false;
        break;
      }
      colCells.push({ row, col });
    }

    if (colWin) {
      winningColumns.push(colCells);
      winningCells.push(...colCells);
    }
  }

  // Check diagonals
  const winningDiagonals: Array<{ row: number; col: number }>[] = [];

  // Diagonal 1: Top-left to bottom-right
  let diag1Win = true;
  const diag1Cells: Array<{ row: number; col: number }> = [];
  for (let i = 0; i < size; i++) {
    if (!isMarked(i, i)) {
      diag1Win = false;
      break;
    }
    diag1Cells.push({ row: i, col: i });
  }
  if (diag1Win) {
    winningDiagonals.push(diag1Cells);
    winningCells.push(...diag1Cells);
  }

  // Diagonal 2: Top-right to bottom-left
  let diag2Win = true;
  const diag2Cells: Array<{ row: number; col: number }> = [];
  for (let i = 0; i < size; i++) {
    if (!isMarked(i, size - 1 - i)) {
      diag2Win = false;
      break;
    }
    diag2Cells.push({ row: i, col: size - 1 - i });
  }
  if (diag2Win) {
    winningDiagonals.push(diag2Cells);
    winningCells.push(...diag2Cells);
  }

  // Check X pattern (both diagonals)
  const xPatternCells: Array<{ row: number; col: number }> = [];
  if (diag1Win && diag2Win) {
    xPatternCells.push(...diag1Cells, ...diag2Cells);
  }

  // Check outer square pattern
  const outerSquareCells: Array<{ row: number; col: number }> = [];
  let outerSquareWin = true;

  // Top row
  for (let col = 0; col < size; col++) {
    if (!isMarked(0, col)) {
      outerSquareWin = false;
      break;
    }
    outerSquareCells.push({ row: 0, col });
  }

  // Right column (excluding corners already counted)
  if (outerSquareWin) {
    for (let row = 1; row < size; row++) {
      if (!isMarked(row, size - 1)) {
        outerSquareWin = false;
        break;
      }
      outerSquareCells.push({ row, col: size - 1 });
    }
  }

  // Bottom row (excluding corners already counted)
  if (outerSquareWin) {
    for (let col = size - 2; col >= 0; col--) {
      if (!isMarked(size - 1, col)) {
        outerSquareWin = false;
        break;
      }
      outerSquareCells.push({ row: size - 1, col });
    }
  }

  // Left column (excluding corners already counted)
  if (outerSquareWin) {
    for (let row = size - 2; row > 0; row--) {
      if (!isMarked(row, 0)) {
        outerSquareWin = false;
        break;
      }
      outerSquareCells.push({ row, col: 0 });
    }
  }

  // Check inner square pattern (3x3 in the center)
  const innerSquareCells: Array<{ row: number; col: number }> = [];
  let innerSquareWin = true;

  for (let row = 1; row < 4; row++) {
    for (let col = 1; col < 4; col++) {
      if (!isMarked(row, col)) {
        innerSquareWin = false;
        break;
      }
      innerSquareCells.push({ row, col });
    }
    if (!innerSquareWin) break;
  }

  // Count total winning lines for multiple line patterns
  const totalWinningLines =
    winningRows.length + winningColumns.length + winningDiagonals.length;

  // Check specific patterns
  switch (pattern) {
    case "1line":
      return { isWinner: totalWinningLines >= 1, winningCells };
    case "2line":
      return { isWinner: totalWinningLines >= 2, winningCells };
    case "3line":
      return { isWinner: totalWinningLines >= 3, winningCells };
    case "diagonals":
      return {
        isWinner: winningDiagonals.length >= 1,
        winningCells: winningDiagonals.flat(),
      };
    case "x":
      return { isWinner: diag1Win && diag2Win, winningCells: xPatternCells };
    case "outerSquare":
      return { isWinner: outerSquareWin, winningCells: outerSquareCells };
    case "innerSquare":
      return { isWinner: innerSquareWin, winningCells: innerSquareCells };
    default:
      return { isWinner: totalWinningLines >= 1, winningCells };
  }
}
