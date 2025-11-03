"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Heart, Calendar, Plus, ExternalLink, CheckCircle, Vote } from "lucide-react"
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { CONTRACT_ADDRESSES } from "@/lib/contracts"
import { ethers } from "ethers"

const ENDOWMENT_MANAGER_ABI = [
  "function addNonProfit(address wallet, string name, string description, string website, uint8 category) external",
  "function proposeNonProfit(address wallet, string name, string description, string website, uint8 category) external returns (uint256)",
  "function voteOnProposal(uint256 proposalId, bool support) external",
  "function executeProposal(uint256 proposalId) external",
  "function executeMonthlyDistribution() external",
]

const CATEGORIES = [
  { id: 0, name: "Humanitarian", icon: "🤝", color: "bg-blue-500" },
  { id: 1, name: "Zakat", icon: "🕌", color: "bg-green-500" },
  { id: 2, name: "Development", icon: "🏗️", color: "bg-purple-500" },
  { id: 3, name: "Poverty", icon: "🍞", color: "bg-orange-500" },
  { id: 4, name: "Education", icon: "📚", color: "bg-indigo-500" },
  { id: 5, name: "Healthcare", icon: "🏥", color: "bg-red-500" },
  { id: 6, name: "Environment", icon: "🌱", color: "bg-emerald-500" },
]

interface EndowmentManagerProps {
  isAdmin: boolean
}

