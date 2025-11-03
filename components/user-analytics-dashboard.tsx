"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Coins,
  Calendar,
  Award,
  Activity
} from 'lucide-react';
import { formatUnits } from 'viem';
import { useAccount } from 'wagmi';

interface UserAnalyticsData {
  totalDistributions: number;
  participatedDistributions: number;
  participationRate: number;
  totalPossibleRewards: string;
  claimedRewards: string;
  unclaimedRewards: string;
  claimRate: number;
  recentClaims: {
    date: string;
    amount: string;
    distributionId: string;
  }[];
  distributionHistory: {
    id: string;
    possible: string;
    claimed: string;
    date: string;
    claimRate: number;
  }[];
}

export function AnalyticsDashboard() {
  const { address } = useAccount();
  
  // Mock data - in a real implementation, this would come from an API
  const mockData: UserAnalyticsData = {
    totalDistributions: 14,
    participatedDistributions: 12,
    participationRate: 85.7,
    totalPossibleRewards: "12500000000", // 125 BTC1USD
    claimedRewards: "11875000000", // 118.75 BTC1USD
    unclaimedRewards: "625000000", // 6.25 BTC1USD
    claimRate: 95.0,
    recentClaims: [
      { date: "2025-09-28", amount: "875000000", distributionId: "14" }, // 8.75 BTC1USD
      { date: "2025-09-21", amount: "875000000", distributionId: "13" }, // 8.75 BTC1USD
      { date: "2025-09-14", amount: "875000000", distributionId: "12" }, // 8.75 BTC1USD
      { date: "2025-09-07", amount: "875000000", distributionId: "11" }, // 8.75 BTC1USD
    ],
    distributionHistory: [
      { id: "14", possible: "1000000000", claimed: "875000000", date: "2025-09-28", claimRate: 87.5 },
      { id: "13", possible: "1000000000", claimed: "875000000", date: "2025-09-21", claimRate: 87.5 },
      { id: "12", possible: "1000000000", claimed: "875000000", date: "2025-09-14", claimRate: 87.5 },
      { id: "11", possible: "1000000000", claimed: "875000000", date: "2025-09-07", claimRate: 87.5 },
      { id: "10", possible: "1000000000", claimed: "875000000", date: "2025-08-31", claimRate: 87.5 },
      { id: "9", possible: "1000000000", claimed: "875000000", date: "2025-08-24", claimRate: 87.5 },
      { id: "8", possible: "1000000000", claimed: "875000000", date: "2025-08-17", claimRate: 87.5 },
      { id: "7", possible: "1000000000", claimed: "875000000", date: "2025-08-10", claimRate: 87.5 },
      { id: "6", possible: "1000000000", claimed: "875000000", date: "2025-08-03", claimRate: 87.5 },
      { id: "5", possible: "1000000000", claimed: "875000000", date: "2025-07-27", claimRate: 87.5 },
      { id: "4", possible: "1000000000", claimed: "875000000", date: "2025-07-20", claimRate: 87.5 },
      { id: "3", possible: "1000000000", claimed: "875000000", date: "2025-07-13", claimRate: 87.5 },
    ]
  };

  // Format data for charts
  const recentClaimsData = mockData.recentClaims.map(claim => ({
    ...claim,
    formattedDate: new Date(claim.date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    }),
    amountFormatted: parseFloat(formatUnits(BigInt(claim.amount), 8))
  }));

  const distributionHistoryData = mockData.distributionHistory.map(dist => ({
    ...dist,
    formattedDate: new Date(dist.date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    }),
    possibleFormatted: parseFloat(formatUnits(BigInt(dist.possible), 8)),
    claimedFormatted: parseFloat(formatUnits(BigInt(dist.claimed), 8))
  }));

  // Key metrics cards
  const metrics = [
    {
      title: 'Participation Rate',
      value: `${mockData.participationRate.toFixed(1)}%`,
      icon: <Users className="h-4 w-4" />,
      description: `${mockData.participatedDistributions}/${mockData.totalDistributions} distributions`
    },
    {
      title: 'Total Possible',
      value: `${parseFloat(formatUnits(BigInt(mockData.totalPossibleRewards), 8)).toLocaleString(undefined, { maximumFractionDigits: 2 })} BTC1USD`,
      icon: <Coins className="h-4 w-4" />,
      description: 'Total rewards you were eligible for'
    },
    {
      title: 'Claimed Rewards',
      value: `${parseFloat(formatUnits(BigInt(mockData.claimedRewards), 8)).toLocaleString(undefined, { maximumFractionDigits: 2 })} BTC1USD`,
      icon: <Award className="h-4 w-4" />,
      description: `${mockData.claimRate.toFixed(1)}% of possible rewards`
    },
    {
      title: 'Unclaimed Rewards',
      value: `${parseFloat(formatUnits(BigInt(mockData.unclaimedRewards), 8)).toLocaleString(undefined, { maximumFractionDigits: 2 })} BTC1USD`,
      icon: <Activity className="h-4 w-4" />,
      description: 'Rewards available for claiming'
    }
  ];

  if (!address) {
    return (
      <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700">
        <CardContent className="p-6 text-center">
          <p className="text-gray-400">Connect your wallet to view personalized analytics</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <Card key={index} className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-200">
                {metric.title}
              </CardTitle>
              {metric.icon}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{metric.value}</div>
              <p className="text-xs text-gray-400 mt-1">{metric.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Claims Chart */}
        <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Recent Claims</CardTitle>
            <CardDescription className="text-gray-400">
              Your reward claims over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={recentClaimsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="formattedDate" 
                  stroke="hsl(var(--muted-foreground))" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => value.toLocaleString()}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value) => [
                    `${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })} BTC1USD`,
                    'Amount'
                  ]}
                />
                <Bar 
                  dataKey="amountFormatted" 
                  fill="#8884d8" 
                  name="Claimed Amount" 
                  radius={[4, 4, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribution History Chart */}
        <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Distribution History</CardTitle>
            <CardDescription className="text-gray-400">
              Your participation in distributions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={distributionHistoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="formattedDate" 
                  stroke="hsl(var(--muted-foreground))" 
                  tick={{ fontSize: 12 }}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => value.toLocaleString()}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value, name) => [
                    `${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })} BTC1USD`,
                    name === 'possibleFormatted' ? 'Possible' : 'Claimed'
                  ]}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="possibleFormatted" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  name="Possible Rewards" 
                  dot={{ r: 4 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="claimedFormatted" 
                  stroke="#82ca9d" 
                  strokeWidth={2}
                  name="Claimed Rewards" 
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Distribution History */}
      <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Detailed Distribution History</CardTitle>
          <CardDescription className="text-gray-400">
            Your participation in each distribution
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Distribution</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Date</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Possible</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Claimed</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Claim Rate</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {mockData.distributionHistory.map((dist, index) => (
                  <tr key={index} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="py-3 px-4 text-white">#{dist.id}</td>
                    <td className="py-3 px-4 text-gray-300">{new Date(dist.date).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-gray-300">
                      {parseFloat(formatUnits(BigInt(dist.possible), 8)).toLocaleString(undefined, { maximumFractionDigits: 2 })} BTC1USD
                    </td>
                    <td className="py-3 px-4 text-gray-300">
                      {parseFloat(formatUnits(BigInt(dist.claimed), 8)).toLocaleString(undefined, { maximumFractionDigits: 2 })} BTC1USD
                    </td>
                    <td className="py-3 px-4">
                      <Badge 
                        variant={dist.claimRate >= 90 ? "default" : dist.claimRate >= 75 ? "secondary" : "destructive"}
                        className={
                          dist.claimRate >= 90 ? "bg-green-900/50 text-green-200" : 
                          dist.claimRate >= 75 ? "bg-yellow-900/50 text-yellow-200" : 
                          "bg-red-900/50 text-red-200"
                        }
                      >
                        {dist.claimRate.toFixed(1)}%
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="default" className="bg-blue-900/50 text-blue-200">
                        Claimed
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}