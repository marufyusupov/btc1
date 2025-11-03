"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Coins,
  Calendar,
  Award,
  Activity,
  Crown
} from 'lucide-react';
import { formatUnits } from 'viem';

interface DistributionAnalytics {
  totalDistributions: number;
  totalRewardsDistributed: string;
  totalClaimed: string;
  overallClaimRate: number;
  activeDistributions: number;
  completedDistributions: number;
  averageClaimRate: number;
  topDistribution: {
    id: string;
    rewards: string;
    claimed: string;
    claimRate: number;
  };
  recentActivity: {
    date: string;
    distributions: number;
    rewards: string;
  }[];
  userParticipation?: {
    totalParticipated: number;
    totalPossible: number;
    participationRate: number;
    unclaimedRewards: string;
  };
}

// Enhanced color palette for beautiful charts
const CHART_COLORS = {
  primary: "#6366f1",      // Indigo - primary data
  secondary: "#8b5cf6",    // Violet - secondary data
  accent: "#0ea5e9",       // Sky - accent data
  success: "#10b981",      // Emerald - positive trends
  warning: "#f59e0b",      // Amber - warnings
  danger: "#ef4444",       // Red - critical data
  neutral: "#94a3b8",      // Slate - neutral data
  background: "#1e293b",   // Slate - chart background
  grid: "#334155",         // Slate - grid lines
  text: "#cbd5e1"          // Slate - text
};

const COLORS = [CHART_COLORS.primary, CHART_COLORS.secondary, CHART_COLORS.accent, CHART_COLORS.success, CHART_COLORS.warning];

// Custom tooltip component for better visualization
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 p-3 rounded-lg shadow-lg backdrop-blur-sm">
        <p className="font-medium text-slate-200">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Custom legend component
