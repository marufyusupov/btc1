/**
 * useDistributionHistory Hook
 *
 * Fetches and tracks all BatchTransferCompleted events from both Dev and Endowment wallets
 */

import { useEffect, useState } from 'react';
import { usePublicClient } from 'wagmi';
import {
  fetchAllDistributions,
  DistributionSummary,
  DistributionEvent
} from '@/lib/distribution-tracker';

interface UseDistributionHistoryReturn {
  summary: DistributionSummary | null;
  events: DistributionEvent[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to fetch and track distribution history
 */
export function useDistributionHistory(
  autoRefresh: boolean = true,
  refreshIntervalMinutes: number = 5
): UseDistributionHistoryReturn {
  const [summary, setSummary] = useState<DistributionSummary | null>(null);
  const [events, setEvents] = useState<DistributionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const publicClient = usePublicClient();

  const fetchDistributions = async () => {
    if (!publicClient) {
      setError('Wallet not connected');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('📊 Fetching distribution history...');

      const distributionSummary = await fetchAllDistributions(publicClient);

      setSummary(distributionSummary);
      setEvents(distributionSummary.events);
      setLoading(false);

      console.log(`✅ Loaded ${distributionSummary.totalDistributions} distributions`);
    } catch (err: any) {
      console.error('❌ Failed to fetch distribution history:', err);
      setError(err.message || 'Failed to fetch distribution history');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDistributions();

    if (autoRefresh) {
      const interval = setInterval(
        fetchDistributions,
        refreshIntervalMinutes * 60 * 1000
      );
      return () => clearInterval(interval);
    }
  }, [publicClient, autoRefresh, refreshIntervalMinutes]);

  return {
    summary,
    events,
    loading,
    error,
    refresh: fetchDistributions
  };
}
