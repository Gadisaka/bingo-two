# Bingo Game Patterns Documentation

## Overview

This document describes all the bingo patterns available in the game, their winning requirements, and how they are implemented.

## Pattern Categories

### 1. Single Line Patterns

#### **1line** ✅

- **Requirement**: Complete 1 or more patterns from the specific pattern set
- **Pattern Set**:
  - Horizontal line (any row)
  - Vertical line (any column)
  - Diagonal (either diagonal)
  - Inner square (4 corners of 3x3 center area)
  - Outer square (4 corners)
  - X pattern (both diagonals)
- **Behavior**: Player wins when they complete 1 or more of these patterns
- **Examples**:
  - 1 complete row ✅
  - 1 complete column ✅
  - 1 complete diagonal ✅
  - Outer square only ✅
  - Inner square only ✅
  - X pattern only ✅
  - Any combination of the above ✅
- **Implementation**: Counts completed patterns from the specific set, requires 1 or more

---

### 2. Multi-Line Patterns (Restrictive)

#### **2line** 🔒 NEW

- **Requirement**: Complete 2 or more patterns from the specific pattern set
- **Pattern Set**:
  - Horizontal line (any row)
  - Vertical line (any column)
  - Diagonal (either diagonal)
  - Inner square (4 corners of 3x3 center area)
  - Outer square (4 corners)
  - X pattern (both diagonals)
- **Behavior**: Player must complete 2 or more of these patterns
- **Examples**:
  - 1 row + 1 diagonal ✅
  - 1 row + 1 column ✅
  - 1 diagonal + outer square ✅
  - 3 rows ✅ (2+ patterns)
  - 4 patterns ✅ (2+ patterns)
  - Only 1 pattern ❌ (too few patterns)
- **Implementation**: Counts completed patterns from the specific set, requires 2 or more

#### **3line** 🔒 NEW

- **Requirement**: Complete 3 or more patterns from the specific pattern set
- **Pattern Set**: Same as 2line
- **Behavior**: Player must complete 3 or more of these patterns
- **Examples**:
  - 1 row + 1 diagonal + outer square ✅
  - 1 row + 1 column + inner square ✅
  - 4 patterns ✅ (3+ patterns)
  - 5 patterns ✅ (3+ patterns)
  - Only 2 patterns ❌ (too few patterns)
- **Implementation**: Counts completed patterns from the specific set, requires 3 or more

---

### 3. Specific Pattern Types

#### **diagonals**

- **Requirement**: Complete any diagonal line
- **Behavior**: Player wins when they complete either diagonal (top-left to bottom-right OR top-right to bottom-left)
- **Implementation**: `winningDiagonals.length >= 1`

#### **x**

- **Requirement**: Complete both diagonals simultaneously
- **Behavior**: Player must complete both diagonals to form an X pattern
- **Implementation**: `diag1Win && diag2Win`

#### **outerSquare**

- **Requirement**: Complete the 4 corner cells only
- **Behavior**: Player must mark all 4 corner cells (positions: [0,0], [0,4], [4,0], [4,4])
- **Implementation**: Checks only the 4 corner positions

#### **innerSquare**

- **Requirement**: Complete the 4 corner cells of the 3x3 center area
- **Behavior**: Player must mark the 4 inner corner cells (positions: [1,1], [1,3], [3,1], [3,3])
- **Implementation**: Checks only the 4 inner corner positions

---

### 4. Legacy Patterns (Currently Disabled)

#### **Large4Corner**

- **Status**: Disabled in game setup
- **Requirement**: Complete 4 corners (same as outerSquare)

#### **Small4Corner**

- **Status**: Disabled in game setup
- **Requirement**: Complete 4 inner corners (same as innerSquare)

#### **L**

- **Status**: Disabled in game setup
- **Requirement**: Complete an L-shaped pattern

#### **T**

- **Status**: Disabled in game setup
- **Requirement**: Complete a T-shaped pattern

---

## Key Changes Made

### Before (Old System)

- **1line**: Any 1 winning line (rows, columns, or diagonals only)
- **2line**: Any 2 winning lines (could be 2 rows, 1 row + 1 column, etc.)
- **3line**: Any 3 winning lines (any combination)

### After (New System)

- **1line**: 1 or more patterns from the 6 specific pattern types (including squares and X pattern)
- **2line**: 2 or more patterns from the 6 specific pattern types
- **3line**: 3 or more patterns from the 6 specific pattern types

## Pattern Recognition Logic

