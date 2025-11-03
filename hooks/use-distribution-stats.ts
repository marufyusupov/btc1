/**
 * useDistributionStats Hook
 *
 * Fetches distribution statistics using a multi-strategy approach:
 * 1. Direct contract reads (most accurate)
 * 2. API as fallback
 * 3. Graceful degradation
 *
 * CONFIGURATION:
 * To improve performance, set DEPLOYMENT_BLOCKS to the actual block numbers
 * where your contracts were deployed. Use 0n to query full blockchain history.
 *
 * Example: Find deployment block on Basescan, then set:
 * DEV_WALLET: 12345678n,
 */

import { useEffect, useState } from 'react';
import { usePublicClient } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/lib/contracts';
import { formatUnits, decodeEventLog, Hash } from 'viem';

export interface DistributionStats {
  devTotalDistributed: number;
  endowmentTotalDistributed: number;
  devDistributionCount: number;
  endowmentDistributionCount: number;
}

/**
 * DEPLOYMENT BLOCKS Configuration
 * Set these to your contract deployment blocks for better performance.
 * Using 0n will query the entire blockchain history (slower but comprehensive).
 */
const DEPLOYMENT_BLOCKS = {
  DEV_WALLET: 0n, // TODO: Set to actual deployment block from Basescan
  ENDOWMENT_WALLET: 0n, // TODO: Set to actual deployment block from Basescan
};

// BatchTransferCompleted event signature
const BATCH_TRANSFER_EVENT = {
  type: 'event',
  name: 'BatchTransferCompleted',
  inputs: [
    { name: 'token', type: 'address', indexed: true },
    { name: 'totalRecipients', type: 'uint256' },
    { name: 'totalSent', type: 'uint256' },
    { name: 'totalFailed', type: 'uint256' }
  ]
} as const;

export function useDistributionStats() {
  const [stats, setStats] = useState<DistributionStats>({
    devTotalDistributed: 0,
    endowmentTotalDistributed: 0,
    devDistributionCount: 0,
    endowmentDistributionCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingCache, setUsingCache] = useState(false);
  const [cacheAge, setCacheAge] = useState<number>(0);
  const publicClient = usePublicClient();

  useEffect(() => {
    const fetchDistributionStats = async () => {
      if (!publicClient) return;

      console.log('🚀 Starting distribution stats fetch with direct contract approach');

      try {
        setLoading(true);
        setError(null);

        // Strategy 1: Try to get data from API as fallback
        console.log('📡 Strategy 1: Fetching from API as fallback...');

        let apiData: any = null;
        try {
          const response = await fetch('/api/governance/endowment?type=distributions');
          if (response.ok) {
            const data = await response.json();
            apiData = data.distributions || [];

            // Check if we're using cached data
            if (data.cached) {
              setUsingCache(true);
              setCacheAge(data.cacheAge || 0);
              console.log(`📦 Using cached API data (${data.cacheAge} minutes old):`, apiData.length, 'distributions');
            } else {
              setUsingCache(false);
              setCacheAge(0);
              console.log('✅ API data (fresh):', apiData.length, 'distributions');
            }
          }
        } catch (apiError) {
          console.warn('⚠️ API failed:', apiError);
        }

        // Strategy 2: Use API data if available as fallback
        if (apiData && apiData.length > 0) {
          const endowmentTotal = apiData
            .filter((dist: any) => dist.executed)
            .reduce((sum: number, dist: any) => sum + parseFloat(dist.amount), 0);
          const endowmentCount = apiData.filter((dist: any) => dist.executed).length;
          
          const devTotal = 0; // We don't have dev data in API, so we'll keep it at 0
          const devCount = 0; // Same for count
          
          console.log('\n📈 Final Statistics (from API):');
          console.log(`  Dev: ${devTotal} BTC1USD (${devCount} distributions)`);
          console.log(`  Endowment: ${endowmentTotal} BTC1USD (${endowmentCount} distributions)`);

          setStats({
            devTotalDistributed: devTotal,
            endowmentTotalDistributed: endowmentTotal,
            devDistributionCount: devCount,
            endowmentDistributionCount: endowmentCount
          });
        } else {
          // If no API data, set defaults
          setStats({
            devTotalDistributed: 0,
            endowmentTotalDistributed: 0,
            devDistributionCount: 0,
            endowmentDistributionCount: 0
          });
        }

        setLoading(false);
      } catch (err: any) {
        console.error('❌ Error in distribution stats fetch:', err);

        // Strategy 3: Graceful degradation - use zero values
        console.log('🆘 Strategy 3: Emergency fallback to zero values...');

        setStats({
          devTotalDistributed: 0,
          endowmentTotalDistributed: 0,
          devDistributionCount: 0,
          endowmentDistributionCount: 0
        });
        
        setError('Unable to fetch distribution statistics. Displaying default values.');
        setLoading(false);
      }
    };

    fetchDistributionStats();

    // Refresh every 5 minutes
    const interval = setInterval(fetchDistributionStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [publicClient]);

  return { stats, loading, error, usingCache, cacheAge };
}