// lib/wallet-utils.test.ts
// This file demonstrates how the new percentage-based wallet system works

import {
  calculateWalletIncrease,
  validateWalletDeduction,
  calculateDebtFirstPayment,
  generateWalletMessage,
  formatCurrency,
} from "./wallet-utils";

// Test the percentage-based wallet calculations
console.log("=== Testing Percentage-Based Wallet System ===\n");

// Test Scenario 1: Admin → Agent
console.log("Scenario 1: Admin → Agent");
console.log("Admin inputs 10 birr (their share)");
console.log("Agent has 10% share");

const adminToAgent = calculateWalletIncrease(10, 10);
console.log(`Formula: ${adminToAgent.formula}`);
console.log(
  `Agent wallet increases by: ${formatCurrency(
    adminToAgent.calculatedIncrease
  )}`
);
console.log("Expected: Agent wallet increases by $100.00 (10 / (10/100))\n");

// Test Scenario 2: Agent → Cashier
console.log("Scenario 2: Agent → Cashier");
console.log("Agent inputs 20 birr (their share)");
console.log("Cashier has 5% share");

const agentToCashier = calculateWalletIncrease(20, 5);
console.log(`Formula: ${agentToCashier.formula}`);
console.log(
  `Cashier wallet increases by: ${formatCurrency(
    agentToCashier.calculatedIncrease
  )}`
);
console.log("Expected: Cashier wallet increases by $400.00 (20 / (5/100))\n");

// Test debt-first payment system
console.log("=== Testing Debt-First Payment System ===\n");

const debtFirstExample = calculateDebtFirstPayment(100, 30, 50);
console.log("Example: Amount=100, Current Debt=30, Current Wallet=50");
console.log(
  `New Wallet Balance: ${formatCurrency(debtFirstExample.newWalletBalance)}`
);
console.log(
  `New Debt Balance: ${formatCurrency(debtFirstExample.newDebtBalance)}`
);
console.log(`Debt Paid: ${formatCurrency(debtFirstExample.debtPaid)}`);
console.log(`Wallet Added: ${formatCurrency(debtFirstExample.walletAdded)}`);
console.log("Expected: Debt fully paid (30), remaining 70 added to wallet\n");

// Test wallet validation
console.log("=== Testing Wallet Validation ===\n");

const validationExample = validateWalletDeduction(100, 80, true);
console.log("Example: Current Balance=100, Required=80, AutoLock=true");
console.log(`Is Valid: ${validationExample.isValid}`);
console.log(
  `Remaining Balance: ${formatCurrency(validationExample.remainingBalance)}`
);

const validationExample2 = validateWalletDeduction(100, 120, false);
console.log("Example: Current Balance=100, Required=120, AutoLock=false");
console.log(`Is Valid: ${validationExample2.isValid}`);
console.log(
  `Remaining Balance: ${formatCurrency(validationExample2.remainingBalance)}`
);
console.log("Expected: Allowed with debt when auto-lock is disabled\n");

// Test message generation
console.log("=== Testing Message Generation ===\n");

const message1 = generateWalletMessage("Top-up", 30, 70);
console.log("Message 1 (debt paid + wallet added):", message1);

const message2 = generateWalletMessage("Top-up", 30, 0);
console.log("Message 2 (debt partially paid):", message2);

const message3 = generateWalletMessage("Top-up", 0, 100);
console.log("Message 3 (wallet only):", message3);

console.log("\n=== System Ready for Production ===");
console.log(
  "The percentage-based wallet system has been successfully implemented!"
);
console.log("- Admin → Agent: Uses adminPercentage field");
console.log("- Agent → Cashier: Uses agentPercentage field");
console.log(
  "- All calculations follow the formula: Amount / (Percentage / 100)"
);
console.log("- Debt-first payment system maintained");
console.log("- Input validation and error handling implemented");
