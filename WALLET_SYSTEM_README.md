# Percentage-Based Wallet Top-Up System

## Overview

This system implements a percentage-based wallet top-up mechanism where the input amount represents the user's share, and the recipient's wallet increases based on their percentage share.

## How It Works

### Scenario 1: Admin → Agent

**Input**: Admin enters a "top-up amount" (their share)
**Calculation**: Agent wallet increases based on their `adminPercentage` field
**Formula**: `Agent Wallet Increase = Topup Amount / (Admin Percentage / 100)`

**Example**:

- Admin inputs: 10 birr
- Agent has: 10% share
- Agent wallet increases by: 10 / (10/100) = 100 birr

### Scenario 2: Agent → Cashier

**Input**: Agent enters a "top-up amount" (their share)
**Calculation**: Cashier wallet increases based on their `agentPercentage` field
**Formula**: `Cashier Wallet Increase = Topup Amount / (Agent Percentage / 100)`
**Deduction**: Agent wallet decreases by the entered amount

**Example**:

- Agent inputs: 20 birr
- Cashier has: 5% share
- Cashier wallet increases by: 20 / (5/100) = 400 birr
- Agent wallet decreases by: 20 birr

## Database Schema

The system uses these percentage fields from the Prisma schema:

```prisma
model Agent {
  adminPercentage Float @default(20)  // Admin's share percentage
  // ... other fields
}

model Cashier {
  agentPercentage Float @default(0)   // Agent's share percentage
  // ... other fields
}
```

## API Endpoints

### 1. Admin → Agent Top-up

**Endpoint**: `POST /api/agents/[id]/topup`
**Access**: Admin only
**Logic**:

- Calculates agent wallet increase using `adminPercentage`
- Implements debt-first payment system
- Returns calculation details and updated balances

### 2. Agent → Cashier Top-up

**Endpoint**: `POST /api/cashiers/[id]/topup`
**Access**: Agent only (for their own cashiers)
**Logic**:

- Calculates cashier wallet increase using `agentPercentage`
- Validates agent has sufficient balance
- Deducts from agent wallet
- Implements debt-first payment system for cashier

## Utility Functions

### `calculateWalletIncrease(inputAmount, percentage)`

Calculates the wallet increase based on percentage share.

### `validateWalletDeduction(currentBalance, requiredAmount, autoLock)`

Validates if a wallet has sufficient balance for deduction.

### `calculateDebtFirstPayment(amount, currentDebt, currentWallet)`

Implements debt-first payment logic (pays debt before adding to wallet).

### `generateWalletMessage(operation, debtPaid, walletAdded)`

Generates informative messages about wallet operations.

## Key Features

1. **Percentage-Based Calculations**: All top-ups use percentage fields from the database
2. **Debt-First Payment**: Prioritizes paying off debt before adding to wallet balance
3. **Input Validation**: Validates percentages and amounts
4. **Auto-Lock Support**: Respects auto-lock settings for insufficient funds
5. **Transaction Safety**: Uses database transactions for data consistency
6. **Detailed Responses**: Returns calculation details and formulas
7. **Error Handling**: Comprehensive error handling with specific error messages

## Example API Response

```json
{
  "message": "Top-up successful: Debt fully paid off ($30.00) and wallet topped up with remaining amount ($70.00)",
  "agent": {
    /* updated agent data */
  },
  "debtPaid": 30,
  "walletAdded": 70,
  "calculationDetails": {
    "adminInput": 10,
    "adminPercentage": 10,
    "agentWalletIncrease": 100,
    "formula": "Wallet Increase = 10 / (10 / 100) = 100.00"
  }
}
```

## Testing

Run the test file to see examples:

```bash
npx tsx lib/wallet-utils.test.ts
```

## Migration Notes

- **Existing Data**: The system will work with existing percentage values in the database
- **Default Values**:
  - `adminPercentage` defaults to 20%
  - `agentPercentage` defaults to 0%
- **Backward Compatibility**: Existing top-up functionality is enhanced, not replaced

## Security Features

- Role-based access control (Admin → Agent, Agent → Cashier)
- Input validation and sanitization
- Database transaction safety
- JWT token verification

## Error Handling

The system handles various error scenarios:

- Invalid percentages (≤ 0 or > 100)
- Insufficient wallet balances
- Invalid input amounts
- Unauthorized access
- Database errors

## Future Enhancements

Potential improvements could include:

- Percentage validation rules
- Audit logging for all wallet operations
- Batch top-up operations
- Percentage change history tracking
- Automated percentage calculations based on business rules
