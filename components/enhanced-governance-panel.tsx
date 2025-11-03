"use client"

import { useState, useEffect } from "react"
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
import {
  Vote,
  Users,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Plus,
  Clock,
  Trophy,
  TrendingUp,
  Calendar,
  Coins,
  Target
} from "lucide-react"
import { formatUnits } from "viem"

// Types for DAO data
interface Proposal {
  id: string
  title: string
  description: string
  proposer: string
  status: "pending" | "active" | "canceled" | "defeated" | "succeeded" | "queued" | "expired" | "executed"
  category: "parameter" | "emergency" | "upgrade" | "treasury" | "governance"
  votesFor: number
  votesAgainst: number
  votesAbstain: number
  totalVotes: number
  quorum: number
  startTime: string
  endTime: string
  eta?: string
  executed: boolean
}

interface GovernanceStats {
  totalProposals: number
  activeProposals: number
  totalVoters: number
  participationRate: number
  averageVotingPower: number
  totalDelegatedVotes: number
  quorumThreshold: number
}

interface VotingHistory {
  proposalId: string
  proposalTitle: string
  vote: "for" | "against" | "abstain"
  votes: number
  date: string
}

interface DelegateInfo {
  delegate: string
  votingPower: number
  delegatedVotes: number
}

interface GovernancePanelProps {
  isAdmin: boolean
  userBalance: number
  userAddress?: string
}

