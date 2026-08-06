import React from 'react';
import Image from 'next/image';
import { format } from 'date-fns';
import { AssignedTask } from '@/hooks/useTeamLeaderAssignedTasks';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Coins, Edit2, PlayCircle, Settings2, Users } from 'lucide-react';
import Markdown from 'react-markdown';

interface AssignedTaskCardProps {
  assignedTask: AssignedTask;
  onConfigureReward: (task: AssignedTask) => void;
}

export function AssignedTaskCard({ assignedTask, onConfigureReward }: AssignedTaskCardProps) {
  const { task, assignment } = assignedTask;
  const isConfigured = assignment.leaderReward !== null;
  const isTaskActive = task.status === 'active';

  return (
    <Card className="flex flex-col overflow-hidden bg-[var(--bg-card,#1e293b)] border-[var(--border-color,rgba(255,255,255,0.1))] hover:border-amber-500/30 transition-colors">
      <div className="p-5 flex-1 flex flex-col">
        {/* Header: Icon, Category, Status */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {task.appIconUrl ? (
              <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-slate-700">
                <Image
                  src={task.appIconUrl}
                  alt={task.appName || task.title}
                  fill
                  className="object-cover"
                  referrerPolicy="no-referrer"
                  
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700">
                <PlayCircle className="w-6 h-6 text-slate-400" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="bg-slate-800/50 text-slate-300 border-slate-700/50 text-[10px] px-1.5 uppercase tracking-wider">
                  {task.category.replace('_', ' ')}
                </Badge>
                {isTaskActive ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" title="Task Active" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-red-500" title={`Task ${task.status}`} />
                )}
              </div>
              <h3 className="font-bold text-slate-100 text-lg leading-tight line-clamp-1">
                {task.title}
              </h3>
            </div>
          </div>
        </div>

        {/* Package Name / Subtitle */}
        {task.packageName && (
          <p className="text-xs text-slate-400 font-mono mb-4 line-clamp-1">{task.packageName}</p>
        )}

        {/* Instructions Preview */}
        {task.instructions && (
          <div className="mb-5 text-sm text-slate-300 line-clamp-2 prose prose-invert prose-p:my-0 prose-p:leading-snug">
            <Markdown>{task.instructions}</Markdown>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3 mb-5 mt-auto">
          <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800/50 flex flex-col justify-center">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium mb-1">Submissions</span>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-bold text-slate-200">
                {task.currentSubmissions || 0} / {task.totalSlots || '∞'}
              </span>
            </div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800/50 flex flex-col justify-center">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-medium mb-1">Base Reward</span>
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-bold text-slate-200">₹{task.baseReward || 0}</span>
            </div>
          </div>
        </div>
        
        <div className="text-[10px] text-slate-500 mb-2">
          Assigned: {assignment.assignedAt ? format(new Date(assignment.assignedAt), 'MMM d, yyyy') : 'Unknown'}
        </div>
      </div>

      {/* Footer: Configuration Action */}
      <div className="p-4 bg-slate-900/50 border-t border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isConfigured ? (
            <>
              <Badge className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/20">Configured</Badge>
              <span className="font-bold text-emerald-400 text-lg">₹{assignment.leaderReward}</span>
            </>
          ) : (
            <Badge variant="outline" className="text-amber-400 border-amber-400/30 bg-amber-400/5">Pending Setup</Badge>
          )}
        </div>
        
        <Button
          size="sm"
          variant={isConfigured ? 'outline' : 'primary'}
          className={!isConfigured ? 'bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold' : 'border-slate-700 hover:bg-slate-800'}
          onClick={() => onConfigureReward(assignedTask)}
        >
          {isConfigured ? (
            <>
              <Edit2 className="w-3.5 h-3.5 mr-1.5" />
              Edit
            </>
          ) : (
            <>
              <Settings2 className="w-3.5 h-3.5 mr-1.5" />
              Configure
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
