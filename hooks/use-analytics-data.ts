"use client";

import { useState, useEffect } from 'react';
import { useReadContracts } from 'wagmi';
import { formatUnits } from 'viem';
import { CONTRACT_ADDRESSES, ABIS } from '@/lib/contracts';

export interface CollateralData {
  wbtc: {
    balance: bigint;
    percentage: number;
    value: number;
  };
  cbbtc: {
    balance: bigint;
    percentage: number;
    value: number;
  };
  tbtc: {
    balance: bigint;
    percentage: number;
    value: number;
  };
  totalCollateral: bigint;
}

export interface AnalyticsData {
  collateralData: CollateralData | null;
  totalSupply: bigint;
  totalHolders: number;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useAnalyticsData(btcPrice: number): AnalyticsData {
  const [totalHolders, setTotalHolders] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Fetch all contract data in parallel
  const { data, isLoading, refetch } = useReadContracts({
    contracts: [
      // BTC1USD total supply
      {
        address: CONTRACT_ADDRESSES.BTC1USD as `0x${string}`,
        abi: ABIS.BTC1USD,
        functionName: 'totalSupply',
      },
      // Total collateral value from Vault (in BTC with 8 decimals)
      {
        address: CONTRACT_ADDRESSES.VAULT as `0x${string}`,
        abi: [{
          inputs: [],
          name: "getTotalCollateralValue",
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          stateMutability: "view",
          type: "function",
        }],
        functionName: 'getTotalCollateralValue',
      },
      // WBTC balance in vault
      {
        address: CONTRACT_ADDRESSES.WBTC_TOKEN as `0x${string}`,
        abi: ABIS.ERC20,
        functionName: 'balanceOf',
        args: [CONTRACT_ADDRESSES.VAULT as `0x${string}`],
      },
      // cbBTC balance in vault
      {
        address: CONTRACT_ADDRESSES.CBBTC_TOKEN as `0x${string}`,
        abi: ABIS.ERC20,
        functionName: 'balanceOf',
        args: [CONTRACT_ADDRESSES.VAULT as `0x${string}`],
      },
      // tBTC balance in vault
      {
        address: CONTRACT_ADDRESSES.TBTC_TOKEN as `0x${string}`,
        abi: ABIS.ERC20,
        functionName: 'balanceOf',
        args: [CONTRACT_ADDRESSES.VAULT as `0x${string}`],
      },
    ],
    query: {
      refetchInterval: 30000, // Refetch every 30 seconds
    },
  });

  // Fetch holder count from API
  useEffect(() => {
    const fetchHolderCount = async () => {
      try {
        const response = await fetch('/api/holders-count');
        if (response.ok) {
          const data = await response.json();
          setTotalHolders(data.count || 0);
        }
      } catch (err) {
        console.error('Failed to fetch holder count:', err);
      }
    };

    fetchHolderCount();
    const interval = setInterval(fetchHolderCount, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  // Process collateral data
  const collateralData: CollateralData | null = data ? (() => {
    const totalSupply = data[0]?.result as bigint || 0n;
    const totalCollateralValue = data[1]?.result as bigint || 0n; // Total USD value from Vault
    const wbtcBalance = data[2]?.result as bigint || 0n;
    const cbbtcBalance = data[3]?.result as bigint || 0n;
    const tbtcBalance = data[4]?.result as bigint || 0n;

    const totalCollateral = wbtcBalance + cbbtcBalance + tbtcBalance;

    if (totalCollateral === 0n) {
      return {
        wbtc: { balance: 0n, percentage: 0, value: 0 },
        cbbtc: { balance: 0n, percentage: 0, value: 0 },
        tbtc: { balance: 0n, percentage: 0, value: 0 },
        totalCollateral: 0n,
      };
    }

    // Calculate percentages based on actual balances
    const wbtcPercentage = Number((wbtcBalance * 10000n) / totalCollateral) / 100;
    const cbbtcPercentage = Number((cbbtcBalance * 10000n) / totalCollateral) / 100;
    const tbtcPercentage = Number((tbtcBalance * 10000n) / totalCollateral) / 100;

    // Calculate USD values independently to avoid rounding discrepancies
    // Convert balances to numbers and multiply by BTC price
    const wbtcBalanceNum = parseFloat(formatUnits(wbtcBalance, 8));
    const cbbtcBalanceNum = parseFloat(formatUnits(cbbtcBalance, 8));
    const tbtcBalanceNum = parseFloat(formatUnits(tbtcBalance, 8));
    
    const wbtcValue = wbtcBalanceNum * btcPrice;
    const cbbtcValue = cbbtcBalanceNum * btcPrice;
    const tbtcValue = tbtcBalanceNum * btcPrice;

    return {
      wbtc: {
        balance: wbtcBalance,
        percentage: wbtcPercentage,
        value: wbtcValue,
      },
      cbbtc: {
        balance: cbbtcBalance,
        percentage: cbbtcPercentage,
        value: cbbtcValue,
      },
      tbtc: {
        balance: tbtcBalance,
        percentage: tbtcPercentage,
        value: tbtcValue,
      },
      totalCollateral,
    };
  })() : null;

  return {
    collateralData,
    totalSupply: data?.[0]?.result as bigint || 0n,
    totalHolders,
    loading: isLoading,
    error,
    refetch: () => {
      refetch();
    },
  };
}
