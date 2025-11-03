"use client";

import { useAccount } from 'wagmi';
import { useEffect, useState } from 'react';

export default function DebugWagmiPage() {
  const { address, isConnected, isConnecting, isReconnecting } = useAccount();
  const [apiData, setApiData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('=== Wagmi Account Debug ===');
    console.log('isConnected:', isConnected);
    console.log('isConnecting:', isConnecting);
    console.log('isReconnecting:', isReconnecting);
    console.log('address:', address);
  }, [isConnected, isConnecting, isReconnecting, address]);

  const fetchApiData = async () => {
    setLoading(true);
    try {
      console.log('Fetching API data...');
      const response = await fetch('/api/merkle-distributions/latest');
      console.log('API response status:', response.status);
      const data = await response.json();
      console.log('API data:', data);
      setApiData(data);
    } catch (error) {
      console.error('API fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-6">Debug Wagmi</h1>
      
      <div className="space-y-6">
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Account Status</h2>
          <div className="space-y-2">
            <p><strong>isConnected:</strong> {isConnected ? 'Yes' : 'No'}</p>
            <p><strong>isConnecting:</strong> {isConnecting ? 'Yes' : 'No'}</p>
            <p><strong>isReconnecting:</strong> {isReconnecting ? 'Yes' : 'No'}</p>
            <p><strong>address:</strong> {address || 'Not connected'}</p>
            <p><strong>address type:</strong> {typeof address}</p>
            <p><strong>address length:</strong> {address ? address.length : 0}</p>
          </div>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">API Test</h2>
          <button 
            onClick={fetchApiData}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Fetch API Data'}
          </button>
          
          {apiData && (
            <div className="mt-4">
              <h3 className="font-medium mb-2">API Response:</h3>
              <pre className="bg-gray-700 p-2 rounded text-sm overflow-auto max-h-96">
                {JSON.stringify(apiData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}