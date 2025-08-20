"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { BingoPattern } from "@/types/types";

interface BingoPatternVisualizerProps {
  pattern: BingoPattern;
}

const cols = ["B", "I", "N", "G", "O"];

type HighlightGrid = boolean[][];

const emptyGrid = (): HighlightGrid =>
  Array(5)
    .fill(null)
    .map(() => Array(5).fill(false));

const generatePatterns = (
  pattern: BingoPatternVisualizerProps["pattern"]
): HighlightGrid[] => {
  const results: HighlightGrid[] = [];

  const addOuterCorners = (grid: HighlightGrid) => {
    grid[0][0] = true;
    grid[0][4] = true;
    grid[4][0] = true;
    grid[4][4] = true;
  };

  const addInnerCorners = (grid: HighlightGrid) => {
    grid[1][1] = true;
    grid[1][3] = true;
    grid[3][1] = true;
    grid[3][3] = true;
  };

  const applyPattern = (grid: HighlightGrid, patternName: string) => {
    switch (patternName) {
      case "horizontal":
        // Apply first horizontal line (row 0)
        for (let c = 0; c < 5; c++) grid[0][c] = true;
        break;
      case "vertical":
        // Apply first vertical line (column 0)
        for (let r = 0; r < 5; r++) grid[r][0] = true;
        break;
      case "diagonal":
        // Apply one diagonal (top-left to bottom-right)
        for (let i = 0; i < 5; i++) grid[i][i] = true;
        break;
      case "innerSquare":
        addInnerCorners(grid);
        break;
      case "outerSquare":
        addOuterCorners(grid);
        break;
      case "x":
        // Apply X pattern (both diagonals)
        for (let i = 0; i < 5; i++) {
          grid[i][i] = true;
          grid[i][4 - i] = true;
        }
        break;
      default:
        break;
    }
  };

  switch (pattern) {
    case "1line":
    case "AnyLineOrLarge4Corner":
    case "AnyLineOrSmall4Corner":
      // Show all 6 specific pattern types for 1line
      if (pattern === "1line") {
        // Horizontal lines
        for (let r = 0; r < 5; r++) {
          const grid = emptyGrid();
          for (let c = 0; c < 5; c++) grid[r][c] = true;
          results.push(grid);
        }

        // Vertical lines
        for (let c = 0; c < 5; c++) {
          const grid = emptyGrid();
          for (let r = 0; r < 5; r++) grid[r][c] = true;
          results.push(grid);
        }

        // Diagonals
        const diag1 = emptyGrid();
        for (let i = 0; i < 5; i++) diag1[i][i] = true;
        results.push(diag1);

        const diag2 = emptyGrid();
        for (let i = 0; i < 5; i++) diag2[i][4 - i] = true;
        results.push(diag2);

        // Inner square
        const innerSquare = emptyGrid();
        addInnerCorners(innerSquare);
        results.push(innerSquare);

        // Outer square
        const outerSquare = emptyGrid();
        addOuterCorners(outerSquare);
        results.push(outerSquare);

        // X pattern
        const xPattern = emptyGrid();
        for (let i = 0; i < 5; i++) {
          xPattern[i][i] = true;
          xPattern[i][4 - i] = true;
        }
        results.push(xPattern);
      } else {
        // Original logic for other patterns
        // Rows
        for (let r = 0; r < 5; r++) {
          const grid = emptyGrid();
          for (let c = 0; c < 5; c++) grid[r][c] = true;
          if (pattern === "AnyLineOrLarge4Corner") addOuterCorners(grid);
          if (pattern === "AnyLineOrSmall4Corner") addInnerCorners(grid);
          results.push(grid);
        }
        // Columns
        for (let c = 0; c < 5; c++) {
          const grid = emptyGrid();
          for (let r = 0; r < 5; r++) grid[r][c] = true;
          if (pattern === "AnyLineOrLarge4Corner") addOuterCorners(grid);
          if (pattern === "AnyLineOrSmall4Corner") addInnerCorners(grid);
          results.push(grid);
        }
        // Diagonals
        const diag1 = emptyGrid();
        for (let i = 0; i < 5; i++) diag1[i][i] = true;
        if (pattern === "AnyLineOrLarge4Corner") addOuterCorners(diag1);
        if (pattern === "AnyLineOrSmall4Corner") addInnerCorners(diag1);
        results.push(diag1);

        const diag2 = emptyGrid();
        for (let i = 0; i < 5; i++) diag2[i][4 - i] = true;
        if (pattern === "AnyLineOrLarge4Corner") addOuterCorners(diag2);
        if (pattern === "AnyLineOrSmall4Corner") addInnerCorners(diag2);
        results.push(diag2);
      }
      break;

    case "2line":
      // Generate multiple combinations of 2 patterns from the 6 specific patterns
      const patterns2 = [
        "horizontal",
        "vertical",
        "diagonal",
        "innerSquare",
        "outerSquare",
        "x",
      ];

      // Show a few key combinations
      const keyCombinations2 = [
        ["horizontal", "vertical"],
        ["horizontal", "diagonal"],
        ["horizontal", "outerSquare"],
        ["vertical", "diagonal"],
        ["diagonal", "outerSquare"],
        ["innerSquare", "outerSquare"],
      ];

      for (const combo of keyCombinations2) {
        const grid = emptyGrid();
        applyPattern(grid, combo[0]);
        applyPattern(grid, combo[1]);
        results.push(grid);
      }
      break;

    case "3line":
      // Generate multiple combinations of 3 patterns from the 6 specific patterns
      const patterns3 = [
        "horizontal",
        "vertical",
        "diagonal",
        "innerSquare",
        "outerSquare",
        "x",
      ];

      // Show a few key combinations
      const keyCombinations3 = [
        ["horizontal", "vertical", "diagonal"],
        ["horizontal", "diagonal", "outerSquare"],
        ["vertical", "diagonal", "innerSquare"],
        ["horizontal", "vertical", "outerSquare"],
        ["diagonal", "innerSquare", "outerSquare"],
      ];

      for (const combo of keyCombinations3) {
        const grid = emptyGrid();
        applyPattern(grid, combo[0]);
        applyPattern(grid, combo[1]);
        applyPattern(grid, combo[2]);
        results.push(grid);
      }
      break;

    case "Large4Corner": {
      const grid = emptyGrid();
      addOuterCorners(grid);
      results.push(grid);
      break;
    }

    case "Small4Corner": {
      const grid = emptyGrid();
      addInnerCorners(grid);
      results.push(grid);
      break;
    }

    case "L": {
      const leftL = emptyGrid();
      for (let r = 0; r < 5; r++) leftL[r][0] = true;
      for (let c = 0; c < 5; c++) leftL[4][c] = true;
      results.push(leftL);

      const rightL = emptyGrid();
      for (let r = 0; r < 5; r++) rightL[r][4] = true;
      for (let c = 0; c < 5; c++) rightL[4][c] = true;
      results.push(rightL);
      break;
    }

    case "X": {
      const grid = emptyGrid();
      for (let i = 0; i < 5; i++) {
        grid[i][i] = true;
        grid[i][4 - i] = true;
      }
      results.push(grid);
      break;
    }

    case "T": {
      const grid = emptyGrid();
      for (let c = 0; c < 5; c++) grid[0][c] = true;
      for (let r = 0; r < 5; r++) grid[r][2] = true;
      results.push(grid);
      break;
    }

    default:
      break;
  }

  return results;
};

