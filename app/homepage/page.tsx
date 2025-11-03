"use client"

import { useEffect } from "react"
import { useWeb3 } from "@/lib/web3-provider"

export default function HomePage() {
  const { isConnected } = useWeb3()
  
  // If user is connected, redirect to dashboard
  useEffect(() => {
    if (isConnected) {
      window.location.href = "/"
    }
  }, [isConnected])
  
  // Render nothing while checking connection status
  // The redirect will happen if the user is connected
  return null
}