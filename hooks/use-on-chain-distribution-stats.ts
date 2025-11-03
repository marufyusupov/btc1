/**
 * useOnChainDistributionStats Hook
 *
 * Reads distribution statistics directly from smart contracts
 * Much faster than scanning historical events!
 *
 * The contracts track:
 * - Total distributions count
 * - Total amount distributed
 * - Total recipients
 * - Total failed transfers
 *
 * All data is stored on-chain and retrieved with simple view function calls.
 */

import { useEffect, useState } from 'react';
import { usePublicClient } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/lib/contracts';
import { formatUnits } from 'viem';

export interface OnChainDistributionStats {
  devTotalDistributions: number;
  devTotalAmount: number;
  devTotalRecipients: number;
  devTotalFailed: number;

  endowmentTotalDistributions: number;
  endowmentTotalAmount: number;
  endowmentTotalRecipients: number;
  endowmentTotalFailed: number;

  // Combined totals
  totalDistributions: number;
  totalAmount: number;
  totalRecipients: number;
  totalFailed: number;
  successRate: number;
}

// ABI for getDistributionStats function
const GET_DISTRIBUTION_STATS_ABI = [
  {
    inputs: [{ name: 'token', type: 'address' }],
    name: 'getDistributionStats',
    outputs: [
      { name: 'totalDistributions', type: 'uint256' },
      { name: 'totalAmountDistributed', type: 'uint256' },
      { name: 'totalRecipients', type: 'uint256' },
      { name: 'totalFailed', type: 'uint256' }
    ],
    stateMutability: 'view',
    type: 'function'
  }
] as const;

/**
 * Hook to fetch on-chain distribution statistics
 * @param tokenAddress - Token address to query (defaults to BTC1USD)
 * @param autoRefresh - Auto-refresh every 30 seconds (default: true)
 */
export function useOnChainDistributionStats(
  tokenAddress?: string,
  autoRefresh: boolean = true
) {
  const [stats, setStats] = useState<OnChainDistributionStats>({
    devTotalDistributions: 0,
    devTotalAmount: 0,
    devTotalRecipients: 0,
    devTotalFailed: 0,
    endowmentTotalDistributions: 0,
    endowmentTotalAmount: 0,
    endowmentTotalRecipients: 0,
    endowmentTotalFailed: 0,
    totalDistributions: 0,
    totalAmount: 0,
    totalRecipients: 0,
    totalFailed: 0,
    successRate: 100
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const publicClient = usePublicClient();

  // Use BTC1USD token by default
  const token = tokenAddress || CONTRACT_ADDRESSES.BTC1USD_CONTRACT;

  const fetchStats = async () => {
    if (!publicClient) {
      setError('Wallet not connected');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('📊 Fetching on-chain distribution stats...');

      // Fetch Dev Wallet stats
      const devStatsResult = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.DEV_WALLET as `0x${string}`,
        abi: GET_DISTRIBUTION_STATS_ABI,
        functionName: 'getDistributionStats',
        args: [token as `0x${string}`]
      });

      // Fetch Endowment Wallet stats
      const endowmentStatsResult = await publicClient.readContract({
        address: CONTRACT_ADDRESSES.ENDOWMENT_WALLET as `0x${string}`,
        abi: GET_DISTRIBUTION_STATS_ABI,
        functionName: 'getDistributionStats',
        args: [token as `0x${string}`]
      });

      // Parse Dev Wallet stats
      const devDistributions = Number(devStatsResult[0]);
      const devAmount = parseFloat(formatUnits(devStatsResult[1] as bigint, 8));
      const devRecipients = Number(devStatsResult[2]);
      const devFailed = Number(devStatsResult[3]);

      // Parse Endowment Wallet stats
      const endowmentDistributions = Number(endowmentStatsResult[0]);
      const endowmentAmount = parseFloat(formatUnits(endowmentStatsResult[1] as bigint, 8));
      const endowmentRecipients = Number(endowmentStatsResult[2]);
      const endowmentFailed = Number(endowmentStatsResult[3]);

      // Calculate combined totals
      const totalDistributions = devDistributions + endowmentDistributions;
      const totalAmount = devAmount + endowmentAmount;
      const totalRecipients = devRecipients + endowmentRecipients;
      const totalFailed = devFailed + endowmentFailed;
      const successRate = totalRecipients > 0
        ? ((totalRecipients - totalFailed) / totalRecipients) * 100
        : 100;

      console.log('✅ On-chain stats loaded:');
      console.log(`   Dev: ${devDistributions} distributions, ${devAmount.toFixed(8)} BTC1USD`);
      console.log(`   Endowment: ${endowmentDistributions} distributions, ${endowmentAmount.toFixed(8)} BTC1USD`);
      console.log(`   Total: ${totalAmount.toFixed(8)} BTC1USD to ${totalRecipients} recipients`);

      setStats({
        devTotalDistributions: devDistributions,
        devTotalAmount: devAmount,
        devTotalRecipients: devRecipients,
        devTotalFailed: devFailed,
        endowmentTotalDistributions: endowmentDistributions,
        endowmentTotalAmount: endowmentAmount,
        endowmentTotalRecipients: endowmentRecipients,
        endowmentTotalFailed: endowmentFailed,
        totalDistributions,
        totalAmount,
        totalRecipients,
        totalFailed,
        successRate
      });

      setLoading(false);
    } catch (err: any) {
      console.error('❌ Failed to fetch on-chain stats:', err);
      setError(err.message || 'Failed to fetch distribution stats');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();

    if (autoRefresh) {
      const interval = setInterval(fetchStats, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [publicClient, token, autoRefresh]);

  return {
    stats,
    loading,
    error,
    refresh: fetchStats
  };
}
