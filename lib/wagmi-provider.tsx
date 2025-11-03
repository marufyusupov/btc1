"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http, fallback } from "wagmi";
import { baseSepolia } from "wagmi/chains";
import { injected, coinbaseWallet } from "wagmi/connectors";
import React, { ReactNode, useState, useEffect } from "react";
import type { Config } from "wagmi";

// WalletConnect Project ID
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";

// Create a react-query client once
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

// Create a single config instance with all connectors
const createWagmiConfig = () => {
  // Only add WalletConnect if we have a valid project ID
  const hasWalletConnect = !!projectId && typeof window !== "undefined";

  const connectors = [
    injected({
      shimDisconnect: true,
    }),
    coinbaseWallet({
      appName: "BTC1USD Protocol",
      appLogoUrl: "https://btc1usd.com/icon.png",
    }),
  ];

  // Dynamically add WalletConnect if available
  if (hasWalletConnect) {
    try {
      const { walletConnect } = require("wagmi/connectors");
      connectors.push(
        walletConnect({
          projectId,
          showQrModal: true,
          metadata: {
            name: "BTC1USD Protocol",
            description: "Shariah-compliant Bitcoin-backed coin",
            url:
              typeof window !== "undefined"
                ? window.location.origin
                : "https://btc1usd.com",
            icons: [
              typeof window !== "undefined"
                ? `${window.location.origin}/icon.png`
                : "https://btc1usd.com/icon.png",
            ],
          },
          qrModalOptions: {
            themeMode: "dark",
          },
          disableProviderPing: true,
        })
      );
    } catch (error) {
      console.warn("WalletConnect initialization failed:", error);
    }
  }

  // Get RPC URLs from environment with Alchemy as primary
  const alchemyApiKey = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY || process.env.ALCHEMY_API_KEY;
  const rpcUrls = process.env.NEXT_PUBLIC_RPC_URL?.split(',').map(url => url.trim()).filter(Boolean) || [];

  // Build transport chain with Alchemy first (if available), then fallbacks
  const transportUrls: string[] = [];

  if (alchemyApiKey) {
    transportUrls.push(`https://base-sepolia.g.alchemy.com/v2/${alchemyApiKey}`);
  }

  // Add configured fallback URLs
  transportUrls.push(...rpcUrls);

  // Add additional public fallbacks as last resort
  const publicFallbacks = [
    'https://base-sepolia.blockpi.network/v1/rpc/public',
    'https://base-sepolia.publicnode.com',
  ];

  publicFallbacks.forEach(url => {
    if (!transportUrls.includes(url)) {
      transportUrls.push(url);
    }
  });

  // Create http transports for each URL
  const transports = transportUrls.map(url =>
    http(url, {
      retryCount: 2,
      retryDelay: 500,
      timeout: 10000,
    })
  );

  // Use fallback transport to automatically switch between RPC providers
  const transport = transports.length > 1 ? fallback(transports) : transports[0];

  console.log(`🌐 Wagmi configured with ${transportUrls.length} RPC endpoint(s):`);
  console.log(`   Primary: ${transportUrls[0]}`);
  if (transportUrls.length > 1) {
    console.log(`   Fallbacks: ${transportUrls.slice(1).join(', ')}`);
  }

  return createConfig({
    chains: [baseSepolia],
    transports: {
      [baseSepolia.id]: transport,
    },
    connectors,
    ssr: true,
    // Enable automatic reconnection
    multiInjectedProviderDiscovery: true,
    batch: {
      multicall: {
        wait: 100,
      },
    },
  });
};

// Create config once
let wagmiConfig: Config | null = null;

function getWagmiConfig() {
  if (!wagmiConfig) {
    wagmiConfig = createWagmiConfig();
  }
  return wagmiConfig;
}

export function WagmiProviderComponent({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [config, setConfig] = useState<Config | null>(null);

  useEffect(() => {
    setMounted(true);
    setConfig(getWagmiConfig());
  }, []);

  // Don't render children until mounted to avoid hydration issues
  if (!mounted || !config) {
    return null;
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}