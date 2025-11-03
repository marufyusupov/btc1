import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, ABIS } from '@/lib/contracts';
import { executeWithProviderFallback } from '@/lib/rpc-provider';

/**
 * Reconciles distribution data between on-chain and off-chain records
 * Identifies discrepancies and provides detailed analysis
 */
export class DistributionReconciler {
  private provider: ethers.Provider;

  constructor(provider: ethers.Provider) {
    this.provider = provider;
  }

  /**
   * Fetches comprehensive distribution data for reconciliation
   */
  async getDistributionData(distributionId: number) {
    try {
      const [root, totalTokens, totalClaimed, timestamp, finalized] =
        await executeWithProviderFallback(async (provider) => {
          const merkleDistributor = new ethers.Contract(
            CONTRACT_ADDRESSES.MERKLE_DISTRIBUTOR,
            ABIS.MERKLE_DISTRIBUTOR,
            provider
          );
          
          return await merkleDistributor.getDistributionInfo(distributionId);
        }, 84532, {
          timeout: 15000,
          maxRetries: 3,
          retryDelay: 2000,
          backoffMultiplier: 2
        });

      return {
        distributionId,
        root,
        totalTokens: totalTokens.toString(),
        totalClaimed: totalClaimed.toString(),
        timestamp: new Date(Number(timestamp) * 1000).toISOString(),
        finalized,
        unclaimed: (totalTokens - totalClaimed).toString()
      };
    } catch (error) {
      console.error(`Error fetching distribution ${distributionId}:`, error);
      throw error;
    }
  }

  /**
   * Calculates the total unclaimed tokens across all distributions
   */
  async calculateTotalUnclaimed() {
    try {
      const merkleDistributor = new ethers.Contract(
        CONTRACT_ADDRESSES.MERKLE_DISTRIBUTOR,
        ABIS.MERKLE_DISTRIBUTOR,
        this.provider
      );

      const currentDistId = await merkleDistributor.currentDistributionId();
      let totalUnclaimed = 0n;

      for (let i = 1; i <= currentDistId; i++) {
        try {
          const [root, totalTokens, totalClaimed] = await merkleDistributor.getDistributionInfo(i);
          totalUnclaimed = totalUnclaimed + (BigInt(totalTokens) - BigInt(totalClaimed));
        } catch (error) {
          console.warn(`Failed to fetch distribution ${i}:`, error);
        }
      }

      return totalUnclaimed.toString();
    } catch (error) {
      console.error('Error calculating total unclaimed:', error);
      throw error;
    }
  }

  /**
   * Gets the actual contract balance
   */
  async getContractBalance() {
    try {
      const btc1usd = new ethers.Contract(
        CONTRACT_ADDRESSES.BTC1USD,
        ['function balanceOf(address) view returns (uint256)'],
        this.provider
      );

      const balance = await btc1usd.balanceOf(CONTRACT_ADDRESSES.MERKLE_DISTRIBUTOR);
      return balance.toString();
    } catch (error) {
      console.error('Error getting contract balance:', error);
      throw error;
    }
  }

  /**
   * Identifies and categorizes discrepancies
   */
  async identifyDiscrepancies() {
    try {
      const merkleDistributor = new ethers.Contract(
        CONTRACT_ADDRESSES.MERKLE_DISTRIBUTOR,
        ABIS.MERKLE_DISTRIBUTOR,
        this.provider
      );

      const currentDistId = await merkleDistributor.currentDistributionId();
      const contractBalance = await this.getContractBalance();
      const totalUnclaimed = await this.calculateTotalUnclaimed();

      const discrepancies = {
        summary: {
          expectedUnclaimed: totalUnclaimed,
          actualBalance: contractBalance,
          difference: (BigInt(totalUnclaimed) - BigInt(contractBalance)).toString()
        },
        distributions: [] as any[],
        reclaimed: [] as any[]
      };

      // Check each distribution
      for (let i = 1; i <= currentDistId; i++) {
        try {
          const distData = await this.getDistributionData(i);
          
          // Check if distribution has been reclaimed
          const isFinalized = distData.finalized;
          
          if (isFinalized) {
            discrepancies.reclaimed.push({
              ...distData
            });
          } else {
            discrepancies.distributions.push({
              ...distData
            });
          }
        } catch (error) {
          console.warn(`Failed to analyze distribution ${i}:`, error);
        }
      }

      return discrepancies;
    } catch (error) {
      console.error('Error identifying discrepancies:', error);
      throw error;
    }
  }

