export const dynamic = "force-dynamic";
export const revalidate = 0; // Disable ISR

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Call the actual merkle distributions API
    const base = process.env.API_BASE_URL || 'http://localhost:3001';
    const response = await fetch(`${base}/api/merkle-distributions/latest`);
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch distribution data', status: response.status },
        { status: 500 }
      );
    }
    
    const data = await response.json();
    
    // Add debugging information
    const testAddress = process.env.NEXT_PUBLIC_ADMIN_WALLET || "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
    const debugInfo = {
      ...data,
      debug: {
        timestamp: new Date().toISOString(),
        testAddress,
        hasTestClaim: !!data.current?.claims?.[testAddress],
        claimAddresses: data.current?.claims ? Object.keys(data.current.claims) : [],
        totalClaims: data.current?.claims ? Object.keys(data.current.claims).length : 0
      }
    };
    
    return NextResponse.json(debugInfo);
  } catch (error) {
    console.error('Error in test-claims API:', error);
    return NextResponse.json(
      { error: 'Failed to test claims', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}