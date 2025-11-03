"use client"

import { WagmiWalletConnect } from "@/components/wagmi-wallet-connect"
export * from "@/components/wagmi-wallet-connect"

interface WalletConnectProps {
  isConnected: boolean
  account: string
  balance: number
  onConnect: () => void
  onDisconnect: () => void
}

// This component is now a wrapper that uses the new Wagmi-based implementation
export function WalletConnect({ isConnected, account, balance, onConnect, onDisconnect }: WalletConnectProps) {
  // For backward compatibility, we're still exporting this component
  // But in practice, we should use WagmiWalletConnect directly
  return (
    <div className="w-full max-w-sm">
      <WagmiWalletConnect />
    </div>
  )
}
