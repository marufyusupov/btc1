import { useState, useEffect } from 'react'
import { useAccount, useWatchContractEvent } from 'wagmi'
import { CONTRACT_ADDRESSES } from '@/lib/contracts'
import { formatUnits } from 'viem'

export interface ActivityEvent {
  id: string
  type: 'mint' | 'redeem' | 'claim' | 'distribution' | 'governance'
  title: string
  description: string
  amount?: string
  timestamp: number
  txHash?: string
  icon: 'plus' | 'minus' | 'gift' | 'calendar' | 'vote'
  color: 'green' | 'red' | 'orange' | 'blue' | 'purple'
}

const VAULT_ABI = [
  {
    "anonymous": true,
    "inputs": [
      { "indexed": true, "name": "user", "type": "address" },
      { "indexed": false, "name": "btcAmount", "type": "uint256" },
      { "indexed": false, "name": "tokensIssued", "type": "uint256" },
      { "indexed": false, "name": "collateralToken", "type": "address" }
    ],
    "name": "Mint",
    "type": "event"
  },
  {
    "anonymous": true,
    "inputs": [
      { "indexed": true, "name": "user", "type": "address" },
      { "indexed": false, "name": "tokensRedeemed", "type": "uint256" },
      { "indexed": false, "name": "btcAmount", "type": "uint256" },
      { "indexed": false, "name": "collateralToken", "type": "address" }
    ],
    "name": "Redeem",
    "type": "event"
  }
] as const

const DISTRIBUTOR_ABI = [
  {
    "anonymous": true,
    "inputs": [
      { "indexed": false, "name": "index", "type": "uint256" },
      { "indexed": false, "name": "account", "type": "address" },
      { "indexed": false, "name": "amount", "type": "uint256" }
    ],
    "name": "Claimed",
    "type": "event"
  }
] as const

const WEEKLY_DISTRIBUTION_ABI = [
  {
    "anonymous": true,
    "inputs": [
      { "indexed": true, "name": "distributionId", "type": "uint256" },
      { "indexed": false, "name": "collateralRatio", "type": "uint256" },
      { "indexed": false, "name": "rewardPerToken", "type": "uint256" },
      { "indexed": false, "name": "totalRewards", "type": "uint256" },
      { "indexed": false, "name": "timestamp", "type": "uint256" }
    ],
    "name": "WeeklyDistribution",
    "type": "event"
  }
] as const

