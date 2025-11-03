'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  TrendingUp,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Settings,
  Zap,
  Vote,
  BarChart3,
  AlertCircle,
  CheckCircle,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';

// Types
interface Proposal {
  id: number;
  title: string;
  description: string;
  proposer: string;
  category: string;
  categoryId: number;
  forVotes: string;
  againstVotes: string;
  abstainVotes: string;
  startBlock: number;
  endBlock: number;
  eta: number;
  executed: boolean;
  canceled: boolean;
  state: string;
  stateId: number;
  quorum?: string;
  quorumReached?: boolean;
  votePercentage?: {
    for: number;
    against: number;
    abstain: number;
  };
}

interface GovernanceStats {
  totalProposals: number;
  activeProposals: number;
  votingPower: string;
  participationRate: number;
}

interface ProtocolParameter {
  name: string;
  currentValue: string;
  description: string;
  category: string;
  icon: any;
  gradient: string;
}

export default function BreathtakingGovernance() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  const [stats, setStats] = useState<GovernanceStats>({
    totalProposals: 0,
    activeProposals: 0,
    votingPower: '0',
    participationRate: 0
  });

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [activeTab, setActiveTab] = useState<'proposals' | 'parameters'>('proposals');
  const [isLoading, setIsLoading] = useState(false);

  const loadProposalDetails = async (proposalId: number) => {
    try {
      const response = await fetch(`/api/governance/proposals?id=${proposalId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedProposal(data.proposal);
      }
    } catch (error) {
      console.error('Failed to load proposal details:', error);
    }
  };

  // Protocol parameters
  const parameters: ProtocolParameter[] = [
    {
      name: 'Collateral Ratio',
      currentValue: '110%',
      description: 'Minimum collateralization required for minting',
      category: 'Core',
      icon: TrendingUp,
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      name: 'Liquidation Threshold',
      currentValue: '105%',
      description: 'Threshold at which positions become liquidatable',
      category: 'Core',
      icon: AlertCircle,
      gradient: 'from-red-500 to-orange-500'
    },
    {
      name: 'Weekly Distribution',
      currentValue: '0.1%',
      description: 'Weekly reward distribution rate for holders',
      category: 'Rewards',
      icon: Sparkles,
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      name: 'Proposal Threshold',
      currentValue: '1000 BTC1USD',
      description: 'Minimum tokens required to create proposals',
      category: 'Governance',
      icon: Vote,
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      name: 'Voting Period',
      currentValue: '7 days',
      description: 'Duration for proposal voting',
      category: 'Governance',
      icon: Clock,
      gradient: 'from-indigo-500 to-blue-500'
    },
    {
      name: 'Quorum',
      currentValue: '10%',
      description: 'Minimum participation required for valid proposals',
      category: 'Governance',
      icon: Users,
      gradient: 'from-yellow-500 to-orange-500'
    }
  ];

  // Load governance data
  useEffect(() => {
    if (isConnected && address) {
      loadGovernanceData();
    }
  }, [isConnected, address]);

  const loadGovernanceData = async () => {
    setIsLoading(true);
    try {
      // Fetch from API
      const url = address
        ? `/api/governance/proposals?address=${address}`
        : '/api/governance/proposals';

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setProposals(data.proposals || []);

        // Calculate stats
        const activeCount = data.proposals?.filter((p: Proposal) => p.state === 'Active').length || 0;
        const totalVotes = data.proposals?.reduce((sum: number, p: Proposal) => {
          return sum + parseFloat(p.forVotes) + parseFloat(p.againstVotes) + parseFloat(p.abstainVotes);
        }, 0) || 0;

        setStats({
          totalProposals: data.total || 0,
          activeProposals: activeCount,
          votingPower: '0', // Will be updated by contract call below
          participationRate: totalVotes > 0 ? Math.min(Math.round(totalVotes / 100), 100) : 0
        });

        // Get voting power from contract
        if (address && publicClient) {
          try {
            const btc1usdAddress = process.env.NEXT_PUBLIC_BTC1USD_CONTRACT as `0x${string}`;
            const balance = await publicClient.readContract({
              address: btc1usdAddress,
              abi: [{
                name: 'balanceOf',
                type: 'function',
                stateMutability: 'view',
                inputs: [{ name: 'account', type: 'address' }],
                outputs: [{ name: '', type: 'uint256' }]
              }],
              functionName: 'balanceOf',
              args: [address]
            });
            setStats(prev => ({ ...prev, votingPower: balance.toString() }));
          } catch (error) {
            console.warn('Failed to get voting power:', error);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load governance data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const castVote = async (proposalId: number, support: 0 | 1 | 2) => {
    if (!walletClient || !address) return;

    try {
      const governanceAddress = process.env.NEXT_PUBLIC_DAO_CONTRACT as `0x${string}`;

      const hash = await walletClient.writeContract({
        address: governanceAddress,
        abi: [{
          name: 'castVote',
          type: 'function',
          stateMutability: 'nonpayable',
          inputs: [
            { name: 'proposalId', type: 'uint256' },
            { name: 'support', type: 'uint8' }
          ],
          outputs: []
        }],
        functionName: 'castVote',
        args: [BigInt(proposalId), support]
      });

      await publicClient?.waitForTransactionReceipt({ hash });
      await loadGovernanceData();
      setSelectedProposal(null);
    } catch (error) {
      console.error('Failed to cast vote:', error);
      alert(error instanceof Error ? error.message : 'Failed to cast vote');
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 p-6">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="max-w-7xl mx-auto space-y-8"
      >
        {/* Header with Glassmorphism */}
        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-xl border border-white/10 p-8"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg shadow-blue-500/50"
              >
                <Vote className="w-8 h-8 text-white" />
              </motion.div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Protocol Governance
                </h1>
                <p className="text-gray-400 mt-1">Shape the future of BTC1USD</p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              {[
                { label: 'Total Proposals', value: stats.totalProposals, icon: FileText, color: 'blue' },
                { label: 'Active Proposals', value: stats.activeProposals, icon: Zap, color: 'purple' },
                { label: 'Your Voting Power', value: parseFloat(formatUnits(BigInt(stats.votingPower), 8)).toFixed(2), icon: TrendingUp, color: 'pink' },
                { label: 'Participation Rate', value: `${stats.participationRate}%`, icon: BarChart3, color: 'cyan' }
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className={`relative rounded-2xl bg-gradient-to-br from-${stat.color}-500/10 to-${stat.color}-600/5 backdrop-blur-sm border border-${stat.color}-500/20 p-4 group cursor-pointer`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br from-${stat.color}-500/0 to-${stat.color}-500/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl`} />
                  <div className="relative z-10">
                    <stat.icon className={`w-6 h-6 text-${stat.color}-400 mb-2`} />
                    <div className={`text-2xl font-bold text-${stat.color}-400`}>{stat.value}</div>
                    <div className="text-sm text-gray-400">{stat.label}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div variants={itemVariants} className="flex gap-4">
          {[
            { key: 'proposals', label: 'Proposals', icon: FileText },
            { key: 'parameters', label: 'Parameters', icon: Settings }
          ].map((tab) => (
            <motion.button
              key={tab.key}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                activeTab === tab.key
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/50'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </motion.button>
          ))}
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'proposals' ? (
            <motion.div
              key="proposals"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {proposals.length === 0 ? (
                <motion.div
                  variants={itemVariants}
                  className="text-center py-12 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10"
                >
                  <FileText className="w-16 h-16 mx-auto text-gray-600 mb-4" />
                  <p className="text-gray-400">No proposals yet</p>
                </motion.div>
              ) : (
                proposals.map((proposal, index) => (
                  <motion.div
                    key={proposal.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -5 }}
                    onClick={() => loadProposalDetails(proposal.id)}
                    className="relative group cursor-pointer rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl border border-white/10 p-6 hover:border-blue-500/50 transition-all"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/10 group-hover:to-purple-500/10 transition-all rounded-2xl" />

                    <div className="relative z-10">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-sm font-mono text-gray-500">#{proposal.id}</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              proposal.state === 'Active' ? 'bg-green-500/20 text-green-400' :
                              proposal.state === 'Succeeded' ? 'bg-blue-500/20 text-blue-400' :
                              proposal.state === 'Defeated' ? 'bg-red-500/20 text-red-400' :
                              proposal.state === 'Executed' ? 'bg-purple-500/20 text-purple-400' :
                              proposal.state === 'Queued' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-gray-500/20 text-gray-400'
                            }`}>
                              {proposal.state}
                            </span>
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-400">
                              {proposal.category}
                            </span>
                          </div>
                          <h3 className="text-xl font-bold text-white mb-2">{proposal.title}</h3>
                          <p className="text-gray-400 line-clamp-2">{proposal.description}</p>
                        </div>
                        <ArrowUpRight className="w-5 h-5 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>

                      {/* Voting Progress */}
                      <div className="space-y-2">
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <span className="text-green-400 flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            For: {parseFloat(proposal.forVotes).toFixed(0)}
                          </span>
                          <span className="text-red-400 flex items-center gap-1">
                            <XCircle className="w-4 h-4" />
                            Against: {parseFloat(proposal.againstVotes).toFixed(0)}
                          </span>
                          <span className="text-gray-400 flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            Abstain: {parseFloat(proposal.abstainVotes).toFixed(0)}
                          </span>
                        </div>

                        <div className="relative h-3 bg-gray-800 rounded-full overflow-hidden flex">
                          {proposal.votePercentage && (
                            <>
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${proposal.votePercentage.for}%` }}
                                transition={{ duration: 1, ease: 'easeOut' }}
                                className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                              />
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${proposal.votePercentage.against}%` }}
                                transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                                className="h-full bg-gradient-to-r from-red-500 to-orange-500"
                              />
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${proposal.votePercentage.abstain}%` }}
                                transition={{ duration: 1, ease: 'easeOut', delay: 0.4 }}
                                className="h-full bg-gradient-to-r from-gray-500 to-gray-600"
                              />
                            </>
                          )}
                        </div>
                      </div>

                      {/* Timing */}
                      <div className="flex items-center gap-2 mt-4 text-sm text-gray-500">
                        <Clock className="w-4 h-4" />
                        <span>Block {proposal.startBlock} → {proposal.endBlock}</span>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          ) : (
            <motion.div
              key="parameters"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {parameters.map((param, index) => (
                <motion.div
                  key={param.name}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -10 }}
                  className={`relative group cursor-pointer rounded-2xl bg-gradient-to-br ${param.gradient} p-[2px] overflow-hidden`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="relative h-full rounded-2xl bg-slate-900/90 backdrop-blur-xl p-6">
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${param.gradient} flex items-center justify-center mb-4 shadow-lg`}
                    >
                      <param.icon className="w-6 h-6 text-white" />
                    </motion.div>

                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-white">{param.name}</h3>
                          <p className="text-sm text-gray-400 mt-1">{param.description}</p>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-white/10">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Current Value</span>
                          <span className={`text-2xl font-bold bg-gradient-to-r ${param.gradient} bg-clip-text text-transparent`}>
                            {param.currentValue}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-gray-400">
                          {param.category}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Proposal Detail Modal */}
        <AnimatePresence>
          {selectedProposal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProposal(null)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900 rounded-3xl border border-white/10 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              >
                <div className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-mono text-gray-500">#{selectedProposal.id}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          selectedProposal.state === 'Active' ? 'bg-green-500/20 text-green-400' :
                          selectedProposal.state === 'Succeeded' ? 'bg-blue-500/20 text-blue-400' :
                          selectedProposal.state === 'Defeated' ? 'bg-red-500/20 text-red-400' :
                          selectedProposal.state === 'Executed' ? 'bg-purple-500/20 text-purple-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {selectedProposal.state}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-400">
                          {selectedProposal.category}
                        </span>
                      </div>
                      <h2 className="text-3xl font-bold text-white">{selectedProposal.title}</h2>
                    </div>
                    <button
                      onClick={() => setSelectedProposal(null)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <XCircle className="w-6 h-6 text-gray-400" />
                    </button>
                  </div>

                  <p className="text-gray-300 mb-6 whitespace-pre-wrap">{selectedProposal.description}</p>

                  <div className="space-y-4 mb-8">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/20">
                        <div className="text-green-400 flex items-center gap-2 mb-1">
                          <CheckCircle className="w-4 h-4" />
                          <span className="font-semibold">For</span>
                        </div>
                        <div className="text-2xl font-bold text-green-400">
                          {parseFloat(selectedProposal.forVotes).toFixed(0)}
                        </div>
                        {selectedProposal.votePercentage && (
                          <div className="text-xs text-gray-400 mt-1">
                            {selectedProposal.votePercentage.for.toFixed(1)}%
                          </div>
                        )}
                      </div>
                      <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/20">
                        <div className="text-red-400 flex items-center gap-2 mb-1">
                          <XCircle className="w-4 h-4" />
                          <span className="font-semibold">Against</span>
                        </div>
                        <div className="text-2xl font-bold text-red-400">
                          {parseFloat(selectedProposal.againstVotes).toFixed(0)}
                        </div>
                        {selectedProposal.votePercentage && (
                          <div className="text-xs text-gray-400 mt-1">
                            {selectedProposal.votePercentage.against.toFixed(1)}%
                          </div>
                        )}
                      </div>
                      <div className="bg-gray-500/10 rounded-xl p-4 border border-gray-500/20">
                        <div className="text-gray-400 flex items-center gap-2 mb-1">
                          <CheckCircle className="w-4 h-4" />
                          <span className="font-semibold">Abstain</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-400">
                          {parseFloat(selectedProposal.abstainVotes).toFixed(0)}
                        </div>
                        {selectedProposal.votePercentage && (
                          <div className="text-xs text-gray-400 mt-1">
                            {selectedProposal.votePercentage.abstain.toFixed(1)}%
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="relative h-4 bg-gray-800 rounded-full overflow-hidden flex">
                      {selectedProposal.votePercentage && (
                        <>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${selectedProposal.votePercentage.for}%` }}
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                          />
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${selectedProposal.votePercentage.against}%` }}
                            className="h-full bg-gradient-to-r from-red-500 to-orange-500"
                          />
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${selectedProposal.votePercentage.abstain}%` }}
                            className="h-full bg-gradient-to-r from-gray-500 to-gray-600"
                          />
                        </>
                      )}
                    </div>

                    {selectedProposal.quorum && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Quorum Required:</span>
                        <span className={`font-semibold ${selectedProposal.quorumReached ? 'text-green-400' : 'text-orange-400'}`}>
                          {parseFloat(selectedProposal.quorum).toFixed(0)} BTC1USD
                          {selectedProposal.quorumReached && ' ✓'}
                        </span>
                      </div>
                    )}
                  </div>

                  {selectedProposal.state === 'Active' && (
                    <div className="grid grid-cols-3 gap-3">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => castVote(selectedProposal.id, 1)}
                        className="py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold shadow-lg shadow-green-500/50 hover:shadow-green-500/70 transition-shadow flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        For
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => castVote(selectedProposal.id, 0)}
                        className="py-4 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold shadow-lg shadow-red-500/50 hover:shadow-red-500/70 transition-shadow flex items-center justify-center gap-2"
                      >
                        <XCircle className="w-5 h-5" />
                        Against
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => castVote(selectedProposal.id, 2)}
                        className="py-4 rounded-xl bg-gradient-to-r from-gray-500 to-gray-600 text-white font-semibold shadow-lg shadow-gray-500/50 hover:shadow-gray-500/70 transition-shadow flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-5 h-5" />
                        Abstain
                      </motion.button>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
