"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { WagmiWalletConnect } from "@/components/wagmi-wallet-connect";
import { WalletManagement } from "@/components/wallet-management";

export default function TestWalletsPage() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<'dev' | 'endowment'>('dev');

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Wallet Management Test Page</h1>
        
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

        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Wallet Connection</h2>
          <WagmiWalletConnect />
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Wallet Management</h2>
          
          <div className="flex space-x-4 mb-6">
            <button
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'dev' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              onClick={() => setActiveTab('dev')}
            >
              Development Wallets
            </button>
            <button
              className={`px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'endowment' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              onClick={() => setActiveTab('endowment')}
            >
              Endowment Wallets
            </button>
          </div>
          
          <WalletManagement walletType={activeTab} />
        </div>
      </div>
    </div>
  );
}