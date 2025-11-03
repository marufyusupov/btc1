import { type ProtocolState, ProtocolMath } from "./protocol-math"

export class ProtocolSimulator {
  private state: ProtocolState
  private history: Array<ProtocolState & { timestamp: number }> = []

  constructor(initialState?: Partial<ProtocolState>) {
    // Default realistic initial state
    this.state = {
      btcPrice: 100000, // $100,000
      totalSupply: 0,
      collateralBalances: {
        wbtc: 0,
        cbbtc: 0,
        tbtc: 0,
      },
      devWallet: 0,
      endowmentWallet: 0,
      contractAddresses: {
        btc1usd: "0xD987f1bF0184b7269913d77704B42dC0c2447948",
        vault: "0xF9f46a648F0cd71B627db7b03Cd3d61b00e581ac",
        priceOracle: "0xf011fF71e84fa8760D6920A3642b72E514f6e179",
        weeklyDistribution: "0xc9eE2ee2a9a3073531A620e0BBA23198Eb5F4308",
        merkleDistributor: "0xcc75AD1808dA5a1909BaE42D99f4DC9563Ef6db1",
        endowmentManager: "0x6a668C446181b79fd8472b7deD1d156901Ff3616",
        protocolGovernance: "0x4066Ba2982d02Fd34Da5C8FAf9BfC9385B8Bc251",
        wbtc: "0x5594cEcfE305954AB96B549c723c06445A0D5b15",
        cbbtc: "0xf941e1783d15b7046b8b633544EEaC06aB547A6C",
        tbtc: "0x98Ae02FD106B0671bA74012fBe7A6b21A3341Aee",
      },
      ...initialState,
    } as ProtocolState

    this.recordState()
  }

  private recordState() {
    this.history.push({
      ...this.state,
      timestamp: Date.now(),
    })

    // Keep only last 100 records
    if (this.history.length > 100) {
      this.history = this.history.slice(-100)
    }
  }

  // Simulate BTC price movement
  simulatePriceMovement(volatility = 0.02) {
    const change = (Math.random() - 0.5) * 2 * volatility
    this.state.btcPrice *= 1 + change
    this.recordState()
    return this.state.btcPrice
  }

  // Simulate user minting
  simulateMint(usdAmount: number) {
    const mintResult = ProtocolMath.calculateMint(this.state, usdAmount)

    // Add BTC to collateral (randomly distributed)
    const btcToAdd = mintResult.btcRequired
    const distribution = Math.random()

    if (distribution < 0.5) {
      this.state.collateralBalances.wbtc += btcToAdd
    } else if (distribution < 0.8) {
      this.state.collateralBalances.cbbtc += btcToAdd
    } else {
      this.state.collateralBalances.tbtc += btcToAdd
    }

    // Update supply and fees
    this.state.totalSupply += mintResult.tokensToMint
    this.state.devWallet += mintResult.devFee
    this.state.endowmentWallet += mintResult.endowmentFee

    this.recordState()
    return mintResult
  }

  // Simulate user redemption
  simulateRedeem(tokenAmount: number) {
    const redeemResult = ProtocolMath.calculateRedeem(this.state, tokenAmount)

    // Remove BTC from collateral (proportionally)
    const totalCollateral =
      this.state.collateralBalances.wbtc + this.state.collateralBalances.cbbtc + this.state.collateralBalances.tbtc

    const btcToRemove = redeemResult.btcToReceive + redeemResult.devFee

    this.state.collateralBalances.wbtc -= (this.state.collateralBalances.wbtc / totalCollateral) * btcToRemove
    this.state.collateralBalances.cbbtc -= (this.state.collateralBalances.cbbtc / totalCollateral) * btcToRemove
    this.state.collateralBalances.tbtc -= (this.state.collateralBalances.tbtc / totalCollateral) * btcToRemove

    // Update supply and dev fees
    this.state.totalSupply -= tokenAmount
    this.state.devWallet += redeemResult.devFee

    this.recordState()
    return redeemResult
  }

