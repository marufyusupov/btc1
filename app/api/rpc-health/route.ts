import { NextRequest, NextResponse } from "next/server";
import { executeWithProviderFallback } from "@/lib/rpc-provider";

export async function GET(request: NextRequest) {
  try {
    console.log("Testing RPC provider health...");
    
    // Test the robust RPC provider mechanism
    const result = await executeWithProviderFallback(async (provider) => {
      try {
        // Test network detection
        const network = await provider.getNetwork();
        console.log("Network detected:", network.name, network.chainId);
        
        // Test with chainId which is faster and more reliable than fetching blocks
        const chainIdResult = await provider.send('eth_chainId', []);
        console.log("Chain ID verified:", chainIdResult);
        
        // Test block fetching (just get the latest block number)
        const blockNumber = await provider.getBlockNumber();
        console.log("Latest block:", blockNumber);
        
        return {
          success: true,
          network: {
            name: network.name,
            chainId: network.chainId,
          },
          latestBlock: blockNumber,
          chainId: chainIdResult,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        console.error("Provider test failed:", error);
        throw error;
      }
    }, 84532, { // Base Sepolia chain ID
      timeout: 15000, // Increased timeout
      maxRetries: 3,
      retryDelay: 2000,
      backoffMultiplier: 2
    });
    
    return NextResponse.json(result);
  } catch (error) {
    console.error("RPC health check failed:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: (error as Error).message,
        suggestions: [
          "Check your network connection",
          "Verify RPC configuration in environment variables",
          "Try again in a few minutes"
        ]
      },
      { status: 500 }
    );
  }
}