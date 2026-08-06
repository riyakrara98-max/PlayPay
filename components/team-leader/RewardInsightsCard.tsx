import React from 'react';
import { Card } from '@/components/ui/card';
import { RewardInsights } from '@/utils/teamLeaderAnalytics';
import { Coins, Settings, TrendingUp, TrendingDown, LayoutDashboard } from 'lucide-react';

interface RewardInsightsCardProps {
  insights: RewardInsights;
}

export function RewardInsightsCard({ insights }: RewardInsightsCardProps) {
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  return (
    <Card className="p-6 bg-[var(--bg-card,#1e293b)] border-[var(--border-color,rgba(255,255,255,0.1))]">
      <div className="flex items-center gap-2 mb-6">
        <LayoutDashboard className="w-5 h-5 text-indigo-400" />
        <h3 className="font-bold text-slate-100">Reward Configuration Insights</h3>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="space-y-1">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Settings className="w-3.5 h-3.5" />
            Configured
          </div>
          <div className="text-lg font-bold text-emerald-400">{insights.configuredCount}</div>
        </div>
        
        <div className="space-y-1">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Settings className="w-3.5 h-3.5 opacity-50" />
            Pending
          </div>
          <div className="text-lg font-bold text-amber-400">{insights.pendingCount}</div>
        </div>

        <div className="space-y-1">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5" />
            Average
          </div>
          <div className="text-lg font-bold text-slate-200">{formatCurrency(insights.averageReward)}</div>
        </div>

        <div className="space-y-1">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            Highest
          </div>
          <div className="text-lg font-bold text-slate-200">{formatCurrency(insights.highestReward)}</div>
        </div>

        <div className="space-y-1">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
            Lowest
          </div>
          <div className="text-lg font-bold text-slate-200">{formatCurrency(insights.lowestReward)}</div>
        </div>
      </div>
    </Card>
  );
}
