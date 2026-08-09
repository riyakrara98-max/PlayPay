'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ShieldCheck,
  Smartphone,
  ChevronRight,
  Flame,
  Clock,
  Zap,
  Timer,
  Sparkles,
} from 'lucide-react';
import { TaskDocument } from '@/types/firestore';
import { useAuthContext } from '@/contexts/AuthContext';
import { useEnrollTask } from '@/hooks/useEnrollTask';
import { useEnrollmentStatus } from '@/hooks/useEnrollmentStatus';
import { useTaskAvailability } from '@/hooks/useTaskAvailability';
import { TaskDetailsBottomSheet } from '@/components/tasks/TaskDetailsBottomSheet';
import { resolveMemberReward } from '@/lib/rewardResolver';
import { formatRemainingTime } from '@/utils/formatters';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface TaskCardProps {
  task: TaskDocument;
}

export function TaskCard({ task }: TaskCardProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { userProfile } = useAuthContext();
  const { isEnrolled, enrollment } = useEnrollmentStatus(task.id);
  const { enrollTask, isEnrolling } = useEnrollTask();
  const availability = useTaskAvailability(task, isEnrolled);

  const displayReward = resolveMemberReward(task.rewardAmount, userProfile?.effectiveReward);
  const remainingTimeStr = formatRemainingTime(task.expiresAt);

  const {
    remainingSlots,
    status: computedStatus,
    isFull,
    isExpired: isTaskExpired,
  } = availability;

  const handleRowClick = () => {
    setIsSheetOpen(true);
  };

  const handleEnrollClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isEnrolled) {
      window.location.href = `/my-tasks/${enrollment?.id}`;
      return;
    }
    if (!isEnrolling && (computedStatus === 'available' || computedStatus === 'almost_full')) {
      await enrollTask(task.id, task);
    } else {
      setIsSheetOpen(true);
    }
  };

  const isButtonDisabled =
    isEnrolling || (isFull && !isEnrolled) || (isTaskExpired && !isEnrolled);

  let buttonLabel = 'Enroll Now';
  if (isEnrolled) buttonLabel = 'In Progress';
  else if (isTaskExpired) buttonLabel = 'Expired';
  else if (isFull) buttonLabel = 'Full';

  // Category label helper
  const getCategoryLabel = (cat?: string) => {
    switch (cat) {
      case 'app_download':
        return 'App Review';
      case 'survey':
        return 'Quick Survey';
      case 'video_watch':
        return 'Video Task';
      case 'social_follow':
        return 'Social Task';
      default:
        return 'App Task';
    }
  };

  const isHotTask = displayReward >= 25 || remainingSlots <= 10;

  return (
    <>
      <Card
        variant="elevated"
        className="group relative p-4 hover:border-[var(--primary)]/50 cursor-pointer flex flex-col justify-between gap-3 min-h-[115px] overflow-hidden transition-all duration-200 active:scale-[0.99] shadow-xs hover:shadow-md"
        onClick={handleRowClick}
      >
        {/* Top Header Row: Icon + Title + DOMINANT REWARD */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* App Icon */}
            <div className="relative w-12 h-12 rounded-[var(--radius-md)] bg-[var(--surface-elevated)] border border-[var(--border)] flex items-center justify-center shrink-0 overflow-hidden shadow-2xs group-hover:scale-105 transition-transform duration-200">
              {task.appIcon ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={task.appIcon}
                  alt={task.appName || task.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Smartphone className="w-6 h-6 text-[var(--primary)]" />
              )}
            </div>

            {/* Title & App Info */}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-[var(--text-primary)] truncate">
                  {task.appName || 'Partner App'}
                </span>
                {task.isVerified && (
                  <ShieldCheck className="w-3.5 h-3.5 text-[var(--primary)] shrink-0" />
                )}
                {isHotTask && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-[var(--radius-pill)] bg-amber-500/10 text-amber-500 text-[9px] font-extrabold uppercase">
                    <Flame className="w-2.5 h-2.5 fill-current" /> Hot
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--text-secondary)] font-medium line-clamp-1 mt-0.5">
                {task.title}
              </p>
            </div>
          </div>

          {/* DOMINANT REWARD BADGE */}
          <div className="shrink-0 text-right">
            <div className="inline-flex items-center gap-0.5 px-3 py-1 rounded-[var(--radius-pill)] bg-[var(--success)]/15 border border-[var(--success)]/30 shadow-2xs">
              <span className="text-xs font-extrabold text-[var(--success)]">₹</span>
              <span className="text-lg sm:text-xl font-black text-[var(--success)] font-mono tabular-nums leading-none tracking-tight">
                {displayReward}
              </span>
            </div>
            <span className="block text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mt-0.5">
              Cash Reward
            </span>
          </div>
        </div>

        {/* Bottom Row: Metadata Pills (Including Mandatory Remaining Time) + Action Button */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--border)]/60">
          {/* Metadata Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant="neutral" size="sm">
              {getCategoryLabel(task.category)}
            </Badge>

            {/* Mandatory Remaining Time Indicator */}
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--warning)] bg-[var(--warning)]/10 px-2 py-0.5 rounded-[var(--radius-pill)] border border-[var(--warning)]/20 tabular-nums">
              <Timer className="w-3 h-3 text-[var(--warning)] shrink-0" />
              {remainingTimeStr}
            </span>

            {/* Slots Left */}
            <Badge
              variant={isFull ? 'danger' : remainingSlots <= 5 ? 'warning' : 'success'}
              size="sm"
              className="tabular-nums"
            >
              {remainingSlots <= 5 && !isFull && (
                <Flame className="w-3 h-3 fill-current animate-pulse shrink-0 inline-block mr-1" />
              )}
              {isFull ? 'Full' : `${remainingSlots} spots left`}
            </Badge>
          </div>

          {/* Action CTA Button */}
          <Button
            size="sm"
            variant={isEnrolled ? 'success' : isButtonDisabled ? 'outline' : 'primary'}
            isLoading={isEnrolling}
            disabled={isButtonDisabled}
            onClick={handleEnrollClick}
            rightIcon={!isButtonDisabled && !isEnrolled ? <ChevronRight className="w-3.5 h-3.5" /> : undefined}
            className="shrink-0 min-h-[38px] px-3.5 font-bold shadow-xs"
          >
            {buttonLabel}
          </Button>
        </div>
      </Card>

      {/* Bottom Sheet for Task Details */}
      <TaskDetailsBottomSheet
        task={task}
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
      />
    </>
  );
}


