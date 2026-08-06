'use client';

import React from 'react';
import {
  FileBarChart,
  CheckSquare,
  Users,
  CheckCircle2,
  Coins,
  Clock,
  UserCheck,
  TrendingUp,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTeamLeaderAnalytics } from '@/hooks/useTeamLeaderAnalytics';
import { AnalyticsSummary } from '@/components/team-leader/AnalyticsSummary';
import { RewardInsightsCard } from '@/components/team-leader/RewardInsightsCard';

export default function TeamLeaderAnalyticsPage() {
  const { loading, error, metrics, rewardInsights } = useTeamLeaderAnalytics();

  if (error) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <Card className="p-8 text-center bg-red-500/5 border-red-500/20 text-red-400 space-y-3">
          <AlertCircle className="w-8 h-8 mx-auto" />
          <h3 className="font-bold text-sm">Unable to Load Analytics</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="mt-4"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-2" />
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
            <FileBarChart className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Team Analytics</h1>
            <p className="text-xs text-slate-400">
              Detailed breakdown of team tasks, completion rate, member activity, and financial rewards.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="h-24 bg-slate-800/50 rounded-xl"></div>
            <div className="h-24 bg-slate-800/50 rounded-xl"></div>
            <div className="h-24 bg-slate-800/50 rounded-xl"></div>
            <div className="h-24 bg-slate-800/50 rounded-xl"></div>
          </div>
          <div className="h-64 bg-slate-800/50 rounded-xl"></div>
        </div>
      ) : (
        <>
          {/* Reuse standard Analytics Summary metrics grid */}
          <AnalyticsSummary metrics={metrics} />

          {/* Extended Metrics & Insights Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <RewardInsightsCard insights={rewardInsights} />

            <Card className="p-5 bg-[var(--bg-card,#1e293b)] border-[var(--border-color,rgba(255,255,255,0.1))] space-y-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-slate-100">Performance Summary</h3>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <CheckSquare className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-medium text-slate-300">Total Assigned Tasks</span>
                  </div>
                  <span className="text-sm font-bold text-slate-100">{metrics.totalAssignedTasks}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <UserCheck className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-medium text-slate-300">Active Working Members</span>
                  </div>
                  <span className="text-sm font-bold text-slate-100">{metrics.membersWorking}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-medium text-slate-300">Team Completion Rate</span>
                  </div>
                  <span className="text-sm font-bold text-emerald-400">{metrics.completionRate.toFixed(1)}%</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50 border border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <Coins className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs font-medium text-slate-300">Potential Total Payout</span>
                  </div>
                  <span className="text-sm font-bold text-yellow-400">₹{metrics.potentialPayout.toLocaleString()}</span>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