export function EndowmentManager({ isAdmin }: EndowmentManagerProps) {
  const { address, isConnected } = useAccount()
  const { writeContract, data: hash } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const [showAddNonProfit, setShowAddNonProfit] = useState(false)
  const [showProposeNonProfit, setShowProposeNonProfit] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const [nonProfits, setNonProfits] = useState<any[]>([])
  const [distributions, setDistributions] = useState<any[]>([])
  const [proposals, setProposals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    wallet: "",
    website: "",
    category: "0",
  })

  // Load data
  useEffect(() => {
    loadEndowmentData()
  }, [isSuccess])

  const loadEndowmentData = async () => {
    try {
      setLoading(true)

      // Load stats
      const statsRes = await fetch('/api/governance/endowment?action=stats')
      const statsData = await statsRes.json()
      setStats(statsData)

      // Load non-profits
      const nonprofitsRes = await fetch('/api/governance/endowment')
      const nonprofitsData = await nonprofitsRes.json()
      setNonProfits(nonprofitsData.nonProfits || [])

      // Load distributions
      const distRes = await fetch('/api/governance/endowment?action=distributions&limit=10')
      const distData = await distRes.json()
      setDistributions(distData.distributions || [])

      // Load proposals
      const proposalsRes = await fetch('/api/governance/endowment?action=proposals&active=true')
      const proposalsData = await proposalsRes.json()
      setProposals(proposalsData.proposals || [])

      setLoading(false)
    } catch (error) {
      console.error("Error loading endowment data:", error)
      setLoading(false)
    }
  }

  const handleAddNonProfit = () => {
    if (!formData.name || !formData.wallet || !formData.description) {
      alert("Please fill all required fields")
      return
    }

    if (!ethers.isAddress(formData.wallet)) {
      alert("Invalid wallet address")
      return
    }

    try {
      writeContract({
        address: CONTRACT_ADDRESSES.ENDOWMENT_MANAGER as `0x${string}`,
        abi: ENDOWMENT_MANAGER_ABI,
        functionName: 'addNonProfit',
        args: [
          formData.wallet,
          formData.name,
          formData.description,
          formData.website || "",
          parseInt(formData.category)
        ],
      })

      setShowAddNonProfit(false)
      resetForm()
    } catch (error) {
      console.error("Error adding non-profit:", error)
      alert("Failed to add non-profit: " + (error?.message || error))
    }
  }

  const handleProposeNonProfit = () => {
    if (!formData.name || !formData.wallet || !formData.description) {
      alert("Please fill all required fields")
      return
    }

    if (!ethers.isAddress(formData.wallet)) {
      alert("Invalid wallet address")
      return
    }

    try {
      writeContract({
        address: CONTRACT_ADDRESSES.ENDOWMENT_MANAGER as `0x${string}`,
        abi: ENDOWMENT_MANAGER_ABI,
        functionName: 'proposeNonProfit',
        args: [
          formData.wallet,
          formData.name,
          formData.description,
          formData.website || "",
          parseInt(formData.category)
        ],
      })

      setShowProposeNonProfit(false)
      resetForm()
    } catch (error) {
      console.error("Error proposing non-profit:", error)
      alert("Failed to propose non-profit: " + (error?.message || error))
    }
  }

  const handleVoteOnProposal = (proposalId: number, support: boolean) => {
    try {
      writeContract({
        address: CONTRACT_ADDRESSES.ENDOWMENT_MANAGER as `0x${string}`,
        abi: ENDOWMENT_MANAGER_ABI,
        functionName: 'voteOnProposal',
        args: [BigInt(proposalId), support],
      })
    } catch (error) {
      console.error("Error voting:", error)
      alert("Failed to vote: " + (error?.message || error))
    }
  }

  const handleExecuteDistribution = () => {
    if (!confirm("Execute monthly distribution to all approved non-profits?")) return

    try {
      writeContract({
        address: CONTRACT_ADDRESSES.ENDOWMENT_MANAGER as `0x${string}`,
        abi: ENDOWMENT_MANAGER_ABI,
        functionName: 'executeMonthlyDistribution',
      })
    } catch (error) {
      console.error("Error executing distribution:", error)
      alert("Failed to execute distribution: " + (error?.message || error))
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      wallet: "",
      website: "",
      category: "0",
    })
  }

  const getCategoryById = (id: number) => CATEGORIES.find(c => c.id === id) || CATEGORIES[0]

  if (loading) {
    return <div className="text-center py-12">Loading endowment data...</div>
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="gradient-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{parseFloat(stats?.balance || 0).toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">BTC1USD</div>
          </CardContent>
        </Card>

        <Card className="gradient-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Distributed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-3">{parseFloat(stats?.totalDistributed || 0).toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">BTC1USD</div>
          </CardContent>
        </Card>

        <Card className="gradient-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Non-Profits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-4">{stats?.activeNonProfits || 0}</div>
            <div className="text-xs text-muted-foreground">Organizations</div>
          </CardContent>
        </Card>

        <Card className="gradient-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Distributions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-chart-2">{stats?.distributionCount || 0}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </CardContent>
        </Card>

        <Card className="gradient-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Next Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold text-primary">
              {stats?.nextDistribution
                ? new Date(stats.nextDistribution * 1000).toLocaleDateString()
                : "Not set"}
            </div>
            <div className="text-xs text-muted-foreground">
              {stats?.canDistribute ? "✅ Ready" : "⏳ Pending"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Interface */}
      <Tabs defaultValue="nonprofits" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="nonprofits">Non-Profits ({nonProfits.length})</TabsTrigger>
            <TabsTrigger value="proposals">Proposals ({proposals.length})</TabsTrigger>
            <TabsTrigger value="distributions">Distributions</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            {isAdmin && stats?.canDistribute && (
              <Button
                onClick={handleExecuteDistribution}
                className="gradient-primary"
                disabled={!isConnected || isConfirming}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Execute Distribution
              </Button>
            )}
            {isAdmin ? (
              <Button
                onClick={() => setShowAddNonProfit(true)}
                className="gradient-primary"
                disabled={!isConnected}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Non-Profit
              </Button>
            ) : (
              <Button
                onClick={() => setShowProposeNonProfit(true)}
                className="gradient-primary"
                disabled={!isConnected}
              >
                <Vote className="w-4 h-4 mr-2" />
                Propose Non-Profit
              </Button>
            )}
          </div>
        </div>

        {/* Non-Profits Tab */}
        <TabsContent value="nonprofits" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {nonProfits.map((org, idx) => {
              const category = getCategoryById(org.categoryId)
              return (
                <Card key={idx} className="gradient-card border-border/50">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{category.icon}</span>
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {org.name}
                            {org.verified && <CheckCircle className="w-4 h-4 text-green-500" />}
                          </CardTitle>
                          <CardDescription>{org.description}</CardDescription>
                        </div>
                      </div>
                      <Badge className={`${category.color} text-white`}>{category.name}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Total Received</div>
                        <div className="font-bold text-primary">{parseFloat(org.totalReceived || 0).toLocaleString()} BTC1USD</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Weight</div>
                        <div className="font-medium">{org.allocationWeight / 100}x</div>
                      </div>
                    </div>
                    <div className="text-xs font-mono bg-muted/20 p-2 rounded border break-all">
                      {org.wallet}
                    </div>
                    {org.website && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(org.website, "_blank")}
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Website
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )
            })}
            {nonProfits.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                No non-profit organizations registered yet
              </div>
            )}
          </div>
        </TabsContent>

        {/* Proposals Tab */}
        <TabsContent value="proposals" className="space-y-4">
          {proposals.map((proposal) => {
            const category = getCategoryById(proposal.categoryId)
            const totalVotes = parseFloat(proposal.votesFor) + parseFloat(proposal.votesAgainst)
            const forPercent = totalVotes > 0 ? (parseFloat(proposal.votesFor) / totalVotes) * 100 : 0
            const votingEnded = Date.now() > proposal.votingDeadline * 1000

            return (
              <Card key={proposal.id} className="gradient-card border-border/50">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{category.icon}</span>
                      <div>
                        <CardTitle>{proposal.name}</CardTitle>
                        <CardDescription>{proposal.description}</CardDescription>
                      </div>
                    </div>
                    <Badge className={votingEnded ? "bg-gray-500" : "bg-green-500"}>
                      {votingEnded ? "Ended" : "Active"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">For Votes</div>
                      <div className="font-bold text-green-600">{parseFloat(proposal.votesFor).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Against Votes</div>
                      <div className="font-bold text-red-600">{parseFloat(proposal.votesAgainst).toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{forPercent.toFixed(1)}% FOR</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${forPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Voting ends: {new Date(proposal.votingDeadline * 1000).toLocaleString()}
                  </div>

                  {!votingEnded && isConnected && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleVoteOnProposal(proposal.id, true)}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        disabled={isConfirming}
                      >
                        Vote FOR
                      </Button>
                      <Button
                        onClick={() => handleVoteOnProposal(proposal.id, false)}
                        className="flex-1 bg-red-600 hover:bg-red-700"
                        disabled={isConfirming}
                      >
                        Vote AGAINST
                      </Button>
                    </div>
                  )}

                  {votingEnded && !proposal.executed && (
                    <Button
                      onClick={() => {
                        try {
                          writeContract({
                            address: CONTRACT_ADDRESSES.ENDOWMENT_MANAGER as `0x${string}`,
                            abi: ENDOWMENT_MANAGER_ABI,
                            functionName: 'executeProposal',
                            args: [BigInt(proposal.id)],
                          })
                        } catch (error) {
                          alert("Failed to execute proposal")
                        }
                      }}
                      className="w-full"
                      disabled={!isConnected || isConfirming}
                    >
                      Execute Proposal
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
          {proposals.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No active proposals
            </div>
          )}
        </TabsContent>

        {/* Distributions Tab */}
        <TabsContent value="distributions" className="space-y-4">
          {distributions.map((dist) => (
            <Card key={dist.id} className="gradient-card border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Heart className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">
                        Distribution #{dist.id}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(dist.timestamp * 1000).toLocaleDateString()} • {dist.recipientCount} recipients
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-primary text-xl">
                      {parseFloat(dist.amount).toLocaleString()} BTC1USD
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {(parseFloat(dist.amount) / dist.recipientCount).toFixed(2)} per org
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {distributions.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No distributions yet
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Non-Profit Modal (Admin) */}
      {showAddNonProfit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl gradient-card border-border/50">
            <CardHeader>
              <CardTitle>Add New Non-Profit (Admin)</CardTitle>
              <CardDescription>Directly add a non-profit organization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Organization Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., Red Cross International"
                />
              </div>
              <div>
                <Label>Description *</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Brief description of the organization"
                  rows={3}
                />
              </div>
              <div>
                <Label>Wallet Address *</Label>
                <Input
                  value={formData.wallet}
                  onChange={(e) => setFormData({...formData, wallet: e.target.value})}
                  placeholder="0x..."
                />
              </div>
              <div>
                <Label>Website</Label>
                <Input
                  value={formData.website}
                  onChange={(e) => setFormData({...formData, website: e.target.value})}
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label>Category *</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.icon} {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => { setShowAddNonProfit(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAddNonProfit}
                  className="gradient-primary"
                  disabled={isConfirming}
                >
                  {isConfirming ? "Adding..." : "Add Organization"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Propose Non-Profit Modal (Users) */}
      {showProposeNonProfit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl gradient-card border-border/50">
            <CardHeader>
              <CardTitle>Propose New Non-Profit</CardTitle>
              <CardDescription>
                Submit a proposal to add a new organization (requires 1,000 BTC1USD)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Organization Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., Doctors Without Borders"
                />
              </div>
              <div>
                <Label>Description *</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Brief description"
                  rows={3}
                />
              </div>
              <div>
                <Label>Wallet Address *</Label>
                <Input
                  value={formData.wallet}
                  onChange={(e) => setFormData({...formData, wallet: e.target.value})}
                  placeholder="0x..."
                />
              </div>
              <div>
                <Label>Website</Label>
                <Input
                  value={formData.website}
                  onChange={(e) => setFormData({...formData, website: e.target.value})}
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label>Category *</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.icon} {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => { setShowProposeNonProfit(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button
                  onClick={handleProposeNonProfit}
                  className="gradient-primary"
                  disabled={isConfirming}
                >
                  {isConfirming ? "Submitting..." : "Submit Proposal"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
