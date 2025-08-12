# Percentage-Based Wallet Top-Up System

## Overview

This system implements a percentage-based wallet top-up mechanism where the input amount represents the user's share, and the recipient's wallet increases based on their percentage share. **NEW: The system now supports negative amounts for reducing wallet balances using EXACT amounts.**

## How It Works

### Scenario 1: Admin → Agent

**Top-Up (Positive Amount)**:

- Admin inputs: 10 birr
- Agent has: 10% share
- Agent wallet increases by: 10 / (10/100) = 100 birr

**Reduction (Negative Amount)**:

- Admin inputs: -200 birr (negative)
- Agent wallet decreases by: **exactly 200 birr** (no percentage calculation)

### Scenario 2: Agent → Cashier

**Top-Up (Positive Amount)**:

- Agent inputs: 20 birr
- Cashier has: 5% share
- Cashier wallet increases by: 20 / (5/100) = 400 birr
- Agent wallet decreases by: 20 birr

**Reduction (Negative Amount)**:

- Agent inputs: -200 birr (negative)
- Cashier wallet decreases by: **exactly 200 birr**
- Agent wallet increases by: 200 × (5/100) = 10 birr (based on their percentage)

## Negative Top-Up Operations (Exact Amount System)

### When to Use Negative Amounts

1. **Correcting Overpayments**: If you accidentally topped up too much, use a negative amount to reduce the balance
2. **Adjusting Balances**: For accounting corrections or balance adjustments
3. **Refunding Amounts**: When you need to return money to the source wallet

### How Negative Amounts Work (NEW SYSTEM)

**For Admin → Agent Reductions**:

- **Input**: Enter a negative number (e.g., -200)
- **Result**: Agent wallet decreases by exactly 200 birr
- **No percentage calculation**: Simple, direct reduction

**For Agent → Cashier Reductions**:

- **Input**: Enter a negative number (e.g., -200)
- **Result**:
  - Cashier wallet decreases by exactly 200 birr
  - Agent wallet increases by 200 × (agentPercentage/100)
  - Money flows back to agent based on their percentage share

### Key Benefits of Exact Amount System

1. **No Manual Calculations**: Users don't need to calculate percentage-based reductions
2. **Predictable Results**: Enter -200, wallet decreases by exactly 200
3. **Intuitive Operation**: Negative amount = exact reduction, positive amount = percentage-based increase
4. **Fair Returns**: Agent gets back money based on their percentage share

### Safety Features

- **Validation**: The system prevents reducing wallets below zero
- **Balance Checks**: Ensures sufficient funds before reduction
- **Transaction Safety**: All operations are wrapped in database transactions
- **Clear Error Messages**: Shows current balance and required amount

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

### 1. Admin → Agent Top-up/Reduction

**Endpoint**: `POST /api/agents/[id]/topup`
**Access**: Admin only
**Logic**:

- **Top-ups**: Calculates agent wallet increase using `adminPercentage`
- **Reductions**: Reduces agent wallet by exact amount (no percentage calculation)
- Supports both positive (top-up) and negative (reduction) amounts
- Implements debt-first payment system for top-ups
- Returns calculation details and updated balances

### 2. Agent → Cashier Top-up/Reduction

**Endpoint**: `POST /api/cashiers/[id]/topup`
**Access**: Agent only (for their own cashiers)
**Logic**:

- **Top-ups**: Calculates cashier wallet increase using `agentPercentage`
- **Reductions**: Reduces cashier wallet by exact amount, returns money to agent based on percentage
- Supports both positive (top-up) and negative (reduction) amounts
- Validates agent has sufficient balance for positive amounts
- For negative amounts, returns money to agent wallet based on their percentage
- Implements debt-first payment system for top-ups

## UI Components

### Top-Up Modals

Both the Agent and Cashier top-up modals now support:

- **Positive amounts**: Add money to recipient wallet (percentage-based)
- **Negative amounts**: Reduce recipient wallet by exact amount
- **Dynamic titles**: "Top Up Wallet" vs "Reduce Wallet"
- **Visual feedback**: Button color changes based on operation type
- **Helpful text**: Explains percentage-based vs exact amount operations

### Input Validation

- **Zero amounts**: Prevented (no effect)
- **Positive amounts**: Add to wallet (percentage-based calculation)
- **Negative amounts**: Reduce from wallet (exact amount reduction)
- **Real-time feedback**: UI updates based on input value

## Examples

### Admin Reducing Agent Wallet

```
Input: -200
Result: Agent wallet decreases by exactly 200
No percentage calculation needed
```

### Agent Reducing Cashier Wallet

```
Input: -200
Cashier percentage: 5%
Result:
- Cashier wallet decreases by exactly 200
- Agent wallet increases by 200 × (5/100) = 10
```

### Agent Topping Up Cashier Wallet

```
Input: 20
Cashier percentage: 5%
Result: Cashier wallet increases by 20 / (5/100) = 400
```

## Error Handling

### Common Scenarios

1. **Insufficient Balance**: When reducing a wallet that doesn't have enough funds
2. **Auto-lock Enabled**: Prevents operations that would create debt
3. **Invalid Percentages**: Handles edge cases in percentage calculations
4. **Transaction Failures**: Rollback on database errors

### User Experience

- **Clear error messages**: Explain what went wrong and show current balances
- **Suggestions**: Provide guidance on how to fix issues
- **Debt information**: Show debt balances when relevant
- **Success feedback**: Confirm successful operations with details

## Best Practices

### When Using Negative Amounts

1. **Verify the amount**: Double-check before confirming reductions
2. **Check current balances**: Ensure the recipient has sufficient funds
3. **Document reasons**: Keep records of why reductions were made
4. **Test with small amounts**: Start with small reductions to verify behavior

### Understanding the System

1. **Top-ups (positive)**: Use percentage-based calculations
2. **Reductions (negative)**: Use exact amounts for predictable results
3. **Agent returns**: Based on their percentage share for cashier reductions
4. **Admin reductions**: Direct amount reduction, no percentage involved

### Security Considerations

1. **Role-based access**: Only authorized users can perform operations
2. **Audit trail**: All operations are logged for accountability
3. **Transaction safety**: Database operations are atomic
4. **Validation**: Input validation prevents invalid operations

This enhanced system provides flexibility for both adding and reducing wallet balances while maintaining the percentage-based calculation logic for top-ups and using exact amounts for reductions, ensuring clarity and ease of use.
