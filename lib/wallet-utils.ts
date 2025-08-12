// lib/wallet-utils.ts

export interface WalletCalculationResult {
  inputAmount: number;
  percentage: number;
  calculatedIncrease: number;
  formula: string;
}

export interface WalletValidationResult {
  isValid: boolean;
  error?: string;
  currentBalance: number;
  requiredAmount: number;
  remainingBalance: number;
}

/**
 * Calculate wallet increase based on percentage share
 * Formula: Wallet Increase = Input Amount / (Percentage / 100)
 * For reductions, returns the exact amount to be reduced
 *
 * @param inputAmount - The amount input by the user (their share), can be negative
 * @param percentage - The percentage share of the recipient
 * @returns WalletCalculationResult with calculation details
 */
export function calculateWalletIncrease(
  inputAmount: number,
  percentage: number
): WalletCalculationResult {
  if (percentage <= 0 || percentage > 100) {
    throw new Error("Invalid percentage. Must be between 0 and 100.");
  }

  if (inputAmount < 0) {
    // For reductions, return the exact amount to be reduced
    return {
      inputAmount,
      percentage,
      calculatedIncrease: Math.abs(inputAmount), // Exact amount to reduce
      formula: `Wallet Reduction = Exact Amount: ${Math.abs(
        inputAmount
      ).toFixed(2)}`,
    };
  }

  // For top-ups, use percentage-based calculation
  const calculatedIncrease = inputAmount / (percentage / 100);

  return {
    inputAmount,
    percentage,
    calculatedIncrease,
    formula: `Wallet Increase = ${inputAmount} / (${percentage} / 100) = ${calculatedIncrease.toFixed(
      2
    )}`,
  };
}

/**
 * Validate if a wallet has sufficient balance for a deduction
 * Supports negative amounts for reducing wallet balances
 *
 * @param currentBalance - Current wallet balance
 * @param requiredAmount - Amount to be deducted (can be negative for additions)
 * @param autoLock - Whether auto-lock is enabled
 * @returns WalletValidationResult with validation details
 */
export function validateWalletDeduction(
  currentBalance: number,
  requiredAmount: number,
  autoLock: boolean = true
): WalletValidationResult {
  const remainingBalance = currentBalance - requiredAmount;

  if (requiredAmount === 0) {
    return {
      isValid: false,
      error: "Invalid amount. Cannot be zero.",
      currentBalance,
      requiredAmount,
      remainingBalance,
    };
  }

  // For negative amounts (reducing wallet), we're actually adding to the source wallet
  if (requiredAmount < 0) {
    return {
      isValid: true,
      currentBalance,
      requiredAmount,
      remainingBalance,
    };
  }

  if (currentBalance < requiredAmount) {
    if (autoLock) {
      return {
        isValid: false,
        error: "Insufficient wallet balance. Auto-lock is enabled.",
        currentBalance,
        requiredAmount,
        remainingBalance,
      };
    } else {
      // Auto-lock is disabled, allow deduction but will result in debt
      return {
        isValid: true,
        currentBalance,
        requiredAmount,
        remainingBalance,
      };
    }
  }

  return {
    isValid: true,
    currentBalance,
    requiredAmount,
    remainingBalance,
  };
}

/**
 * Calculate debt-first payment allocation
 * Prioritizes paying off debt before adding to wallet balance
 * For reductions, handles exact amount reductions
 *
 * @param amount - Total amount available (can be negative for reductions)
 * @param currentDebt - Current debt balance
 * @param currentWallet - Current wallet balance
 * @returns Object with new wallet and debt balances
 */
export function calculateDebtFirstPayment(
  amount: number,
  currentDebt: number,
  currentWallet: number
) {
  let remainingAmount = amount;
  let newWalletBalance = currentWallet;
  let newDebtBalance = currentDebt;

  // Handle negative amounts (wallet reduction)
  if (amount < 0) {
    const reductionAmount = Math.abs(amount);

    // When reducing wallet, prioritize reducing wallet balance first
    if (currentWallet >= reductionAmount) {
      // Can fully reduce from wallet
      newWalletBalance = currentWallet - reductionAmount;
      return {
        newWalletBalance,
        newDebtBalance,
        debtPaid: 0,
        walletAdded: -reductionAmount, // Negative to indicate reduction
      };
    } else {
      // Cannot fully reduce from wallet, will need to increase debt
      const walletReduction = currentWallet;
      const remainingReduction = reductionAmount - currentWallet;
      newWalletBalance = 0;
      newDebtBalance = currentDebt + remainingReduction;

      return {
        newWalletBalance,
        newDebtBalance,
        debtPaid: 0,
        walletAdded: -walletReduction, // Negative to indicate reduction
      };
    }
  }

  // Handle positive amounts (wallet increase) - existing logic
  // If there's debt, pay it off first
  if (currentDebt > 0) {
    if (remainingAmount >= currentDebt) {
      // Can fully pay off debt
      remainingAmount -= currentDebt;
      newDebtBalance = 0;
      newWalletBalance += remainingAmount;
    } else {
      // Can only partially pay off debt
      newDebtBalance -= remainingAmount;
      remainingAmount = 0;
    }
  } else {
    // No debt, add all to wallet
    newWalletBalance += remainingAmount;
  }

  return {
    newWalletBalance,
    newDebtBalance,
    debtPaid: Math.min(amount, currentDebt),
    walletAdded: Math.max(0, amount - currentDebt),
  };
}

/**
 * Format currency amount with proper decimal places
 *
 * @param amount - Amount to format
 * @param currency - Currency symbol (default: $)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency: string = "$"): string {
  return `${currency}${amount.toFixed(2)}`;
}

/**
 * Generate informative message for wallet operations
 * Supports both positive and negative operations
 *
 * @param operation - Type of operation (e.g., "topup", "deduction")
 * @param debtPaid - Amount of debt paid
 * @param walletAdded - Amount added to wallet (can be negative for reductions)
 * @returns Informative message string
 */
export function generateWalletMessage(
  operation: string,
  debtPaid: number,
  walletAdded: number
): string {
  if (walletAdded < 0) {
    // Wallet reduction operation
    if (debtPaid > 0) {
      return `${operation} successful: Debt paid off (${formatCurrency(
        debtPaid
      )}) and wallet reduced by ${formatCurrency(Math.abs(walletAdded))}`;
    } else {
      return `${operation} successful: Wallet reduced by ${formatCurrency(
        Math.abs(walletAdded)
      )}`;
    }
  } else if (debtPaid > 0 && walletAdded > 0) {
    return `${operation} successful: Debt fully paid off (${formatCurrency(
      debtPaid
    )}) and wallet topped up with remaining amount (${formatCurrency(
      walletAdded
    )})`;
  } else if (debtPaid > 0 && walletAdded === 0) {
    return `${operation} successful: Debt partially paid off (${formatCurrency(
      debtPaid
    )})`;
  } else if (debtPaid === 0 && walletAdded > 0) {
    return `${operation} successful: Wallet topped up with ${formatCurrency(
      walletAdded
    )}`;
  } else {
    return `${operation} completed`;
  }
}
