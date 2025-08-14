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

  // Check all cells around the perimeter
  // Top row (row 0)
  for (let col = 0; col < size; col++) {
    if (!isMarked(0, col)) {
      outerSquareWin = false;
      break;
    }
    outerSquareCells.push({ row: 0, col });
  }

  // Right column (col 4) - excluding top and bottom corners already counted
  if (outerSquareWin) {
    for (let row = 1; row < size - 1; row++) {
      if (!isMarked(row, size - 1)) {
        outerSquareWin = false;
        break;
      }
      outerSquareCells.push({ row, col: size - 1 });
    }
  }

  // Bottom row (row 4) - excluding left and right corners already counted
  if (outerSquareWin) {
    for (let col = size - 2; col >= 0; col--) {
      if (!isMarked(size - 1, col)) {
        outerSquareWin = false;
        break;
      }
      outerSquareCells.push({ row: size - 1, col });
    }
  }

  // Left column (col 0) - excluding top and bottom corners already counted
  if (outerSquareWin) {
    for (let row = size - 2; row >= 1; row--) {
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

// Test function to verify all patterns work correctly
export function testAllPatterns() {
  console.log("🧪 Testing Bingo Pattern Recognition...\n");

  // Test bingo card
  const testCard: BingoCard = {
    id: 1,
    B: [1, 2, 3, 4, 5],
    I: [16, 17, 18, 19, 20],
    N: [31, 32, 0, 34, 35], // Free space at center (row 2, col 2)
    G: [46, 47, 48, 49, 50],
    O: [61, 62, 63, 64, 65],
  };

  // Test 1: Single line pattern
  console.log("1️⃣ Testing 1line pattern:");
  const calledNumbers1 = [1, 2, 3, 4, 5]; // Top row
  const result1 = checkWinningPattern(testCard, calledNumbers1, "1line");
  console.log(`   Top row called: ${result1.isWinner ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`   Winning cells: ${result1.winningCells.length}`);

  // Test 2: Two line pattern
  console.log("\n2️⃣ Testing 2line pattern:");
  const calledNumbers2 = [1, 2, 3, 4, 5, 16, 17, 18, 19, 20]; // Top two rows
  const result2 = checkWinningPattern(testCard, calledNumbers2, "2line");
  console.log(
    `   Two rows called: ${result2.isWinner ? "✅ PASS" : "❌ FAIL"}`
  );
  console.log(`   Winning cells: ${result2.winningCells.length}`);

  // Test 3: Diagonal pattern
  console.log("\n3️⃣ Testing diagonal pattern:");
  const calledNumbers3 = [1, 17, 0, 49, 65]; // Main diagonal
  const result3 = checkWinningPattern(testCard, calledNumbers3, "diagonals");
  console.log(`   Main diagonal: ${result3.isWinner ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`   Winning cells: ${result3.winningCells.length}`);

  // Test 4: X pattern
  console.log("\n4️⃣ Testing X pattern:");
  const calledNumbers4 = [1, 17, 0, 49, 65, 5, 19, 0, 47, 61]; // Both diagonals
  const result4 = checkWinningPattern(testCard, calledNumbers4, "x");
  console.log(`   X pattern: ${result4.isWinner ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`   Winning cells: ${result4.winningCells.length}`);

  // Test 5: Outer square pattern
  console.log("\n5️⃣ Testing outer square pattern:");
  const calledNumbers5 = [
    1,
    2,
    3,
    4,
    5, // Top row
    16,
    20, // Left and right of I column
    31,
    35, // Left and right of N column
    46,
    50, // Left and right of G column
    61,
    62,
    63,
    64,
    65, // Bottom row
  ];
  const result5 = checkWinningPattern(testCard, calledNumbers5, "outerSquare");
  console.log(`   Outer square: ${result5.isWinner ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`   Winning cells: ${result5.winningCells.length}`);
  if (result5.isWinner) {
    console.log(
      `   Expected: 16 cells (perimeter), Got: ${result5.winningCells.length}`
    );
    console.log("   Winning cells:", result5.winningCells);
  }

  // Test 6: Inner square pattern
  console.log("\n6️⃣ Testing inner square pattern:");
  const calledNumbers6 = [17, 18, 19, 32, 34, 47, 48, 49]; // 3x3 center (excluding free space)
  const result6 = checkWinningPattern(testCard, calledNumbers6, "innerSquare");
  console.log(`   Inner square: ${result6.isWinner ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`   Winning cells: ${result6.winningCells.length}`);

  // Test 7: Three line pattern
  console.log("\n7️⃣ Testing 3line pattern:");
  const calledNumbers7 = [1, 2, 3, 4, 5, 16, 17, 18, 19, 20, 31, 32, 0, 34, 35]; // Top three rows
  const result7 = checkWinningPattern(testCard, calledNumbers7, "3line");
  console.log(`   Three rows: ${result7.isWinner ? "✅ PASS" : "❌ FAIL"}`);
  console.log(`   Winning cells: ${result7.winningCells.length}`);

  console.log("\n🎯 Testing complete!");
}
