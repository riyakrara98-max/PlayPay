import React from 'react';
import { Card } from '@/components/ui/card';
import { ActivityItem } from '@/utils/teamLeaderAnalytics';
import { formatDistanceToNow } from 'date-fns';
import { parseDateInput } from '@/utils/formatters';
import { Activity, CheckCircle2, Clock, DollarSign, XCircle, UserPlus } from 'lucide-react';

interface RecentActivityCardProps {
  activities: ActivityItem[];
}

export function RecentActivityCard({ activities }: RecentActivityCardProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'enrolled':
        return <UserPlus className="w-4 h-4 text-blue-400" />;
      case 'submitted':
        return <Clock className="w-4 h-4 text-amber-400" />;
      case 'approved':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-rose-400" />;
      case 'paid':
        return <DollarSign className="w-4 h-4 text-purple-400" />;
      default:
        return <Activity className="w-4 h-4 text-slate-400" />;
    }
  };

  const getActivityText = (type: string, userName: string, taskTitle: string) => {
    switch (type) {
      case 'enrolled':
        return <span className="text-slate-300"><span className="font-medium text-slate-200">{userName}</span> enrolled in <span className="text-indigo-300">{taskTitle}</span></span>;
      case 'submitted':
        return <span className="text-slate-300"><span className="font-medium text-slate-200">{userName}</span> submitted <span className="text-indigo-300">{taskTitle}</span></span>;
      case 'approved':
        return <span className="text-slate-300">Approved <span className="font-medium text-slate-200">{userName}</span> for <span className="text-indigo-300">{taskTitle}</span></span>;
      case 'rejected':
        return <span className="text-slate-300">Rejected <span className="font-medium text-slate-200">{userName}</span> for <span className="text-indigo-300">{taskTitle}</span></span>;
      case 'paid':
        return <span className="text-slate-300">Payment processed for <span className="font-medium text-slate-200">{userName}</span> (<span className="text-indigo-300">{taskTitle}</span>)</span>;
      default:
        return <span className="text-slate-300">Activity on <span className="text-indigo-300">{taskTitle}</span></span>;
    }
  };

  if (activities.length === 0) {
    return (
      <Card className="p-8 bg-[var(--bg-card,#1e293b)] border-[var(--border-color,rgba(255,255,255,0.1))] text-center">
        <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center mx-auto mb-3">
          <Activity className="w-5 h-5 text-slate-500" />
        </div>
        <h3 className="font-medium text-slate-200 text-sm mb-1">No Recent Activity</h3>
        <p className="text-xs text-slate-400">Activity from your team members will appear here.</p>
      </Card>
    );
  }

  return (
    <Card className="bg-[var(--bg-card,#1e293b)] border-[var(--border-color,rgba(255,255,255,0.1))] overflow-hidden">
      <div className="p-4 border-b border-slate-800 flex items-center gap-2">
        <Activity className="w-4 h-4 text-slate-400" />
        <h3 className="font-bold text-slate-100 text-sm">Recent Team Activity</h3>
      </div>
      <div className="divide-y divide-slate-800 max-h-[400px] overflow-y-auto">
        {activities.map((activity, idx) => (
          <div key={`${activity.userId}-${activity.taskId}-${activity.timestamp}-${idx}`} className="p-4 flex gap-3 hover:bg-slate-900/30 transition-colors">
            <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              activity.type === 'enrolled' ? 'bg-blue-500/10' :
              activity.type === 'submitted' ? 'bg-amber-500/10' :
              activity.type === 'approved' ? 'bg-emerald-500/10' :
              activity.type === 'rejected' ? 'bg-rose-500/10' :
              activity.type === 'paid' ? 'bg-purple-500/10' : 'bg-slate-800'
            }`}>
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm leading-snug break-words">
                {getActivityText(activity.type, activity.userName, activity.taskTitle)}
              </p>
              <div className="text-[10px] text-slate-500 mt-1.5 flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                {(() => {
                  const d = parseDateInput(activity.timestamp);
                  return d ? formatDistanceToNow(d, { addSuffix: true }) : 'Unknown time';
                })()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