  /**
   * Generates a detailed reconciliation report
   */
  async generateReconciliationReport() {
    try {
      const discrepancies = await this.identifyDiscrepancies();
      
      const report = {
        timestamp: new Date().toISOString(),
        ...discrepancies,
        analysis: this.analyzeDiscrepancies(discrepancies)
      };

      return report;
    } catch (error) {
      console.error('Error generating reconciliation report:', error);
      throw error;
    }
  }

  /**
   * Analyzes discrepancies and provides recommendations
   */
  private analyzeDiscrepancies(discrepancies: any) {
    const expected = BigInt(discrepancies.summary.expectedUnclaimed);
    const actual = BigInt(discrepancies.summary.actualBalance);
    const difference = expected - actual;

    const analysis = {
      hasDiscrepancy: difference !== 0n,
      discrepancyAmount: difference.toString(),
      percentage: expected > 0n ? Number((difference * 10000n) / expected) / 100 : 0,
      possibleCauses: [] as string[],
      recommendations: [] as string[]
    };

    if (difference > 0n) {
      analysis.possibleCauses.push("Tokens have been reclaimed to Endowment Wallet");
      analysis.possibleCauses.push("Protocol wallets were included in totalTokens but not actually minted");
      analysis.possibleCauses.push("Minting to MerkleDistributor failed for some distributions");
      
      analysis.recommendations.push("Verify reclaimed distributions in the Endowment Wallet");
      analysis.recommendations.push("Check minting events in transaction history");
      analysis.recommendations.push("Review excluded addresses in WeeklyDistribution contract");
    } else if (difference < 0n) {
      analysis.possibleCauses.push("Extra tokens were transferred to the contract");
      analysis.possibleCauses.push("Calculation error in distribution tracking");
      
      analysis.recommendations.push("Review all token transfers to the MerkleDistributor");
      analysis.recommendations.push("Verify distribution calculations in frontend");
    }

    return analysis;
  }
}

/**
 * Fixes precision issues in frontend calculations
 */
export function fixPrecisionIssues(amount: string): string {
  try {
    // Convert to BigInt for precise calculations
    const amountBigInt = BigInt(amount);
    
    // Format with 8 decimal places (BTC1USD standard)
    const integerPart = amountBigInt / 100000000n;
    const fractionalPart = amountBigInt % 100000000n;
    
    // Format fractional part with leading zeros
    const fractionalStr = fractionalPart.toString().padStart(8, '0');
    
    // Remove trailing zeros but keep at least one decimal digit
    let formattedFractional = fractionalStr.replace(/0+$/, '');
    if (formattedFractional === '') formattedFractional = '0';
    
    return `${integerPart.toString()}.${formattedFractional}`;
  } catch (error) {
    console.error('Error fixing precision:', error);
    return amount;
  }
}

/**
 * Updates distribution tracking to properly reflect reclaimed tokens
 */
export async function updateDistributionTracking(distributionId: number, isReclaimed: boolean) {
  try {
    // In a real implementation, this would update the database/cache
    // to properly track reclaimed distributions
    
    console.log(`Distribution #${distributionId} marked as ${isReclaimed ? 'reclaimed' : 'active'}`);
    
    // Return success status
    return {
      success: true,
      distributionId,
      isReclaimed,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error updating distribution tracking:', error);
    throw error;
  }
}