export const BingoPatternVisualizer = ({
  pattern,
}: BingoPatternVisualizerProps) => {
  const patternGrids = generatePatterns(pattern);

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((i) => (i + 1) % patternGrids.length);
    }, 1500); // change slide every 1.5 seconds
    return () => clearInterval(timer);
  }, [patternGrids.length]);

  const highlightGrid = patternGrids[currentIndex];

  const headerColors = [
    "bg-blue-500 text-white",
    "bg-red-500 text-white",
    "bg-green-500 text-white",
    "bg-yellow-600 text-white",
    "bg-purple-500 text-white",
  ];

  return (
    <div className="grid grid-cols-5 gap-1 mb-1 text-center font-bold w-fit">
      {cols.map((letter, i) => (
        <div key={letter} className={cn("p-1 rounded", headerColors[i])}>
          {letter}
        </div>
      ))}

      {Array.from({ length: 5 }).map((_, rowIndex) =>
        cols.map((letter, colIndex) => {
          const isHighlighted = highlightGrid[rowIndex][colIndex];
          return (
            <div
              key={`${letter}-${rowIndex}`}
              className={cn(
                "border p-1 border-gray-700 font-normal w-10 h-8 flex items-center justify-center",
                isHighlighted ? "bg-cyan-600 text-white animate-pulse" : ""
              )}
            >
              &nbsp;
            </div>
          );
        })
      )}
    </div>
  );
};
