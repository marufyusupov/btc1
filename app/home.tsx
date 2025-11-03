"use client"

import { LandingPage } from "@/app/landing-page"
import { useWeb3 } from "@/lib/web3-provider"

export default function HomePage() {
  const { isConnected } = useWeb3()
  
  // If user is connected, redirect to dashboard
  if (isConnected) {
    window.location.href = "/"
    return null
  }
  
  return <LandingPage />
}