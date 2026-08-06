import React from 'react';
import { TaskAnalyticsItem } from '@/utils/teamLeaderAnalytics';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { 
  Users, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  DollarSign, 
  Settings2,
  TrendingUp,
  Activity
} from 'lucide-react';
import Link from 'next/link';

interface TaskAnalyticsCardProps {
  task: TaskAnalyticsItem;
}

export function TaskAnalyticsCard({ task }: TaskAnalyticsCardProps) {
  const isConfigured = task.rewardConfigured;
  const isActive = task.assignmentStatus === 'active';
  
  return (
    <Card className="flex flex-col bg-[var(--bg-card,#1e293b)] border-[var(--border-color,rgba(255,255,255,0.1))] overflow-hidden">
      <div className="p-5 flex-1">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="outline" className="bg-slate-800/50 text-slate-300 border-slate-700/50 text-[10px] px-1.5 uppercase tracking-wider">
                {task.category.replace('_', ' ')}
              </Badge>
              {isActive ? (
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" title="Active" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-slate-500" title={task.assignmentStatus} />
              )}
            </div>
            <h3 className="font-bold text-slate-100 text-lg leading-tight line-clamp-1">{task.title}</h3>
            {task.packageName && (
              <p className="text-xs text-slate-400 font-mono mt-1 line-clamp-1">{task.packageName}</p>
            )}
          </div>
          
          <div className="text-right shrink-0 ml-4">
            <div className="text-xs text-slate-400 mb-0.5">Leader Reward</div>
            {isConfigured ? (
              <div className="font-bold text-emerald-400 text-lg">₹{task.leaderReward}</div>
            ) : (
              <Badge variant="outline" className="text-amber-400 border-amber-400/30 bg-amber-400/5 text-[10px]">
                Pending
              </Badge>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-5">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-400 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              Completion Rate
            </span>
            <span className="font-medium text-slate-200">{task.completionPercent.toFixed(1)}%</span>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, task.completionPercent))}%` }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-slate-900/50 rounded-lg p-2.5 border border-slate-800/50">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium flex items-center gap-1 mb-1">
              <Users className="w-3 h-3" /> Enrolled
            </span>
            <div className="text-sm font-bold text-slate-200">
              {task.membersEnrolled} <span className="text-xs text-slate-500 font-normal">/ {task.remainingSlots === -1 ? '∞' : task.remainingSlots + task.membersEnrolled}</span>
            </div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-2.5 border border-slate-800/50">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium flex items-center gap-1 mb-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Approved
            </span>
            <div className="text-sm font-bold text-slate-200">{task.approved}</div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-2.5 border border-slate-800/50">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium flex items-center gap-1 mb-1">
              <Clock className="w-3 h-3 text-amber-400" /> Pending
            </span>
            <div className="text-sm font-bold text-slate-200">{task.pending}</div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-2.5 border border-slate-800/50">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium flex items-center gap-1 mb-1">
              <XCircle className="w-3 h-3 text-rose-400" /> Rejected
            </span>
            <div className="text-sm font-bold text-slate-200">{task.rejected}</div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-2.5 border border-slate-800/50">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium flex items-center gap-1 mb-1">
              <Activity className="w-3 h-3 text-blue-400" /> Submitted
            </span>
            <div className="text-sm font-bold text-slate-200">{task.submitted}</div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-2.5 border border-slate-800/50">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium flex items-center gap-1 mb-1">
              <DollarSign className="w-3 h-3 text-purple-400" /> Paid
            </span>
            <div className="text-sm font-bold text-slate-200">{task.paid}</div>
          </div>
        </div>

        <div className="flex justify-between items-center text-[10px] text-slate-500">
          <span>Assigned: {task.assignedAt ? format(new Date(task.assignedAt), 'MMM d, yyyy') : 'Unknown'}</span>
          {task.lastActivity && (
            <span>Activity: {format(new Date(task.lastActivity), 'MMM d')}</span>
          )}
        </div>
      </div>
      
      <div className="p-3 bg-slate-900/50 border-t border-slate-800 flex justify-end">
        <Link href="/team-leader/tasks" passHref>
          <Button variant="outline" size="sm" className="h-8 text-xs bg-transparent border-slate-700 hover:bg-slate-800">
            <Settings2 className="w-3.5 h-3.5 mr-1.5" />
            {isConfigured ? 'Edit Reward' : 'Configure Reward'}
          </Button>
        </Link>
      </div>
    </Card>
  );
}
