"use client"

import { useWeb3 } from "@/lib/web3-provider"
import { LandingPage } from "./landing-page"
import Dashboard from "@/components/dashboard"

export default function BTC1USDDashboard() {
  const { isConnected } = useWeb3()

  // If not connected, show the landing page
  if (!isConnected) {
    return <LandingPage />
  }

  // If connected, show the dashboard
  return <Dashboard />
}