export function EnhancedGovernancePanel({ isAdmin, userBalance, userAddress }: GovernancePanelProps) {
  const [selectedProposal, setSelectedProposal] = useState<string | null>(null)
  const [showCreateProposal, setShowCreateProposal] = useState(false)
  const [showDelegate, setShowDelegate] = useState(false)
  const [delegateAddress, setDelegateAddress] = useState("")
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [governanceStats, setGovernanceStats] = useState<GovernanceStats>({
    totalProposals: 24,
    activeProposals: 3,
    totalVoters: 1247,
    participationRate: 68.5,
    averageVotingPower: 15420,
    totalDelegatedVotes: 875632,
    quorumThreshold: 250000
  })
  const [votingHistory, setVotingHistory] = useState<VotingHistory[]>([])
  const [delegateInfo, setDelegateInfo] = useState<DelegateInfo>({
    delegate: "0x742d35Cc6634C0532925a3b8D91D0a3f0d4e1c56",
    votingPower: 24500,
    delegatedVotes: 15600
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statsError, setStatsError] = useState<boolean>(false)

  // Simulate data fetching
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setStatsError(false)

        // Simulate API calls
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Mock proposals data
        const mockProposals: Proposal[] = [
          {
            id: "24",
            title: "Increase Collateral Ratio to 125%",
            description: "Proposal to increase the minimum collateral ratio from 110% to 125% to improve protocol safety during market volatility.",
            proposer: "0x742d35Cc6634C0532925a3b8D91D0a3f0d4e1c56",
            status: "active",
            category: "parameter",
            votesFor: 187500,
            votesAgainst: 42300,
            votesAbstain: 12400,
            totalVotes: 242200,
            quorum: 250000,
            startTime: "2025-10-01T10:00:00Z",
            endTime: "2025-10-08T10:00:00Z",
            executed: false
          },
          {
            id: "23",
            title: "Add cbBTC as Collateral Asset",
            description: "Proposal to add Coinbase's cbBTC as an additional collateral asset to diversify the protocol's collateral base.",
            proposer: "0x3f4E0668C20E100d7C2a950455355eD614331b3f",
            status: "succeeded",
            category: "parameter",
            votesFor: 312450,
            votesAgainst: 87650,
            votesAbstain: 24500,
            totalVotes: 424600,
            quorum: 250000,
            startTime: "2025-09-20T14:30:00Z",
            endTime: "2025-09-27T14:30:00Z",
            eta: "2025-10-05T14:30:00Z",
            executed: false
          },
          {
            id: "22",
            title: "Reduce Minting Fee to 0.5%",
            description: "Proposal to reduce the minting fee from 1% to 0.5% to increase user adoption and protocol competitiveness.",
            proposer: "0x9d4E1d4E1d4E1d4E1d4E1d4E1d4E1d4E1d4E1d4E",
            status: "executed",
            category: "parameter",
            votesFor: 276800,
            votesAgainst: 156300,
            votesAbstain: 18700,
            totalVotes: 451800,
            quorum: 250000,
            startTime: "2025-09-10T09:15:00Z",
            endTime: "2025-09-17T09:15:00Z",
            executed: true
          }
        ]
        
        // Mock voting history
        const mockVotingHistory: VotingHistory[] = [
          {
            proposalId: "24",
            proposalTitle: "Increase Collateral Ratio to 125%",
            vote: "for",
            votes: 15420,
            date: "2025-10-02T14:30:00Z"
          },
          {
            proposalId: "23",
            proposalTitle: "Add cbBTC as Collateral Asset",
            vote: "for",
            votes: 15420,
            date: "2025-09-22T11:45:00Z"
          },
          {
            proposalId: "22",
            proposalTitle: "Reduce Minting Fee to 0.5%",
            vote: "against",
            votes: 15420,
            date: "2025-09-12T16:20:00Z"
          }
        ]
        
        setProposals(mockProposals)
        setVotingHistory(mockVotingHistory)
      } catch (err) {
        setError("Failed to load governance data")
        setStatsError(true)
        console.error("Error fetching governance data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-blue-500"
      case "pending":
        return "bg-yellow-500"
      case "succeeded":
      case "executed":
        return "bg-green-500"
      case "defeated":
      case "canceled":
        return "bg-red-500"
      case "queued":
        return "bg-purple-500"
      default:
        return "bg-gray-500"
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "parameter":
        return "⚙️"
      case "emergency":
        return "🚨"
      case "upgrade":
        return "⬆️"
      case "treasury":
        return "💰"
      case "governance":
        return "🏛️"
      default:
        return "📋"
    }
  }

  const votingPower = Math.floor(userBalance / 100) // 1 vote per 100 BTC1USD

  const handleVote = (proposalId: string, support: 0 | 1 | 2) => {
    // In a real implementation, this would call the DAO contract
    console.log(`Voting ${support === 0 ? 'against' : support === 1 ? 'for' : 'abstain'} on proposal ${proposalId}`)
    
    // Update local state to reflect the vote
    setProposals(prev => prev.map(proposal => {
      if (proposal.id === proposalId) {
        if (support === 0) {
          return { ...proposal, votesAgainst: proposal.votesAgainst + votingPower }
        } else if (support === 1) {
          return { ...proposal, votesFor: proposal.votesFor + votingPower }
        } else {
          return { ...proposal, votesAbstain: proposal.votesAbstain + votingPower }
        }
      }
      return proposal
    }))
    
    // Add to voting history
    const proposal = proposals.find(p => p.id === proposalId)
    if (proposal) {
      setVotingHistory(prev => [
        {
          proposalId,
          proposalTitle: proposal.title,
          vote: support === 0 ? "against" : support === 1 ? "for" : "abstain",
          votes: votingPower,
          date: new Date().toISOString()
        },
        ...prev
      ])
    }
  }

  const handleDelegate = () => {
    // In a real implementation, this would call the DAO contract
    console.log(`Delegating votes to ${delegateAddress}`)
    setDelegateInfo({
      delegate: delegateAddress,
      votingPower: delegateInfo.votingPower,
      delegatedVotes: delegateInfo.delegatedVotes + votingPower
    })
    setShowDelegate(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-6 space-y-3 sm:space-y-4 md:space-y-6 w-full">
      {/* Header Section */}
      <div className="mb-3 sm:mb-4 md:mb-6 lg:mb-8">
        <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-1.5 md:mb-2">Vote Dashboard</h1>
        <p className="text-xs sm:text-sm md:text-base text-gray-400 leading-tight sm:leading-normal">Participate in protocol governance and shape the future of BTC1USD</p>
      </div>

      {/* Governance Stats - Enhanced like Treasury */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4 md:mb-6">
        <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden flex flex-col h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 sm:pb-2 md:pb-3 px-2 xs:px-3 sm:px-4 md:px-6 pt-2 xs:pt-3 sm:pt-4 md:pt-6 flex-shrink-0">
            <CardTitle className="text-[9px] xs:text-[10px] sm:text-xs md:text-sm font-medium text-gray-300 truncate pr-1 xs:pr-2">
              Total Proposals
            </CardTitle>
            <div className="w-6 h-6 xs:w-7 xs:h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shrink-0">
              <Trophy className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-white" />
            </div>
          </CardHeader>
          <CardContent className="px-2 xs:px-3 sm:px-4 md:px-6 pb-2 xs:pb-3 sm:pb-4 md:pb-6 flex-grow flex flex-col justify-between">
            <div className="text-base xs:text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-0.5 sm:mb-1 break-all flex-grow flex items-center justify-center">
              {statsError ? (
                <span className="text-red-400 text-[10px] xs:text-sm sm:text-base md:text-xl lg:text-2xl">Error</span>
              ) : (
                governanceStats?.totalProposals ?? 0
              )}
            </div>
            <p className="text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs text-gray-400 mt-0.5 sm:mt-1 truncate">All-time proposals</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden flex flex-col h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 sm:pb-2 md:pb-3 px-2 xs:px-3 sm:px-4 md:px-6 pt-2 xs:pt-3 sm:pt-4 md:pt-6 flex-shrink-0">
            <CardTitle className="text-[9px] xs:text-[10px] sm:text-xs md:text-sm font-medium text-gray-300 truncate pr-1 xs:pr-2">
              Active Proposals
            </CardTitle>
            <div className="w-6 h-6 xs:w-7 xs:h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shrink-0">
              <Clock className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-white" />
            </div>
          </CardHeader>
          <CardContent className="px-2 xs:px-3 sm:px-4 md:px-6 pb-2 xs:pb-3 sm:pb-4 md:pb-6 flex-grow flex flex-col justify-between">
            <div className="text-base xs:text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-0.5 sm:mb-1 break-all flex-grow flex items-center justify-center">
              {statsError ? (
                <span className="text-red-400 text-[10px] xs:text-sm sm:text-base md:text-xl lg:text-2xl">Error</span>
              ) : (
                governanceStats?.activeProposals ?? 0
              )}
            </div>
            <p className="text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs text-gray-400 mt-0.5 sm:mt-1 truncate">Currently voting</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden flex flex-col h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 sm:pb-2 md:pb-3 px-2 xs:px-3 sm:px-4 md:px-6 pt-2 xs:pt-3 sm:pt-4 md:pt-6 flex-shrink-0">
            <CardTitle className="text-[9px] xs:text-[10px] sm:text-xs md:text-sm font-medium text-gray-300 truncate pr-1 xs:pr-2">
              Total Voters
            </CardTitle>
            <div className="w-6 h-6 xs:w-7 xs:h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center shadow-lg shrink-0">
              <Users className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-white" />
            </div>
          </CardHeader>
          <CardContent className="px-2 xs:px-3 sm:px-4 md:px-6 pb-2 xs:pb-3 sm:pb-4 md:pb-6 flex-grow flex flex-col justify-between">
            <div className="text-base xs:text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-0.5 sm:mb-1 break-all flex-grow flex items-center justify-center">
              {statsError ? (
                <span className="text-red-400 text-[10px] xs:text-sm sm:text-base md:text-xl lg:text-2xl">Error</span>
              ) : (
                (governanceStats?.totalVoters ?? 0).toLocaleString()
              )}
            </div>
            <p className="text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs text-gray-400 mt-0.5 sm:mt-1 truncate">Participants</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden flex flex-col h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 sm:pb-2 md:pb-3 px-2 xs:px-3 sm:px-4 md:px-6 pt-2 xs:pt-3 sm:pt-4 md:pt-6 flex-shrink-0">
            <CardTitle className="text-[9px] xs:text-[10px] sm:text-xs md:text-sm font-medium text-gray-300 truncate pr-1 xs:pr-2">
              Your Voting Power
            </CardTitle>
            <div className="w-6 h-6 xs:w-7 xs:h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg shrink-0">
              <Vote className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-white" />
            </div>
          </CardHeader>
          <CardContent className="px-2 xs:px-3 sm:px-4 md:px-6 pb-2 xs:pb-3 sm:pb-4 md:pb-6 flex-grow flex flex-col justify-between">
            <div className="text-base xs:text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-0.5 sm:mb-1 break-all flex-grow flex items-center justify-center">
              {statsError ? (
                <span className="text-red-400 text-[10px] xs:text-sm sm:text-base md:text-xl lg:text-2xl">Error</span>
              ) : (
                (votingPower ?? 0).toLocaleString()
              )}
            </div>
            <p className="text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs text-gray-400 mt-0.5 sm:mt-1 truncate">Votes available</p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Governance Stats Row */}
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
        <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 sm:pb-2 md:pb-3 px-2 xs:px-3 sm:px-4 md:px-6 pt-2 xs:pt-3 sm:pt-4 md:pt-6 flex-shrink-0">
            <CardTitle className="text-[9px] xs:text-[10px] sm:text-xs md:text-sm font-medium text-gray-300 truncate pr-1 xs:pr-2">
              Participation Rate
            </CardTitle>
            <div className="w-6 h-6 xs:w-7 xs:h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-lg shrink-0">
              <TrendingUp className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-white" />
            </div>
          </CardHeader>
          <CardContent className="px-2 xs:px-3 sm:px-4 md:px-6 pb-2 xs:pb-3 sm:pb-4 md:pb-6 flex-grow flex flex-col justify-between">
            <div className="text-base xs:text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-0.5 sm:mb-1 flex-grow flex items-center justify-center">
              {statsError ? (
                <span className="text-red-400 text-[10px] xs:text-sm sm:text-base md:text-xl lg:text-2xl">Error</span>
              ) : (
                `${governanceStats?.participationRate ?? 0}%`
              )}
            </div>
            <p className="text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs text-gray-400 mt-0.5 sm:mt-1 truncate">Community engagement</p>
            {!statsError && (
              <div className="mt-1.5 sm:mt-2 md:mt-3">
                <Progress
                  value={governanceStats?.participationRate ?? 0}
                  className="h-1.5 sm:h-2 [&>div]:bg-gradient-to-r [&>div]:from-teal-500 [&>div]:to-emerald-500"
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 sm:pb-2 md:pb-3 px-2 xs:px-3 sm:px-4 md:px-6 pt-2 xs:pt-3 sm:pt-4 md:pt-6 flex-shrink-0">
            <CardTitle className="text-[9px] xs:text-[10px] sm:text-xs md:text-sm font-medium text-gray-300 truncate pr-1 xs:pr-2">
              Quorum Threshold
            </CardTitle>
            <div className="w-6 h-6 xs:w-7 xs:h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center shadow-lg shrink-0">
              <Target className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-white" />
            </div>
          </CardHeader>
          <CardContent className="px-2 xs:px-3 sm:px-4 md:px-6 pb-2 xs:pb-3 sm:pb-4 md:pb-6 flex-grow flex flex-col justify-between">
            <div className="text-base xs:text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-0.5 sm:mb-1 break-all flex-grow flex items-center justify-center">
              {statsError ? (
                <span className="text-red-400 text-[10px] xs:text-sm sm:text-base md:text-xl lg:text-2xl">Error</span>
              ) : (
                `${((governanceStats?.quorumThreshold ?? 0) / 1000).toFixed(0)}K`
              )}
            </div>
            <p className="text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs text-gray-400 mt-0.5 sm:mt-1 truncate">
              {statsError ? 'Unable to load' : `Required votes: ${(governanceStats?.quorumThreshold ?? 0).toLocaleString()}`}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 sm:pb-2 md:pb-3 px-2 xs:px-3 sm:px-4 md:px-6 pt-2 xs:pt-3 sm:pt-4 md:pt-6 flex-shrink-0">
            <CardTitle className="text-[9px] xs:text-[10px] sm:text-xs md:text-sm font-medium text-gray-300 truncate pr-1 xs:pr-2">
              Avg. Voting Power
            </CardTitle>
            <div className="w-6 h-6 xs:w-7 xs:h-7 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded-full bg-gradient-to-br from-pink-500 to-pink-700 flex items-center justify-center shadow-lg shrink-0">
              <Coins className="h-3 w-3 xs:h-3.5 xs:w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-white" />
            </div>
          </CardHeader>
          <CardContent className="px-2 xs:px-3 sm:px-4 md:px-6 pb-2 xs:pb-3 sm:pb-4 md:pb-6 flex-grow flex flex-col justify-between">
            <div className="text-base xs:text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-0.5 sm:mb-1 break-all flex-grow flex items-center justify-center">
              {statsError ? (
                <span className="text-red-400 text-[10px] xs:text-sm sm:text-base md:text-xl lg:text-2xl">Error</span>
              ) : (
                `${((governanceStats?.averageVotingPower ?? 0) / 1000).toFixed(1)}K`
              )}
            </div>
            <p className="text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs text-gray-400 mt-0.5 sm:mt-1 truncate">
              {statsError ? 'Unable to load' : `Per voter: ${(governanceStats?.averageVotingPower ?? 0).toLocaleString()}`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Governance Interface */}
      <Tabs defaultValue="proposals" className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <TabsList className="flex flex-col sm:flex-col md:grid md:grid-cols-4 gap-2 sm:gap-3 bg-transparent p-0 w-full sm:w-full md:w-auto">
            <TabsTrigger
              value="proposals"
              className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-indigo-500 data-[state=active]:to-indigo-700 data-[state=active]:text-white data-[state=inactive]:bg-gray-800 data-[state=inactive]:text-gray-400 data-[state=inactive]:hover:bg-gray-700 transition-all duration-200 py-2 sm:py-3 px-3 sm:px-4 rounded-lg border border-border/50 shadow-md hover:shadow-lg font-semibold text-sm sm:text-sm w-full sm:w-full md:w-auto justify-start"
            >
              <Vote className="h-4 w-4 mr-2" />
              <span>Proposals</span>
            </TabsTrigger>
            <TabsTrigger
              value="voting"
              className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-green-500 data-[state=active]:to-green-700 data-[state=active]:text-white data-[state=inactive]:bg-gray-800 data-[state=inactive]:text-gray-400 data-[state=inactive]:hover:bg-gray-700 transition-all duration-200 py-2 sm:py-3 px-3 sm:px-4 rounded-lg border border-border/50 shadow-md hover:shadow-lg font-semibold text-sm sm:text-sm w-full sm:w-full md:w-auto justify-start"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              <span>Voting History</span>
            </TabsTrigger>
            <TabsTrigger
              value="delegation"
              className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-500 data-[state=active]:to-purple-700 data-[state=active]:text-white data-[state=inactive]:bg-gray-800 data-[state=inactive]:text-gray-400 data-[state=inactive]:hover:bg-gray-700 transition-all duration-200 py-2 sm:py-3 px-3 sm:px-4 rounded-lg border border-border/50 shadow-md hover:shadow-lg font-semibold text-sm sm:text-sm w-full sm:w-full md:w-auto justify-start"
            >
              <Users className="h-4 w-4 mr-2" />
              <span>Delegation</span>
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="data-[state=active]:bg-gradient-to-br data-[state=active]:from-amber-500 data-[state=active]:to-amber-700 data-[state=active]:text-white data-[state=inactive]:bg-gray-800 data-[state=inactive]:text-gray-400 data-[state=inactive]:hover:bg-gray-700 transition-all duration-200 py-2 sm:py-3 px-3 sm:px-4 rounded-lg border border-border/50 shadow-md hover:shadow-lg font-semibold text-sm sm:text-sm w-full sm:w-full md:w-auto justify-start"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              <span>Analytics</span>
            </TabsTrigger>
          </TabsList>
          {isAdmin && (
            <Button
              onClick={() => setShowCreateProposal(true)}
              className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Proposal
            </Button>
          )}
        </div>

        <TabsContent value="proposals" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 w-full overflow-hidden">
            {/* Proposals List */}
            <div className="lg:col-span-2 space-y-3 order-2 lg:order-1 min-w-0">
              {proposals.length > 0 ? (
                proposals.map((proposal) => (
                  <Card
                    key={proposal.id}
                    className={`bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 shadow-xl cursor-pointer transition-all hover:shadow-2xl hover:border-indigo-500/50 overflow-hidden ${selectedProposal === proposal.id ? "border-indigo-500 border-2 shadow-2xl" : ""}`}
                    onClick={() => setSelectedProposal(proposal.id)}
                  >
                    <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-4 md:px-6 pt-3 sm:pt-6">
                      <div className="flex flex-col gap-2 sm:gap-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start space-x-2 sm:space-x-3 flex-1 min-w-0">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 rounded-lg bg-gray-700/50 flex items-center justify-center text-lg sm:text-xl md:text-2xl flex-shrink-0">
                              {getCategoryIcon(proposal.category)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-white text-sm sm:text-base md:text-lg mb-0.5 sm:mb-1 line-clamp-2 leading-tight sm:leading-normal">{proposal.title}</CardTitle>
                            </div>
                          </div>
                          <Badge className={`${getStatusColor(proposal.status)} text-white flex-shrink-0 shadow-md text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1`}>
                            {proposal.status.charAt(0).toUpperCase() + proposal.status.slice(1)}
                          </Badge>
                        </div>
                        <CardDescription className="text-gray-400 text-[11px] sm:text-xs truncate pl-9 sm:pl-11 md:pl-13">
                          By <span className="font-mono">{proposal.proposer.substring(0, 6)}...{proposal.proposer.substring(38)}</span>
                        </CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 px-3 sm:px-4 md:px-6 pb-3 sm:pb-6">
                      <p className="text-xs sm:text-sm text-gray-300 mb-3 sm:mb-4 line-clamp-2 leading-relaxed">{proposal.description}</p>

                      {proposal.status === "active" && (
                        <div className="space-y-2 sm:space-y-3 p-2 sm:p-3 md:p-4 rounded-lg bg-gray-700/30 border border-gray-600/50">
                          <div className="grid grid-cols-3 gap-1 sm:gap-1.5 md:gap-2">
                            <div className="text-center p-1 sm:p-1.5 md:p-2 rounded bg-green-900/20 border border-green-700/30 flex flex-col items-center justify-center min-h-[50px] sm:min-h-[56px] md:min-h-[64px]">
                              <div className="text-[9px] xs:text-[10px] sm:text-xs text-green-400 mb-0.5 sm:mb-1">For</div>
                              <div className="font-semibold text-green-300 text-[10px] xs:text-[11px] sm:text-xs md:text-sm truncate">{
proposal.votesFor.toLocaleString()}</div>
                            </div>
                            <div className="text-center p-1 sm:p-1.5 md:p-2 rounded bg-red-900/20 border border-red-700/30 flex flex-col items-center justify-center min-h-[50px] sm:min-h-[56px] md:min-h-[64px]">
                              <div className="text-[9px] xs:text-[10px] sm:text-xs text-red-400 mb-0.5 sm:mb-1">Against</div>
                              <div className="font-semibold text-red-300 text-[10px] xs:text-[11px] sm:text-xs md:text-sm truncate">{
proposal.votesAgainst.toLocaleString()}</div>
                            </div>
                            <div className="text-center p-1 sm:p-1.5 md:p-2 rounded bg-gray-800/50 border border-gray-600/30 flex flex-col items-center justify-center min-h-[50px] sm:min-h-[56px] md:min-h-[64px]">
                              <div className="text-[9px] xs:text-[10px] sm:text-xs text-gray-400 mb-0.5 sm:mb-1">Abstain</div>
                              <div className="font-semibold text-gray-300 text-[10px] xs:text-[11px] sm:text-xs md:text-sm truncate">{
proposal.votesAbstain.toLocaleString()}</div>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] sm:text-xs text-gray-400">
                              <span className="truncate">Quorum Progress</span>
                              <span className="font-medium flex-shrink-0 ml-2">{((proposal.totalVotes / governanceStats.quorumThreshold) * 100).toFixed(1)}%</span>
                            </div>
                            <Progress
                              value={(proposal.totalVotes / governanceStats.quorumThreshold) * 100}
                              className="h-1.5 sm:h-2 [&>div]:bg-gradient-to-r [&>div]:from-indigo-500 [&>div]:to-purple-500"
                            />
                          </div>
                          <div className="flex flex-col xs:flex-row xs:justify-between xs:items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-gray-400 pt-1.5 sm:pt-2 border-t border-gray-600/30">
                            <span className="flex items-center gap-1 min-w-0">
                              <Vote className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{proposal.totalVotes.toLocaleString()} / {governanceStats.quorumThreshold.toLocaleString()}</span>
                            </span>
                            <span className="flex items-center gap-1 flex-shrink-0">
                              <Calendar className="w-3 h-3 flex-shrink-0" />
                              <span className="whitespace-nowrap">Ends {new Date(proposal.endTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                            </span>
                          </div>
                        </div>
                      )}

                      {(proposal.status === "succeeded" || proposal.status === "queued") && (
                        <div className="p-2 sm:p-2.5 md:p-3 rounded-lg bg-green-900/20 border border-green-700/30">
                          <div className="flex items-center gap-1.5 sm:gap-2 text-green-400">
                            <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="text-[11px] sm:text-xs md:text-sm font-medium leading-tight">
                              Passed with {((proposal.votesFor / proposal.totalVotes) * 100).toFixed(1)}% approval
                            </span>
                          </div>
                        </div>
                      )}

                      {proposal.status === "defeated" && (
                        <div className="p-2 sm:p-2.5 md:p-3 rounded-lg bg-red-900/20 border border-red-700/30">
                          <div className="flex items-center gap-1.5 sm:gap-2 text-red-400">
                            <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="text-[11px] sm:text-xs md:text-sm font-medium leading-tight">
                              Rejected with {((proposal.votesAgainst / proposal.totalVotes) * 100).toFixed(1)}% opposition
                            </span>
                          </div>
                        </div>
                      )}

                      {proposal.status === "executed" && (
                        <div className="p-2 sm:p-2.5 md:p-3 rounded-lg bg-emerald-900/20 border border-emerald-700/30">
                          <div className="flex items-center gap-1.5 sm:gap-2 text-emerald-400">
                            <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="text-[11px] sm:text-xs md:text-sm font-medium leading-tight">
                              Executed successfully
                            </span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 shadow-xl overflow-hidden">
                  <CardContent className="py-12 sm:py-16 px-4 sm:px-6 text-center">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-600/10 border-2 border-indigo-500/30 flex items-center justify-center mx-auto mb-4 sm:mb-6">
                      <Vote className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-400" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">No Active Proposals</h3>
                    <p className="text-xs sm:text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
                      There are currently no governance proposals. Check back later or create a new proposal if you have voting power.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Voting Panel */}
            <div className="space-y-3 order-1 lg:order-2 min-w-0 w-full max-w-full">
              {selectedProposal && (
                <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 shadow-xl overflow-hidden max-w-full">
                  <CardHeader className="pb-1.5 sm:pb-2 md:pb-3 px-1.5 sm:px-2 md:px-4 lg:px-6 pt-1.5 sm:pt-2 md:pt-4 lg:pt-6">
                    <CardTitle className="text-white flex items-center gap-1 sm:gap-1.5 md:gap-2 text-xs sm:text-sm md:text-base lg:text-lg">
                      <Vote className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-indigo-500 shrink-0" />
                      <span className="truncate">Cast Your Vote</span>
                    </CardTitle>
                    <CardDescription className="text-gray-400 text-[10px] sm:text-xs truncate">Proposal #{selectedProposal}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-1.5 sm:space-y-2 md:space-y-3 w-full overflow-hidden px-1.5 sm:px-2 md:px-4 lg:px-6 pb-1.5 sm:pb-2 md:pb-4 lg:pb-6">
                    {votingPower > 0 ? (
                      <>
                        <div className="p-1.5 sm:p-2 md:p-3 lg:p-4 bg-gradient-to-br from-indigo-500/20 to-purple-600/10 border border-indigo-500/30 rounded-lg">
                          <div className="text-[9px] sm:text-[10px] md:text-xs font-medium text-gray-300 mb-0.5">
                            Your Voting Power
                          </div>
                          <div className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-indigo-400 break-all">
                            {votingPower.toLocaleString()}
                          </div>
                          <p className="text-[9px] sm:text-[10px] md:text-xs text-gray-400 mt-0.5">
                            Votes available
                          </p>
                        </div>
                        <div className="flex flex-col gap-1.5 sm:gap-2 w-full">
                          <Button
                            className="w-full h-auto min-h-[28px] sm:min-h-[36px] md:min-h-[40px] bg-green-600 hover:bg-green-700 shadow-md text-white py-1 sm:py-1.5 md:py-2 px-1 sm:px-2 md:px-3 flex items-center justify-center gap-0.5 sm:gap-1 md:gap-1.5 whitespace-nowrap overflow-hidden"
                            onClick={() => handleVote(selectedProposal, 1)}
                          >
                            <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4 shrink-0" />
                            <span className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm xl:text-base truncate">Vote For</span>
                          </Button>
                          <Button
                            className="w-full h-auto min-h-[28px] sm:min-h-[36px] md:min-h-[40px] bg-red-600 hover:bg-red-700 shadow-md text-white py-1 sm:py-1.5 md:py-2 px-1 sm:px-2 md:px-3 flex items-center justify-center gap-0.5 sm:gap-1 md:gap-1.5 whitespace-nowrap overflow-hidden"
                            onClick={() => handleVote(selectedProposal, 0)}
                          >
                            <XCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4 shrink-0" />
                            <span className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm xl:text-base truncate">Vote Against</span>
                          </Button>
                          <Button
                            variant="outline"
                            className="w-full h-auto min-h-[28px] sm:min-h-[36px] md:min-h-[40px] border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white shadow-md py-1 sm:py-1.5 md:py-2 px-1 sm:px-2 md:px-3 flex items-center justify-center gap-0.5 sm:gap-1 md:gap-1.5 whitespace-nowrap overflow-hidden"
                            onClick={() => handleVote(selectedProposal, 2)}
                          >
                            <Vote className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5 lg:w-4 lg:h-4 shrink-0" />
                            <span className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm xl:text-base truncate">Abstain</span>
                          </Button>
                        </div>
                      </>
                    ) : (
                      <Alert className="bg-amber-900/20 border-amber-800 p-2 sm:p-3 md:p-4">
                        <AlertTriangle className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-amber-400 shrink-0" />
                        <AlertDescription className="text-amber-300 text-[9px] sm:text-[10px] md:text-xs lg:text-sm leading-tight">
                          You need at least 100 BTC1USD tokens to participate in governance.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 shadow-xl overflow-hidden max-w-full">
                <CardHeader className="pb-1.5 sm:pb-2 md:pb-3 px-1.5 sm:px-2 md:px-4 lg:px-6 pt-1.5 sm:pt-2 md:pt-4 lg:pt-6">
                  <CardTitle className="text-white text-xs sm:text-sm md:text-base lg:text-lg truncate">Governance Parameters</CardTitle>
                  <CardDescription className="text-gray-400 text-[10px] sm:text-[11px] md:text-xs truncate">Protocol voting rules</CardDescription>
                </CardHeader>
                <CardContent className="space-y-1 sm:space-y-1.5 md:space-y-2 w-full overflow-hidden px-1.5 sm:px-2 md:px-4 lg:px-6 pb-1.5 sm:pb-2 md:pb-4 lg:pb-6">
                  <div className="flex flex-col xs:flex-row xs:justify-between xs:items-center gap-0.5 p-1.5 sm:p-2 md:p-2.5 bg-gray-700/30 rounded min-w-0">
                    <span className="text-[9px] sm:text-[10px] md:text-[11px] lg:text-xs text-gray-400 shrink-0">Voting Power</span>
                    <span className="text-[9px] sm:text-[10px] md:text-[11px] lg:text-xs font-medium text-white break-words text-left xs:text-right">1 vote per 100 BTC1USD</span>
                  </div>
                  <div className="flex flex-col xs:flex-row xs:justify-between xs:items-center gap-0.5 p-1.5 sm:p-2 md:p-2.5 bg-gray-700/30 rounded min-w-0">
                    <span className="text-[9px] sm:text-[10px] md:text-[11px] lg:text-xs text-gray-400 shrink-0">Proposal Threshold</span>
                    <span className="text-[9px] sm:text-[10px] md:text-[11px] lg:text-xs font-medium text-white break-words text-left xs:text-right">10,000 BTC1USD</span>
                  </div>
                  <div className="flex flex-col xs:flex-row xs:justify-between xs:items-center gap-0.5 p-1.5 sm:p-2 md:p-2.5 bg-gray-700/30 rounded min-w-0">
                    <span className="text-[9px] sm:text-[10px] md:text-[11px] lg:text-xs text-gray-400 shrink-0">Quorum</span>
                    <span className="text-[9px] sm:text-[10px] md:text-[11px] lg:text-xs font-medium text-white break-words text-left xs:text-right">4% of total supply</span>
                  </div>
                  <div className="flex flex-col xs:flex-row xs:justify-between xs:items-center gap-0.5 p-1.5 sm:p-2 md:p-2.5 bg-gray-700/30 rounded min-w-0">
                    <span className="text-[9px] sm:text-[10px] md:text-[11px] lg:text-xs text-gray-400 shrink-0">Voting Period</span>
                    <span className="text-[9px] sm:text-[10px] md:text-[11px] lg:text-xs font-medium text-white break-words text-left xs:text-right">3-14 days</span>
                  </div>
                  <div className="flex flex-col xs:flex-row xs:justify-between xs:items-center gap-0.5 p-1.5 sm:p-2 md:p-2.5 bg-gray-700/30 rounded min-w-0">
                    <span className="text-[9px] sm:text-[10px] md:text-[11px] lg:text-xs text-gray-400 shrink-0">Timelock</span>
                    <span className="text-[9px] sm:text-[10px] md:text-[11px] lg:text-xs font-medium text-white break-words text-left xs:text-right">2 days</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="voting" className="space-y-4 mt-4">
          <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2 text-lg">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Your Voting History
              </CardTitle>
              <CardDescription className="text-gray-400 text-sm">Track your participation in governance decisions</CardDescription>
            </CardHeader>
            <CardContent>
              {votingHistory.length > 0 ? (
                <div className="space-y-3">
                  {votingHistory.map((vote, index) => (
                    <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-lg bg-gray-700/30 border border-gray-600/50 hover:bg-gray-700/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white mb-1 text-sm sm:text-base">{vote.proposalTitle}</div>
                        <div className="text-xs text-gray-400">Proposal #{vote.proposalId}</div>
                      </div>
                      <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                        <Badge
                          variant={vote.vote === "for" ? "default" : vote.vote === "against" ? "destructive" : "secondary"}
                          className={`${vote.vote === "for" ? "bg-green-900/50 text-green-300 border-green-700/50" : vote.vote === "against" ? "bg-red-900/50 text-red-300 border-red-700/50" : "bg-gray-700 text-gray-300 border-gray-600"} shadow-md text-xs sm:text-sm`}
                        >
                          {vote.vote.charAt(0).toUpperCase() + vote.vote.slice(1)}
                        </Badge>
                        <div className="text-right">
                          <div className="font-semibold text-white text-sm">{vote.votes.toLocaleString()}</div>
                          <div className="text-xs text-gray-400">votes</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-400">
                            {new Date(vote.date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <div className="w-16 h-16 rounded-full bg-gray-700/30 flex items-center justify-center mx-auto mb-4">
                    <Vote className="w-8 h-8 opacity-50" />
                  </div>
                  <div className="font-medium text-white mb-1">No voting history yet</div>
                  <div className="text-sm">Participate in governance to see your voting record</div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="delegation" className="space-y-4 mt-4">
          <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center gap-2 text-lg">
                <Users className="h-5 w-5 text-purple-500" />
                Vote Delegation
              </CardTitle>
              <CardDescription className="text-gray-400 text-sm">Delegate your voting power to trusted community members</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {delegateInfo.delegate ? (
                <div className="p-4 rounded-lg bg-gray-700/30 border border-gray-600/50">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white mb-1">Currently Delegated To</div>
                      <div className="text-sm text-gray-400 font-mono break-all">{delegateInfo.delegate}</div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white shadow-md ml-3"
                      onClick={() => {
                        setDelegateInfo({
                          delegate: "",
                          votingPower: delegateInfo.votingPower,
                          delegatedVotes: delegateInfo.delegatedVotes - votingPower
                        })
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30">
                      <div className="text-xs text-gray-400 mb-1">Your Voting Power</div>
                      <div className="text-xl sm:text-2xl font-bold text-purple-400">
                        {(delegateInfo?.votingPower ?? 0).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-400">votes</div>
                    </div>
                    <div className="p-3 rounded-lg bg-gradient-to-br from-indigo-500/20 to-indigo-600/10 border border-indigo-500/30">
                      <div className="text-xs text-gray-400 mb-1">Delegated Votes</div>
                      <div className="text-xl sm:text-2xl font-bold text-indigo-400">
                        {(delegateInfo?.delegatedVotes ?? 0).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-400">votes</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <div className="w-16 h-16 rounded-full bg-gray-700/30 flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 opacity-50" />
                  </div>
                  <div className="font-medium text-white mb-1">You haven't delegated your votes yet</div>
                  <div className="text-sm">Delegate to increase your governance influence</div>
                </div>
              )}

              <div className="pt-4 border-t border-gray-700">
                <Button
                  onClick={() => setShowDelegate(true)}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Delegate Votes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 shadow-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5 text-amber-500" />
                  Governance Participation
                </CardTitle>
                <CardDescription className="text-gray-400 text-sm">Community engagement metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-gray-700/30 border border-gray-600/50">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Participation Rate</span>
                      <span className="font-semibold text-white">
                        {statsError ? 'Error' : `${governanceStats?.participationRate ?? 0}%`}
                      </span>
                    </div>
                    {!statsError && (
                      <Progress
                        value={governanceStats?.participationRate ?? 0}
                        className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-green-500 [&>div]:to-emerald-500"
                      />
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30">
                      <div className="text-xs text-gray-400 mb-1">Avg. Voting Power</div>
                      <div className="text-lg sm:text-xl font-bold text-blue-400">
                        {statsError ? <span className="text-red-400">Error</span> : (governanceStats?.averageVotingPower ?? 0).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-400">votes</div>
                    </div>
                    <div className="p-3 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30">
                      <div className="text-xs text-gray-400 mb-1">Delegated Votes</div>
                      <div className="text-lg sm:text-xl font-bold text-purple-400">
                        {statsError ? <span className="text-red-400">Error</span> : (governanceStats?.totalDelegatedVotes ?? 0).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-400">total</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 shadow-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center gap-2 text-lg">
                  <Trophy className="h-5 w-5 text-green-500" />
                  Proposal Success Rate
                </CardTitle>
                <CardDescription className="text-gray-400 text-sm">Historical proposal outcomes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-600/10 border-4 border-green-500/30 flex items-center justify-center mx-auto mb-4">
                      <div className="text-4xl font-bold text-green-400">78%</div>
                    </div>
                    <div className="text-sm text-gray-400">Proposals Passed</div>
                    <div className="text-xs text-gray-500 mt-1">Based on 24 proposals</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Proposal Modal */}
      {showCreateProposal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
          <Card className="w-full max-w-2xl bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 shadow-xl my-4 sm:my-auto">
            <CardHeader>
              <CardTitle className="text-white text-lg sm:text-xl md:text-2xl">Create New Proposal</CardTitle>
              <CardDescription className="text-gray-400 text-sm md:text-base">Submit a proposal for community voting</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div>
                <Label htmlFor="proposal-title" className="text-gray-300 text-sm md:text-base">Title</Label>
                <Input id="proposal-title" placeholder="Enter proposal title" className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 mt-1.5 h-9 sm:h-10 md:h-11 text-sm sm:text-base" />
              </div>
              <div>
                <Label htmlFor="proposal-category" className="text-gray-300 text-sm md:text-base">Category</Label>
                <Select>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white mt-1.5 h-9 sm:h-10 md:h-11 text-sm sm:text-base">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="parameter">Protocol Parameters</SelectItem>
                    <SelectItem value="emergency">Emergency Actions</SelectItem>
                    <SelectItem value="upgrade">Contract Upgrades</SelectItem>
                    <SelectItem value="treasury">Treasury Management</SelectItem>
                    <SelectItem value="governance">Governance Changes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="proposal-description" className="text-gray-300 text-sm md:text-base">Description</Label>
                <Textarea
                  id="proposal-description"
                  placeholder="Provide detailed description of the proposal"
                  rows={4}
                  className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 resize-none mt-1.5 text-sm sm:text-base"
                />
              </div>
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateProposal(false)}
                  className="w-full sm:w-auto border-gray-600 text-gray-300 hover:bg-gray-700 h-9 sm:h-10"
                >
                  Cancel
                </Button>
                <Button className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md h-9 sm:h-10">
                  Submit Proposal
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delegate Modal */}
      {showDelegate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 shadow-xl">
            <CardHeader>
              <CardTitle className="text-white text-lg sm:text-xl">Delegate Your Votes</CardTitle>
              <CardDescription className="text-gray-400 text-sm">Enter the address to delegate your voting power to</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="delegate-address" className="text-gray-300 text-sm">Delegate Address</Label>
                <Input
                  id="delegate-address"
                  placeholder="0x..."
                  value={delegateAddress}
                  onChange={(e) => setDelegateAddress(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 font-mono mt-1.5 text-sm"
                />
              </div>
              <div className="text-xs sm:text-sm text-gray-400">
                Your voting power of {votingPower.toLocaleString()} votes will be delegated to this address.
              </div>
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDelegate(false)}
                  className="w-full sm:w-auto border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md"
                  onClick={handleDelegate}
                >
                  Delegate
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      </div>
    </div>
  )
}