const CustomLegend = ({ payload }: any) => {
  return (
    <div className="flex flex-wrap justify-center gap-4 mt-2">
      {payload.map((entry: any, index: number) => (
        <div key={`item-${index}`} className="flex items-center">
          <div 
            className="w-3 h-3 rounded-full mr-2" 
            style={{ backgroundColor: entry.color }}
          ></div>
          <span className="text-sm text-slate-300">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

export function DistributionAnalyticsDashboard({ userAddress }: { userAddress?: string }) {
  const [analytics, setAnalytics] = useState<DistributionAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const url = userAddress
          ? `/api/distribution-analytics?address=${userAddress}&t=${Date.now()}`
          : `/api/distribution-analytics?t=${Date.now()}`;

        const response = await fetch(url, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch analytics: ${response.status}`);
        }

        const data = await response.json();
        setAnalytics(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();

    // Refresh every 30 seconds
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, [userAddress]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-red-900/20 border-red-800 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="text-red-400">Error: {error}</div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="text-center text-slate-400">No analytics data available</div>
        </CardContent>
      </Card>
    );
  }

  // Format data for charts
  const recentActivityData = analytics.recentActivity.map(activity => ({
    ...activity,
    formattedDate: new Date(activity.date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    }),
    rewardsFormatted: parseFloat(formatUnits(BigInt(activity.rewards), 8))
  }));

  const distributionStatusData = [
    { name: 'Active', value: analytics.activeDistributions, color: CHART_COLORS.primary },
    { name: 'Completed', value: analytics.completedDistributions, color: CHART_COLORS.success }
  ];

  // Key metrics cards
  const metrics = [
    {
      title: 'Total Distributions',
      value: analytics.totalDistributions,
      icon: <Calendar className="h-5 w-5 text-indigo-400" />,
      change: null,
      trend: null
    },
    {
      title: 'Total Rewards',
      value: `${parseFloat(formatUnits(BigInt(analytics.totalRewardsDistributed), 8)).toLocaleString(undefined, { maximumFractionDigits: 2 })} BTC1USD`,
      icon: <Coins className="h-5 w-5 text-amber-400" />,
      change: null,
      trend: null
    },
    {
      title: 'Total Claimed',
      value: `${parseFloat(formatUnits(BigInt(analytics.totalClaimed), 8)).toLocaleString(undefined, { maximumFractionDigits: 2 })} BTC1USD`,
      icon: <Award className="h-5 w-5 text-emerald-400" />,
      change: null,
      trend: null
    },
    {
      title: 'Overall Claim Rate',
      value: `${analytics.overallClaimRate.toFixed(1)}%`,
      icon: <Activity className="h-5 w-5 text-violet-400" />,
      change: analytics.averageClaimRate - analytics.overallClaimRate,
      trend: analytics.averageClaimRate >= analytics.overallClaimRate ? 'up' : 'down'
    }
  ];

  // User participation metrics (if available)
  const userMetrics = analytics.userParticipation ? [
    {
      title: 'Your Participation',
      value: `${analytics.userParticipation.participationRate.toFixed(1)}%`,
      icon: <Users className="h-5 w-5 text-sky-400" />,
      change: null,
      trend: null
    },
    {
      title: 'Distributions Claimed',
      value: `${analytics.userParticipation.totalParticipated}/${analytics.userParticipation.totalPossible}`,
      icon: <Crown className="h-5 w-5 text-amber-400" />,
      change: null,
      trend: null
    },
    {
      title: 'Unclaimed Rewards',
      value: `${parseFloat(formatUnits(BigInt(analytics.userParticipation.unclaimedRewards), 8)).toLocaleString(undefined, { maximumFractionDigits: 2 })} BTC1USD`,
      icon: <Coins className="h-5 w-5 text-rose-400" />,
      change: null,
      trend: null
    }
  ] : [];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <Card key={index} className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur-sm hover:from-slate-800/70 transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">
                {metric.title}
              </CardTitle>
              {metric.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{metric.value}</div>
              {metric.change !== null && (
                <p className={`text-xs flex items-center mt-1 ${metric.trend === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {metric.trend === 'up' ? <TrendingUp className="inline h-3 w-3 mr-1" /> : <TrendingDown className="inline h-3 w-3 mr-1" />}
                  {Math.abs(metric.change).toFixed(1)}% from average
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* User Participation Metrics (if user is logged in) */}
      {userMetrics.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {userMetrics.map((metric, index) => (
            <Card key={index} className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur-sm hover:from-slate-800/70 transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-300">
                  {metric.title}
                </CardTitle>
                {metric.icon}
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-white">{metric.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity Chart */}
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Recent Distribution Activity</CardTitle>
            <CardDescription className="text-slate-400">
              Distribution volume and frequency over the last 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={recentActivityData}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                <XAxis 
                  dataKey="formattedDate" 
                  stroke={CHART_COLORS.text} 
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  stroke={CHART_COLORS.text} 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => value.toLocaleString()}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend content={<CustomLegend />} />
                <Bar 
                  dataKey="distributions" 
                  fill={CHART_COLORS.primary} 
                  name="Distributions" 
                  radius={[4, 4, 0, 0]} 
                />
                <Bar 
                  yAxisId="right" 
                  dataKey="rewardsFormatted" 
                  fill={CHART_COLORS.secondary} 
                  name="Rewards (BTC1USD)" 
                  radius={[4, 4, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribution Status Chart */}
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Distribution Status</CardTitle>
            <CardDescription className="text-slate-400">
              Active vs completed distributions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={distributionStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) => `${name}: ${((percent as number) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {distributionStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "rgba(30, 41, 59, 0.8)",
                    border: "1px solid rgba(51, 65, 85, 0.5)",
                    borderRadius: "8px",
                    backdropFilter: "blur(4px)"
                  }}
                  formatter={(value) => [value, 'Distributions']} 
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Distribution and Additional Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Distribution Card */}
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              Top Distribution
            </CardTitle>
            <CardDescription className="text-slate-400">
              Highest reward distribution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Distribution ID</span>
                <Badge variant="secondary" className="bg-indigo-900/50 text-indigo-200">
                  #{analytics.topDistribution.id}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Total Rewards</span>
                <span className="text-white font-medium">
                  {parseFloat(formatUnits(BigInt(analytics.topDistribution.rewards), 8)).toLocaleString(undefined, { maximumFractionDigits: 2 })} BTC1USD
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Claimed</span>
                <span className="text-white font-medium">
                  {parseFloat(formatUnits(BigInt(analytics.topDistribution.claimed), 8)).toLocaleString(undefined, { maximumFractionDigits: 2 })} BTC1USD
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Claim Rate</span>
                <Badge 
                  variant={analytics.topDistribution.claimRate >= 80 ? "default" : "secondary"}
                  className={analytics.topDistribution.claimRate >= 80 ? "bg-emerald-900/50 text-emerald-200" : "bg-amber-900/50 text-amber-200"}
                >
                  {analytics.topDistribution.claimRate.toFixed(1)}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Insights */}
        <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Protocol Insights</CardTitle>
            <CardDescription className="text-slate-400">
              Key performance indicators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Average Claim Rate</span>
                <span className="text-white font-medium">
                  {analytics.averageClaimRate.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Active Distributions</span>
                <Badge variant="default" className="bg-violet-900/50 text-violet-200">
                  {analytics.activeDistributions}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Completed Distributions</span>
                <Badge variant="secondary" className="bg-emerald-900/50 text-emerald-200">
                  {analytics.completedDistributions}
                </Badge>
              </div>
              <div className="pt-4 border-t border-slate-700">
                <h4 className="text-sm font-medium text-slate-300 mb-2">Performance Rating</h4>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500 rounded-full"
                      style={{ width: `${Math.min(100, analytics.overallClaimRate)}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-slate-300">
                    {analytics.overallClaimRate >= 90 ? 'Excellent' : 
                     analytics.overallClaimRate >= 75 ? 'Good' : 
                     analytics.overallClaimRate >= 60 ? 'Fair' : 'Needs Improvement'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}