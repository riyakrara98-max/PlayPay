'use client';

import React, { useState, useMemo } from 'react';
import { ShieldCheck, Search, Filter, ArrowUpDown, AlertCircle, RefreshCw, CheckSquare } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useTeamLeaderAnalytics } from '@/hooks/useTeamLeaderAnalytics';
import { AnalyticsSummary } from '@/components/team-leader/AnalyticsSummary';
import { TaskAnalyticsCard } from '@/components/team-leader/TaskAnalyticsCard';
import { RewardInsightsCard } from '@/components/team-leader/RewardInsightsCard';
import { RecentActivityCard } from '@/components/team-leader/RecentActivityCard';
import { format } from 'date-fns';

type FilterType = 'all' | 'active' | 'pending_reward' | 'completed' | 'paused';
type SortType = 'newest' | 'oldest' | 'reward_high' | 'reward_low' | 'completion_high';

export default function TeamLeaderDashboardPage() {
  const { userProfile } = useAuth();
  const leaderName = userProfile?.displayName || 'Leader';
  const currentDate = format(new Date(), 'MMMM d, yyyy');

  const {
    loading,
    error,
    metrics,
    taskAnalytics,
    rewardInsights,
    recentActivity
  } = useTeamLeaderAnalytics();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortType, setSortType] = useState<SortType>('newest');

  const filteredAndSortedTasks = useMemo(() => {
    let result = [...taskAnalytics];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.title.toLowerCase().includes(q) ||
        t.packageName.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    }

    // Filter
    if (filterType !== 'all') {
      result = result.filter(t => {
        switch (filterType) {
          case 'active':
            return t.assignmentStatus === 'active';
          case 'pending_reward':
            return !t.rewardConfigured;
          case 'completed':
            return t.remainingSlots === 0; // Or some other completion metric
          case 'paused':
            return t.assignmentStatus === 'paused';
          default:
            return true;
        }
      });
    }

    // Sort
    result.sort((a, b) => {
      switch (sortType) {
        case 'newest':
          return new Date(b.assignedAt || 0).getTime() - new Date(a.assignedAt || 0).getTime();
        case 'oldest':
          return new Date(a.assignedAt || 0).getTime() - new Date(b.assignedAt || 0).getTime();
        case 'reward_high':
          return (b.leaderReward || 0) - (a.leaderReward || 0);
        case 'reward_low':
          return (a.leaderReward || 0) - (b.leaderReward || 0);
        case 'completion_high':
          return b.completionPercent - a.completionPercent;
        default:
          return 0;
      }
    });

    return result;
  }, [taskAnalytics, searchQuery, filterType, sortType]);


  if (error) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <Card className="p-8 text-center bg-red-500/5 border-red-500/20 text-red-400 space-y-3">
          <AlertCircle className="w-8 h-8 mx-auto" />
          <h3 className="font-bold text-sm">Unable to Load Dashboard</h3>
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
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900/40 to-slate-900 border border-emerald-500/20 rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Team Leader Workspace</span>
              <span className="text-slate-500 px-2">•</span>
              <span className="text-slate-400">{currentDate}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
              Welcome back, {leaderName}
            </h1>
          </div>
          <div className="flex items-center gap-6 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
            <div>
              <div className="text-xs text-slate-400 mb-1">Tasks</div>
              <div className="text-xl font-bold text-slate-200">{metrics.totalAssignedTasks}</div>
            </div>
            <div className="w-px h-8 bg-slate-800"></div>
            <div>
              <div className="text-xs text-slate-400 mb-1">Members</div>
              <div className="text-xl font-bold text-slate-200">{metrics.membersWorking}</div>
            </div>
            <div className="w-px h-8 bg-slate-800"></div>
            <div>
              <div className="text-xs text-slate-400 mb-1">Completion</div>
              <div className="text-xl font-bold text-emerald-400">{metrics.completionRate.toFixed(1)}%</div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-slate-800/50 rounded-xl"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-16 bg-slate-800/50 rounded-xl"></div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="h-64 bg-slate-800/50 rounded-xl"></div>
                 <div className="h-64 bg-slate-800/50 rounded-xl"></div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="h-40 bg-slate-800/50 rounded-xl"></div>
              <div className="h-80 bg-slate-800/50 rounded-xl"></div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <AnalyticsSummary metrics={metrics} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Main Content Area (Tasks) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Task Controls */}
              <Card className="p-4 bg-[var(--bg-card,#1e293b)] border-[var(--border-color,rgba(255,255,255,0.1))] space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-4 justify-between">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-900/60 border border-slate-700/60 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-slate-900/60 border border-slate-700/60 rounded-xl px-3 py-1.5">
                    <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value as FilterType)}
                      className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer max-w-[120px]"
                    >
                      <option value="all" className="bg-slate-900 text-slate-200">All Tasks</option>
                      <option value="active" className="bg-slate-900 text-slate-200">Active</option>
                      <option value="pending_reward" className="bg-slate-900 text-slate-200">Pending Setup</option>
                      <option value="completed" className="bg-slate-900 text-slate-200">Completed</option>
                      <option value="paused" className="bg-slate-900 text-slate-200">Paused</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-900/60 border border-slate-700/60 rounded-xl px-3 py-1.5">
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <select
                      value={sortType}
                      onChange={(e) => setSortType(e.target.value as SortType)}
                      className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer max-w-[130px]"
                    >
                      <option value="newest" className="bg-slate-900 text-slate-200">Newest</option>
                      <option value="oldest" className="bg-slate-900 text-slate-200">Oldest</option>
                      <option value="reward_high" className="bg-slate-900 text-slate-200">Reward: High</option>
                      <option value="reward_low" className="bg-slate-900 text-slate-200">Reward: Low</option>
                      <option value="completion_high" className="bg-slate-900 text-slate-200">Highest Completion</option>
                    </select>
                  </div>
                </div>
              </Card>

              {/* Task Grid */}
              {filteredAndSortedTasks.length === 0 ? (
                 <Card className="p-12 text-center bg-[var(--bg-card,#1e293b)] border-[var(--border-color,rgba(255,255,255,0.1))]">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                      <CheckSquare className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-slate-200 text-base mb-1">
                      {taskAnalytics.length === 0 ? 'No tasks assigned' : 'No matching tasks'}
                    </h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      {taskAnalytics.length === 0
                        ? "Your administrator hasn't assigned any tasks yet."
                        : 'Try adjusting your search query or status filter.'}
                    </p>
                  </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredAndSortedTasks.map((task) => (
                    <TaskAnalyticsCard key={task.taskId} task={task} />
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar (Insights & Activity) */}
            <div className="space-y-6">
              <RewardInsightsCard insights={rewardInsights} />
              <RecentActivityCard activities={recentActivity} />
            </div>

          </div>
        </>
      )}
    </div>
  );
}
