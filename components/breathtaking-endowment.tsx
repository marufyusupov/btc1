"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Heart, Calendar, Plus, ExternalLink, CheckCircle, Vote, Sparkles, TrendingUp, Users, DollarSign, Award, Zap } from "lucide-react"
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { CONTRACT_ADDRESSES } from "@/lib/contracts"

const ENDOWMENT_MANAGER_ABI = [
  "function addNonProfit(address wallet, string name, string description, string website, uint8 category) external",
  "function proposeNonProfit(address wallet, string name, string description, string website, uint8 category) external returns (uint256)",
  "function voteOnProposal(uint256 proposalId, bool support) external",
  "function executeProposal(uint256 proposalId) external",
  "function executeMonthlyDistribution() external",
]

const CATEGORIES = [
  { id: 0, name: "Humanitarian", icon: "🤝", color: "from-blue-500 to-cyan-500", glow: "shadow-blue-500/50" },
  { id: 1, name: "Zakat", icon: "🕌", color: "from-green-500 to-emerald-500", glow: "shadow-green-500/50" },
  { id: 2, name: "Development", icon: "🏗️", color: "from-purple-500 to-pink-500", glow: "shadow-purple-500/50" },
  { id: 3, name: "Poverty", icon: "🍞", color: "from-orange-500 to-red-500", glow: "shadow-orange-500/50" },
  { id: 4, name: "Education", icon: "📚", color: "from-indigo-500 to-blue-500", glow: "shadow-indigo-500/50" },
  { id: 5, name: "Healthcare", icon: "🏥", color: "from-red-500 to-pink-500", glow: "shadow-red-500/50" },
  { id: 6, name: "Environment", icon: "🌱", color: "from-emerald-500 to-green-500", glow: "shadow-emerald-500/50" },
]

interface EndowmentManagerProps {
  isAdmin: boolean
}

