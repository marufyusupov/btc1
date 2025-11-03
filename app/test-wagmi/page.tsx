"use client";

import { useAccount } from "wagmi";
import { WagmiWalletConnect } from "@/components/wagmi-wallet-connect";

export default function TestWagmiPage() {
  const { address, isConnected } = useAccount();

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Wagmi Test Page</h1>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
          {isConnected ? (
            <div className="space-y-2">
              <p className="text-green-400">Connected</p>
              <p className="text-sm text-gray-300">Address: {address}</p>
            </div>
          ) : (
            <p className="text-yellow-400">Not connected</p>
          )}
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Wallet Connection</h2>
          <WagmiWalletConnect />
        </div>
      </div>
    </div>
  );
}