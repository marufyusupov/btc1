"use client"

import { useEffect, useState } from "react"
import { useAccount, useReadContract } from "wagmi"
import { formatUnits } from "viem"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface BTC1USDBalanceProps {
  btc1usdAddress: string
}

// Simplified ABI for balanceOf function
const BTC1USD_ABI = [
  {
    "constant": true,
    "inputs": [
      {
        "name": "account",
        "type": "address"
      }
    ],
    "name": "balanceOf",
    "outputs": [
      {
        "name": "",
        "type": "uint256"
      }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  }
] as const

export function BTC1USDBalance({ btc1usdAddress }: BTC1USDBalanceProps) {
  const { address, isConnected } = useAccount()
  const { data, isError, isLoading } = useReadContract({
    address: btc1usdAddress as `0x${string}`,
    abi: BTC1USD_ABI,
    functionName: 'balanceOf',
    args: [address as `0x${string}`],
    query: {
      enabled: isConnected && !!address && !!btc1usdAddress
    }
  })

  const balance = data ? formatUnits(data, 8) : "0"
  const error = isError ? "Failed to fetch balance" : null
  const loading = isLoading

  return (
    <Card className="w-full max-w-sm bg-gray-800 border-gray-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium text-white flex items-center justify-between">
          BTC1 Balance
          <Badge variant="outline" className="text-xs text-orange-400 border-orange-400">
            Token
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center">
          {loading ? (
            <div className="text-2xl font-bold text-white animate-pulse">Loading...</div>
          ) : error ? (
            <div className="text-2xl font-bold text-red-400">{error}</div>
          ) : (
            <div className="text-2xl font-bold text-white">
              {parseFloat(balance).toFixed(6)} BTC1
            </div>
          )}
          <div className="text-sm text-gray-400 mt-1">Your token balance</div>
        </div>
      </CardContent>
    </Card>
  )
}