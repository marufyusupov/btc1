# BTC1USD Collateral Mathematics - Complete Guide

## Table of Contents
1. [Basic Concepts](#basic-concepts)
2. [Collateral Ratio Formula](#collateral-ratio-formula)
3. [Minting Mathematics](#minting-mathematics)
4. [Redemption Mathematics](#redemption-mathematics)
5. [Over-Peg Management](#over-peg-management)
6. [Real Examples](#real-examples)
7. [Edge Cases](#edge-cases)

---

## Basic Concepts

### What is Collateral?
**Collateral** = Bitcoin (in the form of WBTC, cbBTC, or tBTC) locked in the vault to back BTC1USD tokens.

### What is Over-Collateralization?
**Over-collateralization** means the vault holds MORE Bitcoin value than the dollar value of BTC1USD tokens issued.

**Example:**
- Vault holds: $110 worth of Bitcoin
- BTC1USD tokens issued: 100 tokens (each worth $1)
- Collateral Ratio = $110 ÷ $100 = 1.10 (110%)

---

## Collateral Ratio Formula

### The Core Formula
\`\`\`
R = Total Collateral USD Value ÷ Total BTC1USD Supply
\`\`\`

**Where:**
- **R** = Collateral Ratio
- **Total Collateral USD Value** = Sum of all Bitcoin in vault × BTC price
- **Total BTC1USD Supply** = Number of BTC1USD tokens in circulation

### Step-by-Step Calculation

**Step 1: Calculate Total Collateral Value**
\`\`\`
Collateral Value = (WBTC Amount × BTC Price) + (cbBTC Amount × BTC Price) + (tBTC Amount × BTC Price)
\`\`\`

**Step 2: Get Total Token Supply**
\`\`\`
Token Supply = Total BTC1USD tokens in circulation
\`\`\`

**Step 3: Calculate Ratio**
\`\`\`
R = Collateral Value ÷ Token Supply
\`\`\`

### Example Calculation
**Given:**
- Vault holds: 2.5 WBTC + 1.0 cbBTC + 0.5 tBTC = 4.0 total BTC
- BTC Price: $50,000
- BTC1USD tokens in circulation: 180,000

**Calculation:**
\`\`\`
Collateral Value = 4.0 BTC × $50,000 = $200,000
Token Supply = 180,000 BTC1USD
R = $200,000 ÷ 180,000 = 1.111 (111.1%)
\`\`\`

---

## Minting Mathematics

### Minting Price Formula
\`\`\`
Mint Price = max(1.10, R_current) USD worth of BTC per BTC1USD
\`\`\`

**This means:**
- If R ≥ 1.10: You pay R × $1 worth of BTC for each BTC1USD
- If R < 1.10: You pay $1.10 worth of BTC for each BTC1USD (minimum safety)

### Fee Structure
**Total Cost = Base Cost + Dev Fee + Endowment Fee**

\`\`\`
Base Cost = Tokens Requested × Mint Price
Dev Fee = Tokens Requested × 1% (paid in tokens)
Endowment Fee = Tokens Requested × 0.1% (paid in tokens)
\`\`\`

### Minting Example

**Scenario:** User wants 1,000 BTC1USD tokens
- Current R = 1.15
- BTC Price = $50,000

**Step 1: Calculate mint price**
\`\`\`
Mint Price = max(1.10, 1.15) = 1.15 USD worth of BTC
\`\`\`

**Step 2: Calculate BTC needed**
\`\`\`
BTC Needed = (1,000 tokens × 1.15 × $1) ÷ $50,000 = 0.023 BTC
\`\`\`

**Step 3: Calculate fees**
\`\`\`
Dev Fee = 1,000 × 1% = 10 BTC1USD tokens
Endowment Fee = 1,000 × 0.1% = 1 BTC1USD token
Total Tokens Minted = 1,000 + 10 + 1 = 1,011 tokens
\`\`\`

**Step 4: Final transaction**
- User deposits: 0.023 BTC
- User receives: 1,000 BTC1USD
- Dev wallet receives: 10 BTC1USD
- Endowment receives: 1 BTC1USD

---

## Redemption Mathematics

### Healthy Mode (R ≥ 1.10)
\`\`\`
BTC Received = (Tokens Redeemed × $1 × 0.999) ÷ BTC Price
\`\`\`
*Note: 0.999 accounts for 0.1% dev fee*

### Stress Mode (R < 1.10)
\`\`\`
BTC Received = (Tokens Redeemed × 0.90 × R × $1 × 0.999) ÷ BTC Price
\`\`\`

### Redemption Examples

**Example 1: Healthy Mode**
- User redeems: 500 BTC1USD
- Current R = 1.20 (healthy)
- BTC Price = $50,000

\`\`\`
BTC Received = (500 × $1 × 0.999) ÷ $50,000 = 0.009995 BTC
USD Value = 0.009995 × $50,000 = $499.75
\`\`\`

**Example 2: Stress Mode**
- User redeems: 500 BTC1USD
- Current R = 1.05 (stress)
- BTC Price = $50,000

\`\`\`
BTC Received = (500 × 0.90 × 1.05 × $1 × 0.999) ÷ $50,000
BTC Received = (500 × 0.945 × 0.999) ÷ $50,000 = 0.009448 BTC
USD Value = 0.009448 × $50,000 = $472.40
\`\`\`

---

## Over-Peg Management

### How the System Maintains $1 Peg

The BTC1USD system uses **economic incentives** rather than direct price controls:

### 1. Minting Pressure (When R is High)
**When R > 1.10:**
- Minting becomes expensive (costs R × $1 worth of BTC)
- Users are incentivized to mint and sell for profit
- Increased supply pushes price toward $1

**Example:**
- R = 1.25, BTC = $50,000
- Mint cost: $1.25 worth of BTC per token
- If BTC1USD trades at $1.20, users can:
  - Pay $1.25 in BTC → Get 1 BTC1USD → Sell for $1.20
  - This is unprofitable, so minting slows down

### 2. Redemption Pressure (When Price Deviates)
**When BTC1USD trades below $1:**
- Users can buy cheap BTC1USD and redeem for $1 worth of BTC
- This creates buying pressure, pushing price up

**Example:**
- BTC1USD trades at $0.95
- User buys 1,000 tokens for $950
- Redeems for $999.50 worth of BTC (after 0.1% fee)
- Profit: $49.50

### 3. Weekly Distributions (Surplus Management)
**When R ≥ 1.12:**
- Excess collateral is distributed as rewards
- This reduces R back toward safe levels
- Prevents excessive over-collateralization

---

## Real Examples

### Example 1: System Launch
**Initial State:**
- Vault: Empty
- BTC1USD Supply: 0
- BTC Price: $50,000

**First Mint:**
- User wants 10,000 BTC1USD
- Since supply = 0, mint price = $1.10 (minimum)
- BTC needed: (10,000 × $1.10) ÷ $50,000 = 0.22 BTC
- After minting: R = ($11,000) ÷ 10,000 = 1.10

### Example 2: BTC Price Increases
**Before:**
- Vault: 10 BTC
- BTC Price: $50,000
- BTC1USD Supply: 450,000
- R = ($500,000) ÷ 450,000 = 1.111

**After BTC rises to $60,000:**
- Vault: 10 BTC (unchanged)
- BTC Price: $60,000
- BTC1USD Supply: 450,000 (unchanged)
- R = ($600,000) ÷ 450,000 = 1.333

**Result:** Higher R triggers weekly distributions

### Example 3: BTC Price Crashes
**Before:**
- Vault: 10 BTC
- BTC Price: $50,000
- BTC1USD Supply: 450,000
- R = 1.111

**After BTC drops to $40,000:**
- R = ($400,000) ÷ 450,000 = 0.889

**Result:** System enters stress mode
- New redemptions get: 0.90 × 0.889 = 0.80 × $1 worth of BTC
- Minting still requires $1.10 worth of BTC (minimum safety)

---

## Edge Cases

### Case 1: Extreme BTC Crash
**Scenario:** BTC drops 50% overnight
- R falls below 1.10
- Redemptions become partial (stress mode)
- System remains functional but at reduced value

**Math:**
- If R = 0.60, redemptions get: 0.90 × 0.60 = 0.54 × $1 = $0.54 worth of BTC

### Case 2: Rapid Growth
**Scenario:** High demand for BTC1USD
- Frequent minting at high R values
- Weekly distributions help manage excess collateral
- System self-regulates through economic incentives

### Case 3: Oracle Failure
**Scenario:** Price feed becomes stale
- All operations pause automatically
- No minting or redemption until price is updated
- Protects against incorrect calculations

---

## Key Mathematical Properties

### 1. Conservation of Value
\`\`\`
Total System Value = Vault BTC Value
User Claims = BTC1USD Supply × Redemption Rate
\`\`\`

### 2. Safety Buffer
\`\`\`
Safety Buffer = (R - 1.0) × BTC1USD Supply
\`\`\`
This represents extra value protecting against BTC volatility.

### 3. Distribution Sustainability
\`\`\`
Max Weekly Distribution = (R - 1.10) × BTC1USD Supply
\`\`\`
Ensures distributions never compromise minimum safety ratio.

---

## Summary

The BTC1USD collateral system works through:

1. **Over-collateralization**: Always holding more BTC value than token claims
2. **Dynamic pricing**: Mint costs adjust with collateral ratio
3. **Stress protection**: Partial redemptions when under-collateralized
4. **Surplus sharing**: Weekly distributions when over-collateralized
5. **Economic incentives**: Market forces help maintain $1 peg

The mathematics ensure the system remains stable and fair while sharing both profits and risks with token holders in a Shariah-compliant manner.
