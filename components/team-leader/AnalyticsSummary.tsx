import React from 'react';
import { Card } from '@/components/ui/card';
import { TeamLeaderMetrics } from '@/utils/teamLeaderAnalytics';
import { 
  CheckSquare, 
  Users, 
  Clock, 
  CheckCircle2, 
  DollarSign, 
  Wallet, 
  TrendingUp, 
  AlertCircle,
  Settings2
} from 'lucide-react';

interface AnalyticsSummaryProps {
  metrics: TeamLeaderMetrics;
}

export function AnalyticsSummary({ metrics }: AnalyticsSummaryProps) {
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const stats = [
    {
      title: 'Assigned Tasks',
      value: metrics.totalAssignedTasks,
      icon: CheckSquare,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      subtitle: `${metrics.activeAssignments} active`,
    },
    {
      title: 'Members Working',
      value: metrics.membersWorking,
      icon: Users,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10',
      subtitle: 'Active enrollments',
    },
    {
      title: 'Pending Review',
      value: metrics.pendingReview,
      icon: Clock,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      subtitle: 'Submissions to verify',
    },
    {
      title: 'Approved',
      value: metrics.approvedSubmissions,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      subtitle: `${metrics.completionRate.toFixed(1)}% completion`,
    },
    {
      title: 'Configured Rewards',
      value: metrics.configuredRewards,
      icon: Settings2,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      subtitle: `${metrics.pendingRewardConfiguration} pending setup`,
    },
    {
      title: 'Outstanding Liability',
      value: formatCurrency(metrics.outstandingLiability),
      icon: AlertCircle,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10',
      subtitle: 'To be paid out',
    },
    {
      title: 'Total Paid',
      value: formatCurrency(metrics.paidCost),
      icon: DollarSign,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      subtitle: `${metrics.paidSubmissions} paid submissions`,
    },
    {
      title: 'Potential Payout',
      value: formatCurrency(metrics.potentialPayout),
      icon: TrendingUp,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      subtitle: 'If all slots filled',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <Card
            key={idx}
            className="p-5 bg-[var(--bg-card,#1e293b)] border-[var(--border-color,rgba(255,255,255,0.1))] flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400">{stat.title}</span>
              <div className={`p-2 rounded-xl ${stat.bgColor} ${stat.color}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight">
                {stat.value}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">{stat.subtitle}</p>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