export function BreathtakingEndowment({ isAdmin }: EndowmentManagerProps) {
  const { address, isConnected } = useAccount()
  const { writeContract, data: hash } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const [showAddNonProfit, setShowAddNonProfit] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const [nonProfits, setNonProfits] = useState<any[]>([])
  const [proposals, setProposals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    wallet: "",
    website: "",
    category: "0",
  })

  useEffect(() => {
    loadEndowmentData()
  }, [isSuccess])

  const loadEndowmentData = async () => {
    try {
      setLoading(true)
      const [statsRes, nonprofitsRes, proposalsRes] = await Promise.all([
        fetch('/api/governance/endowment?action=stats'),
        fetch('/api/governance/endowment'),
        fetch('/api/governance/endowment?action=proposals&active=true')
      ])

      setStats(await statsRes.json())
      const nonprofits = await nonprofitsRes.json()
      setNonProfits(nonprofits.nonProfits || [])
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

    writeContract({
      address: CONTRACT_ADDRESSES.ENDOWMENT_MANAGER as `0x${string}`,
      abi: ENDOWMENT_MANAGER_ABI,
      functionName: isAdmin ? 'addNonProfit' : 'proposeNonProfit',
      args: [
        formData.wallet,
        formData.name,
        formData.description,
        formData.website,
        parseInt(formData.category)
      ]
    })

    setFormData({ name: "", description: "", wallet: "", website: "", category: "0" })
    setShowAddNonProfit(false)
  }

  return (
    <div className="space-y-6">
      {/* Animated Header with Glassmorphism */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-pink-600 to-blue-600 p-8 shadow-2xl"
      >
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>
        <div className="relative z-10">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"
          />
          <div className="flex items-center gap-4 mb-4">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="p-4 bg-white/20 backdrop-blur-md rounded-2xl"
            >
              <Heart className="w-8 h-8 text-white" />
            </motion.div>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Endowment Manager</h1>
              <p className="text-white/90 text-lg">Empowering charitable organizations worldwide</p>
            </div>
          </div>

          {/* Animated Stats Grid */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              {[
                { label: "Total Balance", value: `${stats.totalBalance || 0} BTC1USD`, icon: DollarSign, color: "from-yellow-400 to-orange-500" },
                { label: "Non-Profits", value: stats.nonProfitCount || 0, icon: Users, color: "from-blue-400 to-cyan-500" },
                { label: "Distributed", value: `${stats.totalDistributed || 0} BTC1USD`, icon: TrendingUp, color: "from-green-400 to-emerald-500" },
                { label: "Active Proposals", value: stats.activeProposals || 0, icon: Vote, color: "from-purple-400 to-pink-500" }
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="relative group"
                >
                  <div className={`absolute inset-0 bg-gradient-to-r ${stat.color} opacity-20 rounded-xl blur-xl group-hover:opacity-40 transition-opacity`}></div>
                  <div className="relative bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/80 text-sm">{stat.label}</span>
                      <stat.icon className="w-5 h-5 text-white/60" />
                    </div>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="nonprofits" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 p-1 bg-slate-900/50 backdrop-blur-sm rounded-xl">
          <TabsTrigger value="nonprofits" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500">
            <Users className="w-4 h-4 mr-2" />
            Non-Profits
          </TabsTrigger>
          <TabsTrigger value="proposals" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500">
            <Vote className="w-4 h-4 mr-2" />
            Proposals
          </TabsTrigger>
          <TabsTrigger value="distributions" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500">
            <TrendingUp className="w-4 h-4 mr-2" />
            Distributions
          </TabsTrigger>
        </TabsList>

        {/* Non-Profits Tab */}
        <TabsContent value="nonprofits" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Registered Non-Profits
            </h2>
            <Button
              onClick={() => setShowAddNonProfit(true)}
              className="relative group overflow-hidden bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            >
              <motion.div
                className="absolute inset-0 bg-white/20"
                animate={{ x: [-100, 200] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <Plus className="w-4 h-4 mr-2 relative z-10" />
              <span className="relative z-10">Add Non-Profit</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {nonProfits.map((org, index) => {
              const category = CATEGORIES[org.category] || CATEGORIES[0]
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.03, y: -5 }}
                  className="relative group"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-20 blur-xl transition-opacity rounded-2xl`}></div>
                  <Card className="relative border-2 border-white/10 bg-slate-900/50 backdrop-blur-md hover:border-white/30 transition-all">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <motion.div
                            whileHover={{ rotate: 360 }}
                            transition={{ duration: 0.5 }}
                            className={`w-12 h-12 bg-gradient-to-br ${category.color} rounded-xl flex items-center justify-center text-2xl shadow-lg ${category.glow}`}
                          >
                            {category.icon}
                          </motion.div>
                          <div>
                            <CardTitle className="text-lg">{org.name}</CardTitle>
                            <Badge className={`mt-1 bg-gradient-to-r ${category.color} border-0`}>
                              {category.name}
                            </Badge>
                          </div>
                        </div>
                        {org.verified && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring" }}
                          >
                            <CheckCircle className="w-5 h-5 text-green-400" />
                          </motion.div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-400 mb-4">{org.description}</p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Total Received</span>
                          <span className="font-semibold text-green-400">{org.totalReceived || 0} BTC1USD</span>
                        </div>
                        {org.website && (
                          <Button variant="outline" size="sm" className="w-full group" onClick={() => window.open(org.website, "_blank")}>
                            <ExternalLink className="w-3 h-3 mr-2 group-hover:translate-x-1 transition-transform" />
                            Visit Website
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </TabsContent>

        {/* Proposals Tab */}
        <TabsContent value="proposals" className="space-y-4">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Active Proposals
          </h2>
          <div className="grid gap-4">
            {proposals.map((proposal, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border-2 border-white/10 bg-slate-900/50 backdrop-blur-md hover:border-purple-500/50 transition-all">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {proposal.name}
                          <Badge variant="outline" className="text-xs">#{proposal.id}</Badge>
                        </CardTitle>
                        <CardDescription>{proposal.description}</CardDescription>
                      </div>
                      <Badge className={`${proposal.executed ? 'bg-green-500' : 'bg-yellow-500'}`}>
                        {proposal.executed ? 'Executed' : 'Active'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex-1">
                          <div className="flex justify-between mb-2">
                            <span className="text-green-400">For: {proposal.forVotes}</span>
                            <span className="text-red-400">Against: {proposal.againstVotes}</span>
                          </div>
                          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(proposal.forVotes / (proposal.forVotes + proposal.againstVotes) * 100) || 0}%` }}
                              className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                            />
                          </div>
                        </div>
                      </div>
                      {!proposal.hasVoted && isConnected && !proposal.executed && (
                        <div className="flex gap-2">
                          <Button className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Vote For
                          </Button>
                          <Button variant="outline" className="flex-1">
                            Vote Against
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* Distributions Tab */}
        <TabsContent value="distributions" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
              Distribution History
            </h2>
            {isAdmin && stats?.canDistribute && (
              <Button className="relative group overflow-hidden bg-gradient-to-r from-green-600 to-emerald-600">
                <motion.div
                  className="absolute inset-0 bg-white/20"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />
                <Calendar className="w-4 h-4 mr-2 relative z-10" />
                <span className="relative z-10">Execute Distribution</span>
              </Button>
            )}
          </div>
          <Card className="border-2 border-white/10 bg-slate-900/50 backdrop-blur-md">
            <CardContent className="p-6">
              <p className="text-center text-gray-400">Distribution history will appear here</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Non-Profit Modal */}
      <AnimatePresence>
        {showAddNonProfit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowAddNonProfit(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl"
            >
              <Card className="border-2 border-white/20 bg-slate-900 backdrop-blur-xl shadow-2xl">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    {isAdmin ? 'Add New Non-Profit' : 'Propose New Non-Profit'}
                  </CardTitle>
                  <CardDescription className="text-white/80">
                    {isAdmin ? 'Add a verified non-profit organization' : 'Submit a proposal to add a non-profit'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Organization Name *</Label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., World Food Program"
                        className="bg-slate-800 border-white/10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Wallet Address *</Label>
                      <Input
                        value={formData.wallet}
                        onChange={(e) => setFormData({ ...formData, wallet: e.target.value })}
                        placeholder="0x..."
                        className="bg-slate-800 border-white/10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Description *</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description of the organization and its mission..."
                      rows={3}
                      className="bg-slate-800 border-white/10"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Website (Optional)</Label>
                      <Input
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        placeholder="https://..."
                        className="bg-slate-800 border-white/10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Category *</Label>
                      <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                        <SelectTrigger className="bg-slate-800 border-white/10">
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
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={handleAddNonProfit}
                      disabled={isConfirming}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                    >
                      {isConfirming ? 'Confirming...' : isAdmin ? 'Add Non-Profit' : 'Submit Proposal'}
                    </Button>
                    <Button
                      onClick={() => setShowAddNonProfit(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
