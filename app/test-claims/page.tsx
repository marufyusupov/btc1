"use client";

import { useState, useEffect } from 'react';
import EnhancedMerkleClaim from '@/components/enhanced-merkle-claim';

export default function TestClaimsPage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    console.log('=== Test Claims Page Mounted ===');
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-6">Test Claims Page</h1>
      <p className="mb-4">This page is for testing the EnhancedMerkleClaim component.</p>
      
      {isClient ? (
        <div>
          <h2 className="text-xl font-semibold mb-4">Enhanced Merkle Claim Component:</h2>
          <EnhancedMerkleClaim />
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}