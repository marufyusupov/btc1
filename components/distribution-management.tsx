"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, CheckCircle, AlertCircle, Gift } from "lucide-react"
import { formatPercentage } from "@/lib/protocol-math"

interface DistributionManagementProps {
  collateralRatio: number
  totalSupply: number
  isAdmin: boolean
}

export function DistributionManagement({ collateralRatio, totalSupply, isAdmin }: DistributionManagementProps) {
  const [isExecuting, setIsExecuting] = useState(false)

  // Calculate current reward tier
  const getRewardTier = (ratio: number) => {
    if (ratio >= 2.02) return { reward: 0.1, tier: "Maximum" }
    if (ratio >= 1.92) return { reward: 0.09, tier: "Tier 9" }
    if (ratio >= 1.82) return { reward: 0.08, tier: "Tier 8" }
    if (ratio >= 1.72) return { reward: 0.07, tier: "Tier 7" }
    if (ratio >= 1.62) return { reward: 0.06, tier: "Tier 6" }
    if (ratio >= 1.52) return { reward: 0.05, tier: "Tier 5" }
    if (ratio >= 1.42) return { reward: 0.04, tier: "Tier 4" }
    if (ratio >= 1.32) return { reward: 0.03, tier: "Tier 3" }
    if (ratio >= 1.22) return { reward: 0.02, tier: "Tier 2" }
    if (ratio >= 1.12) return { reward: 0.01, tier: "Tier 1" }
    return { reward: 0, tier: "No Reward" }
  }

  const currentTier = getRewardTier(collateralRatio)
  const canDistribute = collateralRatio >= 1.12
  const nextFriday = new Date()
  nextFriday.setDate(nextFriday.getDate() + ((5 - nextFriday.getDay() + 7) % 7))
  nextFriday.setHours(14, 0, 0, 0)

  // Empty distribution history - will be populated with real data
  const distributionHistory: any[] = []

  const executeDistribution = async () => {
    setIsExecuting(true)
    // Simulate distribution execution
    await new Promise((resolve) => setTimeout(resolve, 3000))
    setIsExecuting(false)
  }

  const totalRewardsThisWeek = totalSupply * currentTier.reward
  const protocolFees = {
    merkl: totalSupply * 0.0003, // 0.03¢ per token
    endowment: totalSupply * 0.0001, // 0.01¢ per token
    developer: totalSupply * 0.001, // 0.10¢ per token
  }

  return (
    <div className="space-y-6">
      {/* Current Distribution Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="text-card-foreground flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Next Distribution</span>
            </CardTitle>
            <CardDescription>Friday at 14:00 UTC (Jumuah)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-primary">
                  {nextFriday.toLocaleDateString()} at {nextFriday.toLocaleTimeString()}
                </div>
                <div className="text-sm text-muted-foreground">
                  {Math.ceil((nextFriday.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days remaining
                </div>
              </div>
              <Badge variant={canDistribute ? "default" : "secondary"} className="text-sm">
                {canDistribute ? "Eligible" : "Not Eligible"}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium text-card-foreground">Current Reward Tier</div>
                <div className="text-lg font-bold text-primary">{currentTier.tier}</div>
                <div className="text-sm text-muted-foreground">{currentTier.reward}¢ per token</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-card-foreground">Total Rewards</div>
                <div className="text-lg font-bold text-primary">{totalRewardsThisWeek.toLocaleString()} BTC1USD</div>
                <div className="text-sm text-muted-foreground">For {totalSupply.toLocaleString()} tokens</div>
              </div>
            </div>

            {canDistribute && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Distribution is ready! Collateral ratio is {formatPercentage(collateralRatio, 1)}, above the 112%
                  minimum.
                </AlertDescription>
              </Alert>
            )}

            {!canDistribute && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Distribution not available. Collateral ratio is {formatPercentage(collateralRatio, 1)}, below the 112%
                  minimum required.
                </AlertDescription>
              </Alert>
            )}

            {isAdmin && canDistribute && (
              <Button onClick={executeDistribution} disabled={isExecuting} className="w-full gradient-primary">
                {isExecuting ? "Executing Distribution..." : "Execute Distribution"}
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="gradient-card border-border/50">
          <CardHeader>
            <CardTitle className="text-card-foreground">Fee Breakdown</CardTitle>
            <CardDescription>Protocol fees added to holder rewards</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-card-foreground">Holder Rewards</span>
                <span className="font-medium text-primary">{totalRewardsThisWeek.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Merkl Fee</span>
                <span className="text-sm text-muted-foreground">+{protocolFees.merkl.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Endowment Fee</span>
                <span className="text-sm text-muted-foreground">+{protocolFees.endowment.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Developer Fee</span>
                <span className="text-sm text-muted-foreground">+{protocolFees.developer.toLocaleString()}</span>
              </div>
              <div className="border-t border-border pt-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-card-foreground">Total Minted</span>
                  <span className="font-bold text-primary">
                    {(
                      totalRewardsThisWeek +
                      protocolFees.merkl +
                      protocolFees.endowment +
                      protocolFees.developer
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribution History */}
      <Tabs defaultValue="history" className="w-full">
        <TabsList>
          <TabsTrigger value="history">Distribution History</TabsTrigger>
          <TabsTrigger value="tiers">Reward Tiers</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-4">
          <Card className="gradient-card border-border/50">
            <CardHeader>
              <CardTitle className="text-card-foreground">Recent Distributions</CardTitle>
              <CardDescription>Historical weekly reward distributions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {distributionHistory.length > 0 ? (
                  distributionHistory.map((distribution) => (
                    <div
                      key={distribution.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/20 border border-border/50"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Gift className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium text-card-foreground">Distribution #{distribution.id}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(distribution.date).toLocaleDateString()} at 14:00 UTC
                          </div>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="font-bold text-primary">{distribution.rewardPerToken}¢ per token</div>
                        <div className="text-sm text-muted-foreground">
                          {distribution.totalRewards.toLocaleString()} BTC1USD to{" "}
                          {distribution.participants.toLocaleString()} holders
                        </div>
                        <Badge variant="outline" className="text-xs">
                          Ratio: {formatPercentage(distribution.collateralRatio, 1)}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No distribution history available yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tiers" className="space-y-4">
          <Card className="gradient-card border-border/50">
            <CardHeader>
              <CardTitle className="text-card-foreground">Reward Tier System</CardTitle>
              <CardDescription>Rewards based on collateral ratio health</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { range: "1.12-1.21", reward: "1¢", color: "bg-red-500" },
                  { range: "1.22-1.31", reward: "2¢", color: "bg-orange-500" },
                  { range: "1.32-1.41", reward: "3¢", color: "bg-yellow-500" },
                  { range: "1.42-1.51", reward: "4¢", color: "bg-lime-500" },
                  { range: "1.52-1.61", reward: "5¢", color: "bg-green-500" },
                  { range: "1.62-1.71", reward: "6¢", color: "bg-emerald-500" },
                  { range: "1.72-1.81", reward: "7¢", color: "bg-teal-500" },
                  { range: "1.82-1.91", reward: "8¢", color: "bg-cyan-500" },
                  { range: "1.92-2.01", reward: "9¢", color: "bg-blue-500" },
                  { range: "≥ 2.02", reward: "10¢", color: "bg-purple-500" },
                ].map((tier, index) => {
                  const isCurrentTier =
                    collateralRatio >=
                      Number.parseFloat(tier.range.split("-")[0] || tier.range.replace("≥ ", "")) / 100 &&
                    (tier.range.includes("-")
                      ? collateralRatio <= Number.parseFloat(tier.range.split("-")[1]) / 100
                      : true)

                  return (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-3 rounded-lg border ${isCurrentTier ? "border-primary bg-primary/5" : "border-border/50 bg-muted/20"}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${tier.color}`}></div>
                        <div>
                          <div className="font-medium text-card-foreground">Collateral Ratio: {tier.range}%</div>
                          {isCurrentTier && <div className="text-xs text-primary">Current Tier</div>}
                        </div>
                      </div>
                      <div className="font-bold text-primary">{tier.reward} per token</div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}