### Pattern Counting System

The game now uses a `checkSpecificPattern()` function that identifies completed patterns:

```typescript
const checkSpecificPattern = (patternType: string): boolean => {
  switch (patternType) {
    case "horizontal":
      return winningRows.length >= 1;
    case "vertical":
      return winningColumns.length >= 1;
    case "diagonal":
      return winningDiagonals.length >= 1;
    case "innerSquare":
      return innerSquareWin;
    case "outerSquare":
      return outerSquareWin;
    case "x":
      return diag1Win && diag2Win;
    default:
      return false;
  }
};
```

### Winning Logic

- **1line**: `completedPatterns >= 1` (1 or more patterns)
- **2line**: `completedPatterns >= 2` (2 or more patterns)
- **3line**: `completedPatterns >= 3` (3 or more patterns)
- **Other patterns**: Individual pattern completion checks

## Visual Pattern Generation

### ShowPattern.tsx Updates

- **2line**: Shows combinations of 2 patterns (e.g., horizontal+vertical, diagonal+outerSquare)
- **3line**: Shows combinations of 3 patterns (e.g., horizontal+vertical+diagonal)
- **Pattern Application**: Uses `applyPattern()` function to consistently apply patterns

### Pattern Combinations Displayed

- **2line**: 6 key combinations showing different pattern pairs
- **3line**: 5 key combinations showing different pattern triplets

## Testing

### Test Coverage

- ✅ 2line with exactly 2 patterns
- ✅ 2line with 3 patterns (should fail)
- ✅ 3line with exactly 3 patterns
- ✅ 3line with 4 patterns (should fail)
- ✅ 1line still works as before
- ✅ Specific pattern combinations

### Test Files

- `simple-test.js` - Node.js test runner
- `test-patterns-browser.js` - Browser-compatible test
- `lib/bingoUtils.ts` - Core pattern logic with tests

## Usage Examples

### Game Setup

```typescript
// In GameSetUp.tsx
const GAME_PATTERNS = [
  "1line", // Any 1 line
  "2line", // Exactly 2 specific patterns
  "3line", // Exactly 3 specific patterns
  "diagonals", // Any diagonal
  "outerSquare", // 4 corners only
  "innerSquare", // 4 inner corners only
  "x", // Both diagonals
];
```

### Pattern Selection

Players can select patterns using the game setup interface, which cycles through available options.

## Benefits of New System

1. **More Strategic**: Players must plan for specific pattern combinations
2. **Balanced Gameplay**: Prevents easy wins with simple line combinations
3. **Clear Requirements**: Specific pattern requirements instead of flexible line counting
4. **Visual Feedback**: Pattern visualizer shows all valid pattern types
5. **Consistent Logic**: All patterns use the same recognition system
6. **Inclusive 1line**: 1line now includes all 6 pattern types, not just lines

## Technical Implementation

### Files Modified

- `components/game/ShowPattern.tsx` - Pattern visualization (now shows all 6 patterns for 1line)
- `lib/bingoUtils.ts` - Winning pattern logic (uses pattern counting system)
- `types/types.ts` - Pattern type definitions

### Core Functions

- `checkWinningPattern()` - Main pattern checking logic
- `checkSpecificPattern()` - Individual pattern validation
- `generatePatterns()` - Visual pattern generation (includes all 6 patterns for 1line)
- `applyPattern()` - Pattern application to grid

## Future Enhancements

### Potential Additions

- **4line pattern**: 4 or more specific patterns
- **Custom pattern builder**: Allow players to create custom patterns
- **Pattern difficulty ratings**: Assign difficulty scores to patterns
- **Pattern statistics**: Track which patterns are most/least common

### Pattern Variations

- **Mixed patterns**: Combine different pattern types
- **Sequential patterns**: Require patterns in specific order
- **Conditional patterns**: Patterns that depend on other conditions

---

## Summary

The new bingo pattern system provides a more strategic and balanced gameplay experience by:

1. **Expanding 1line** to include all 6 pattern types (not just lines)
2. **Restricting 2line and 3line** to require 2+ and 3+ specific patterns respectively
3. **Maintaining backward compatibility** for other patterns
4. **Providing clear visual feedback** for all pattern types
5. **Implementing consistent logic** across all pattern types
6. **Enabling future extensibility** for new pattern types

This system ensures that players must think strategically about which patterns to pursue and provides a more inclusive experience for 1line players while maintaining challenge for 2line and 3line players.
