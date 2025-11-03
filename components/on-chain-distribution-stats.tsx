"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useOnChainDistributionStats } from '@/hooks/use-on-chain-distribution-stats';
import { RefreshCw, TrendingUp, Users, Wallet, AlertCircle } from 'lucide-react';

/**
 * OnChainDistributionStats Component
 *
 * Displays distribution statistics read directly from smart contracts.
 * Much faster than scanning historical events!
 *
 * Features:
 * - Real-time on-chain data
 * - No event scanning required
 * - Auto-refresh every 30 seconds
 * - Breakdown by Dev/Endowment wallets
 */
export function OnChainDistributionStats() {
  const { stats, loading, error, refresh } = useOnChainDistributionStats();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>On-Chain Distribution Statistics</CardTitle>
          <CardDescription>Loading from blockchain...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>On-Chain Distribution Statistics</CardTitle>
          <CardDescription>Error loading statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-destructive mb-4">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
          <Button onClick={refresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Distribution Statistics</h2>
          <p className="text-muted-foreground">
            Real-time on-chain data • No event scanning required
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Distributions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDistributions}</div>
            <p className="text-xs text-muted-foreground">
              {stats.devTotalDistributions} dev + {stats.endowmentTotalDistributions} endowment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Distributed</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalAmount.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">BTC1USD</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recipients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRecipients}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalFailed} failed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.successRate.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">Overall success</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Dev Wallet */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Dev Wallet</CardTitle>
              <Badge>Developer</Badge>
            </div>
            <CardDescription>Distribution statistics from Dev Wallet</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Distributions</div>
                <div className="text-2xl font-bold">{stats.devTotalDistributions}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Amount</div>
                <div className="text-2xl font-bold">{stats.devTotalAmount.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Recipients</div>
                <div className="text-2xl font-bold">{stats.devTotalRecipients}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Failed</div>
                <div className="text-2xl font-bold text-destructive">{stats.devTotalFailed}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Endowment Wallet */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Endowment Wallet</CardTitle>
              <Badge variant="secondary">Endowment</Badge>
            </div>
            <CardDescription>Distribution statistics from Endowment Wallet</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Distributions</div>
                <div className="text-2xl font-bold">{stats.endowmentTotalDistributions}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Amount</div>
                <div className="text-2xl font-bold">{stats.endowmentTotalAmount.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Recipients</div>
                <div className="text-2xl font-bold">{stats.endowmentTotalRecipients}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Failed</div>
                <div className="text-2xl font-bold text-destructive">{stats.endowmentTotalFailed}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Banner */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">On-Chain Tracking</p>
              <p className="text-sm text-muted-foreground">
                These statistics are stored directly on the blockchain and updated automatically
                with each distribution. No event scanning required!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