export function useRecentActivity() {
  const { address } = useAccount()
  const [activities, setActivities] = useState<ActivityEvent[]>([])

  // Watch Mint events
  useWatchContractEvent({
    address: CONTRACT_ADDRESSES.VAULT as `0x${string}`,
    abi: VAULT_ABI,
    eventName: 'Mint',
    onLogs(logs: any[]) {
      console.log('🟢 Mint event detected:', logs)
      const newActivities = logs
        .filter((log: any) => {
          const isMatch = log.args.user?.toLowerCase() === address?.toLowerCase()
          console.log('Mint check:', { logUser: log.args.user, currentUser: address, isMatch })
          return isMatch
        })
        .map((log: any) => ({
          id: `mint-${log.transactionHash}-${log.logIndex}`,
          type: 'mint' as const,
          title: 'Minted BTC1USD',
          description: `Deposited ${formatUnits(log.args.btcAmount || 0n, 8)} BTC`,
          amount: `+${formatUnits(log.args.tokensIssued || 0n, 8)} BTC1USD`,
          timestamp: Date.now(),
          txHash: log.transactionHash,
          icon: 'plus' as const,
          color: 'green' as const
        }))

      if (newActivities.length > 0) {
        console.log('✅ Adding mint activities:', newActivities)
        setActivities((prev) => {
          // Filter out duplicates by ID
          const existingIds = new Set(prev.map(a => a.id))
          const uniqueNew = newActivities.filter(a => !existingIds.has(a.id))
          return [...uniqueNew, ...prev].slice(0, 10)
        })
      }
    },
  })

  // Watch Redeem events
  useWatchContractEvent({
    address: CONTRACT_ADDRESSES.VAULT as `0x${string}`,
    abi: VAULT_ABI,
    eventName: 'Redeem',
    onLogs(logs: any[]) {
      console.log('🔴 Redeem event detected:', logs)
      const newActivities = logs
        .filter((log: any) => {
          const isMatch = log.args.user?.toLowerCase() === address?.toLowerCase()
          console.log('Redeem check:', { logUser: log.args.user, currentUser: address, isMatch })
          return isMatch
        })
        .map((log: any) => ({
          id: `redeem-${log.transactionHash}-${log.logIndex}`,
          type: 'redeem' as const,
          title: 'Redeemed BTC1USD',
          description: `Received ${formatUnits(log.args.btcAmount || 0n, 8)} BTC`,
          amount: `-${formatUnits(log.args.tokensRedeemed || 0n, 8)} BTC1USD`,
          timestamp: Date.now(),
          txHash: log.transactionHash,
          icon: 'minus' as const,
          color: 'red' as const
        }))

      if (newActivities.length > 0) {
        console.log('✅ Adding redeem activities:', newActivities)
        setActivities((prev) => {
          // Filter out duplicates by ID
          const existingIds = new Set(prev.map(a => a.id))
          const uniqueNew = newActivities.filter(a => !existingIds.has(a.id))
          return [...uniqueNew, ...prev].slice(0, 10)
        })
      }
    },
  })

  // Watch Claim events
  useWatchContractEvent({
    address: CONTRACT_ADDRESSES.MERKLE_DISTRIBUTOR as `0x${string}`,
    abi: DISTRIBUTOR_ABI,
    eventName: 'Claimed',
    onLogs(logs: any[]) {
      console.log('🎁 Claim event detected:', logs)
      const newActivities = logs
        .filter((log: any) => {
          const isMatch = log.args.account?.toLowerCase() === address?.toLowerCase()
          console.log('Claim check:', { logAccount: log.args.account, currentUser: address, isMatch })
          return isMatch
        })
        .map((log: any) => ({
          id: `claim-${log.transactionHash}-${log.logIndex}`,
          type: 'claim' as const,
          title: 'Claimed Rewards',
          description: `Claimed successfully`,
          amount: `+${formatUnits(log.args.amount || 0n, 8)} BTC1USD`,
          timestamp: Date.now(),
          txHash: log.transactionHash,
          icon: 'gift' as const,
          color: 'orange' as const
        }))

      if (newActivities.length > 0) {
        console.log('✅ Adding claim activities:', newActivities)
        setActivities((prev) => {
          // Filter out duplicates by ID
          const existingIds = new Set(prev.map(a => a.id))
          const uniqueNew = newActivities.filter(a => !existingIds.has(a.id))
          return [...uniqueNew, ...prev].slice(0, 10)
        })
      }
    },
  })

  // Watch Distribution events (all users)
  useWatchContractEvent({
    address: CONTRACT_ADDRESSES.WEEKLY_DISTRIBUTION as `0x${string}`,
    abi: WEEKLY_DISTRIBUTION_ABI,
    eventName: 'WeeklyDistribution',
    onLogs(logs: any[]) {
      console.log('📅 Distribution event detected:', logs)
      const newActivities = logs.map((log: any) => ({
        id: `distribution-${log.transactionHash}-${log.logIndex}`,
        type: 'distribution' as const,
        title: 'Weekly Distribution',
        description: `Distribution #${log.args.distributionId} executed`,
        amount: `${formatUnits(log.args.rewardPerToken || 0n, 18)}¢ per token`,
        timestamp: Date.now(),
        txHash: log.transactionHash,
        icon: 'calendar' as const,
        color: 'blue' as const
      }))

      if (newActivities.length > 0) {
        console.log('✅ Adding distribution activities:', newActivities)
        setActivities((prev) => {
          // Filter out duplicates by ID
          const existingIds = new Set(prev.map(a => a.id))
          const uniqueNew = newActivities.filter(a => !existingIds.has(a.id))
          return [...uniqueNew, ...prev].slice(0, 10)
        })
      }
    },
  })

  // Load initial activities from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`activities-${address}`)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // Deduplicate when loading from localStorage
        const uniqueActivities = Array.from(
          new Map(parsed.map((a: ActivityEvent) => [a.id, a])).values()
        ).slice(0, 10)
        setActivities(uniqueActivities)
      } catch (e) {
        console.error('Failed to parse saved activities:', e)
      }
    }
  }, [address])

  // Save activities to localStorage (with deduplication)
  useEffect(() => {
    if (address && activities.length > 0) {
      // Deduplicate before saving
      const uniqueActivities = Array.from(
        new Map(activities.map((a: ActivityEvent) => [a.id, a])).values()
      )
      localStorage.setItem(`activities-${address}`, JSON.stringify(uniqueActivities))
    }
  }, [activities, address])

  // Add periodic deduplication to ensure no duplicates ever persist
  useEffect(() => {
    const deduplicateInterval = setInterval(() => {
      setActivities((prev) => {
        const uniqueActivities = Array.from(
          new Map(prev.map((a) => [a.id, a])).values()
        )
        // Only update if we found duplicates
        if (uniqueActivities.length !== prev.length) {
          console.log(`🔧 Removed ${prev.length - uniqueActivities.length} duplicate activities`)
          return uniqueActivities
        }
        return prev
      })
    }, 5000) // Check every 5 seconds

    return () => clearInterval(deduplicateInterval)
  }, [])

  return { activities }
}
