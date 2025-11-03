"use client";

import { useAccount } from 'wagmi';
import { useWeb3 } from '@/lib/web3-provider';

export default function DebugProvidersPage() {
  const wagmiAccount = useAccount();
  const web3Context = useWeb3();

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-6">Debug Providers</h1>
      
      <div className="space-y-6">
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Wagmi Provider</h2>
          <div className="space-y-2">
            <p><strong>isConnected:</strong> {wagmiAccount.isConnected ? 'Yes' : 'No'}</p>
            <p><strong>address:</strong> {wagmiAccount.address || 'Not connected'}</p>
            <p><strong>address type:</strong> {typeof wagmiAccount.address}</p>
            <p><strong>address length:</strong> {wagmiAccount.address ? wagmiAccount.address.length : 0}</p>
          </div>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Custom Web3 Provider</h2>
          <div className="space-y-2">
            <p><strong>isConnected:</strong> {web3Context.isConnected ? 'Yes' : 'No'}</p>
            <p><strong>address:</strong> {web3Context.address || 'Not connected'}</p>
            <p><strong>address type:</strong> {typeof web3Context.address}</p>
            <p><strong>address length:</strong> {web3Context.address ? web3Context.address.length : 0}</p>
          </div>
        </div>
        
        {wagmiAccount.address && web3Context.address && (
          <div className="bg-yellow-900 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Comparison</h2>
            <p><strong>Addresses match:</strong> {wagmiAccount.address === web3Context.address ? 'Yes' : 'No'}</p>
            <p><strong>Lowercase match:</strong> {wagmiAccount.address?.toLowerCase() === web3Context.address?.toLowerCase() ? 'Yes' : 'No'}</p>
          </div>
        )}
      </div>
    </div>
  );
}