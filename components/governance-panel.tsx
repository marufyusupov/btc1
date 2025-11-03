"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Vote, Users, CheckCircle, XCircle, AlertTriangle, Plus } from "lucide-react"
import { EnhancedGovernancePanel } from "@/components/enhanced-governance-panel"

interface GovernancePanelProps {
  isAdmin: boolean
  userBalance: number
  userAddress?: string
}

export function GovernancePanel({ isAdmin, userBalance, userAddress }: GovernancePanelProps) {
  // Use the enhanced governance panel instead of the basic one
  return (
    <EnhancedGovernancePanel 
      isAdmin={isAdmin} 
      userBalance={userBalance} 
      userAddress={userAddress} 
    />
  )
}
