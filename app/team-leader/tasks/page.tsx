'use client';

import React, { useState, useMemo } from 'react';
import {
  CheckSquare,
  Search,
  Filter,
  ArrowUpDown,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTeamLeaderAssignedTasks, AssignedTask } from '@/hooks/useTeamLeaderAssignedTasks';
import { AssignedTaskCard } from '@/components/team-leader/AssignedTaskCard';
import { TeamTaskSkeleton } from '@/components/team-leader/TeamTaskSkeleton';
import { RewardConfigurationModal } from '@/components/team-leader/RewardConfigurationModal';

type FilterType = 'all' | 'configured' | 'pending';
type SortType = 'newest' | 'oldest' | 'reward_high' | 'reward_low' | 'task_asc';

export default function TeamLeaderTasksPage() {
  const { assignedTasks, loading, error } = useTeamLeaderAssignedTasks();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortType, setSortType] = useState<SortType>('newest');

  const [selectedTask, setSelectedTask] = useState<AssignedTask | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredAndSortedTasks = useMemo(() => {
    let result = [...assignedTasks];

    // Filter by Search Query (Task Name, Package Name, Category)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((item) => {
        const { task } = item;
        return (
          task.title.toLowerCase().includes(q) ||
          (task.packageName && task.packageName.toLowerCase().includes(q)) ||
          task.category.toLowerCase().includes(q)
        );
      });
    }

    // Filter by Reward Status
    if (filterType === 'configured') {
      result = result.filter((item) => item.assignment.leaderReward !== null);
    } else if (filterType === 'pending') {
      result = result.filter((item) => item.assignment.leaderReward === null);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortType) {
        case 'newest': {
          const timeA = new Date(a.assignment.assignedAt).getTime() || 0;
          const timeB = new Date(b.assignment.assignedAt).getTime() || 0;
          return timeB - timeA;
        }
        case 'oldest': {
          const timeA = new Date(a.assignment.assignedAt).getTime() || 0;
          const timeB = new Date(b.assignment.assignedAt).getTime() || 0;
          return timeA - timeB;
        }
        case 'reward_high': {
          const rA = a.assignment.leaderReward || 0;
          const rB = b.assignment.leaderReward || 0;
          return rB - rA;
        }
        case 'reward_low': {
          const rA = a.assignment.leaderReward || 0;
          const rB = b.assignment.leaderReward || 0;
          // Handle nulls by putting them at the top/bottom depending on preference, we'll treat them as 0
          return rA - rB;
        }
        case 'task_asc': {
          return a.task.title.localeCompare(b.task.title);
        }
        default:
          return 0;
      }
    });

    return result;
  }, [assignedTasks, searchQuery, filterType, sortType]);

  const handleConfigureReward = (task: AssignedTask) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Assigned Tasks</h1>
            <p className="text-xs text-slate-400">Configure rewards for tasks assigned to your team.</p>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <Card className="p-4 bg-[var(--bg-card,#1e293b)] border-[var(--border-color,rgba(255,255,255,0.1))] space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-4 justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by task name, package, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900/60 border border-slate-700/60 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-900/60 border border-slate-700/60 rounded-xl px-3 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as FilterType)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-slate-200">All Statuses</option>
              <option value="configured" className="bg-slate-900 text-slate-200">Configured</option>
              <option value="pending" className="bg-slate-900 text-slate-200">Pending Setup</option>
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-1.5 bg-slate-900/60 border border-slate-700/60 rounded-xl px-3 py-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={sortType}
              onChange={(e) => setSortType(e.target.value as SortType)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="newest" className="bg-slate-900 text-slate-200">Newest Assignment</option>
              <option value="oldest" className="bg-slate-900 text-slate-200">Oldest Assignment</option>
              <option value="reward_high" className="bg-slate-900 text-slate-200">Reward: High to Low</option>
              <option value="reward_low" className="bg-slate-900 text-slate-200">Reward: Low to High</option>
              <option value="task_asc" className="bg-slate-900 text-slate-200">Task Name A-Z</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Cards Grid / Loading / Error / Empty States */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <TeamTaskSkeleton />
          <TeamTaskSkeleton />
          <TeamTaskSkeleton />
        </div>
      ) : error ? (
        <Card className="p-8 text-center bg-red-500/5 border-red-500/20 text-red-400 space-y-3">
          <AlertCircle className="w-8 h-8 mx-auto" />
          <h3 className="font-bold text-sm">Unable to Load Assigned Tasks</h3>
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
      ) : filteredAndSortedTasks.length === 0 ? (
        <Card className="p-12 text-center bg-[var(--bg-card,#1e293b)] border-[var(--border-color,rgba(255,255,255,0.1))]">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <CheckSquare className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-200 text-base mb-1">
            {assignedTasks.length === 0 ? 'No tasks assigned' : 'No matching tasks'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {assignedTasks.length === 0
              ? "Your administrator hasn't assigned any tasks yet."
              : 'Try adjusting your search query or status filter.'}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedTasks.map((assignedTask) => (
            <AssignedTaskCard
              key={assignedTask.assignment.id}
              assignedTask={assignedTask}
              onConfigureReward={handleConfigureReward}
            />
          ))}
        </div>
      )}

      {/* Reward Configuration Modal */}
      <RewardConfigurationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        assignedTask={selectedTask}
      />
    </div>
  );
}