  // Simulate weekly distribution
  simulateDistribution() {
    const distributionResult = ProtocolMath.calculateDistribution(this.state)

    if (distributionResult.canDistribute) {
      // Update supply with new tokens
      this.state.totalSupply += distributionResult.totalMinted
      this.state.devWallet += distributionResult.developerFee
      this.state.endowmentWallet += distributionResult.endowmentFee

      this.recordState()
    }

    return distributionResult
  }

  // Generate realistic historical data
  generateHistoricalData(days = 30): Array<{
    date: string
    btcPrice: number
    btc1usdPrice: number
    collateralRatio: number
    volume: number
    totalSupply: number
  }> {
    const data = []
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    let currentBtcPrice = 95000 + Math.random() * 10000 // Start between $95k-$105k
    let currentSupply = 800000 + Math.random() * 400000 // Start between 800k-1.2M

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)

      // Simulate price movement
      currentBtcPrice *= 1 + (Math.random() - 0.5) * 0.04 // ±2% daily volatility

      // Simulate supply changes
      const supplyChange = (Math.random() - 0.4) * 0.02 // Slight growth bias
      currentSupply *= 1 + supplyChange

      // Calculate collateral ratio (simulate realistic values)
      const baseRatio = 1.15 + Math.random() * 0.15 // 115%-130%
      const priceImpact = ((currentBtcPrice - 100000) / 100000) * 0.1 // Price affects ratio
      const collateralRatio = baseRatio + priceImpact

      // Volume simulation
      const volume = 50000 + Math.random() * 150000 // $50k-$200k daily volume

      data.push({
        date: date.toISOString().split("T")[0],
        btcPrice: Math.round(currentBtcPrice),
        btc1usdPrice: 1.0, // Always $1 target
        collateralRatio: Math.max(1.05, collateralRatio), // Never below 105%
        volume: Math.round(volume),
        totalSupply: Math.round(currentSupply),
      })
    }

    return data
  }

  // Get current state
  getCurrentState(): ProtocolState {
    return { ...this.state }
  }

  // Get health metrics
  getHealthMetrics() {
    return ProtocolMath.calculateHealthMetrics(this.state)
  }

  // Get history
  getHistory() {
    return [...this.history]
  }

  // Reset to initial state
  reset(newState?: Partial<ProtocolState>) {
    this.state = {
      btcPrice: 100000, // $100,000
      totalSupply: 0,
      collateralBalances: {
        wbtc: 0,
        cbbtc: 0,
        tbtc: 0,
      },
      devWallet: 0,
      endowmentWallet: 0,
      contractAddresses: {
        btc1usd: "0xD987f1bF0184b7269913d77704B42dC0c2447948",
        vault: "0xF9f46a648F0cd71B627db7b03Cd3d61b00e581ac",
        priceOracle: "0xf011fF71e84fa8760D6920A3642b72E514f6e179",
        weeklyDistribution: "0xc9eE2ee2a9a3073531A620e0BBA23198Eb5F4308",
        merkleDistributor: "0xcc75AD1808dA5a1909BaE42D99f4DC9563Ef6db1",
        endowmentManager: "0x6a668C446181b79fd8472b7deD1d156901Ff3616",
        protocolGovernance: "0x4066Ba2982d02Fd34Da5C8FAf9BfC9385B8Bc251",
        wbtc: "0x5594cEcfE305954AB96B549c723c06445A0D5b15",
        cbbtc: "0xf941e1783d15b7046b8b633544EEaC06aB547A6C",
        tbtc: "0x98Ae02FD106B0671bA74012fBe7A6b21A3341Aee",
      },
      ...newState,
    } as ProtocolState
    this.history = []
    this.recordState()
  }

  // Stress test scenarios
  stressTest(scenario: "crash" | "pump" | "volatility") {
    switch (scenario) {
      case "crash":
        this.state.btcPrice *= 0.7 // 30% crash
        break
      case "pump":
        this.state.btcPrice *= 1.5 // 50% pump
        break
      case "volatility":
        // Simulate high volatility over time
        for (let i = 0; i < 10; i++) {
          this.simulatePriceMovement(0.05) // 5% volatility
        }
        break
    }
    this.recordState()
    return this.getHealthMetrics()
  }
}

// Global simulator instance
export const protocolSimulator = new ProtocolSimulator()
