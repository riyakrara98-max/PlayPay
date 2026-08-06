'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ShieldCheck,
  Smartphone,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { TaskDocument } from '@/types/firestore';
import { useAuthContext } from '@/contexts/AuthContext';
import { useEnrollTask } from '@/hooks/useEnrollTask';
import { useEnrollmentStatus } from '@/hooks/useEnrollmentStatus';
import { useTaskAvailability } from '@/hooks/useTaskAvailability';
import { TaskDetailsBottomSheet } from '@/components/tasks/TaskDetailsBottomSheet';
import { resolveMemberReward } from '@/lib/rewardResolver';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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

  let buttonLabel = 'Enroll';
  if (isEnrolled) buttonLabel = 'View';
  else if (isTaskExpired) buttonLabel = 'Expired';
  else if (isFull) buttonLabel = 'Full';

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98 }}
        whileTap={{ scale: 0.99 }}
        onClick={handleRowClick}
        className="group relative bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--primary)]/40 rounded-[var(--radius-xl)] p-4 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer flex items-center justify-between gap-4 min-h-[88px] overflow-hidden"
      >
        {/* Left: App Icon */}
        <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-[var(--radius-md)] bg-[var(--surface-elevated)] border border-[var(--border)] flex items-center justify-center shrink-0 overflow-hidden shadow-2xs group-hover:scale-105 transition-transform duration-200">
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

        {/* Center: App Name + Title + Spots Badge */}
        <div className="min-w-0 flex-1 flex flex-col justify-center gap-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[var(--text-primary)] truncate max-w-[130px] sm:max-w-[200px]">
              {task.appName || 'Partner App'}
            </span>
            {task.isVerified && (
              <ShieldCheck className="w-3.5 h-3.5 text-[var(--primary)] shrink-0" />
            )}
          </div>

          <p className="text-[11px] sm:text-xs text-[var(--text-secondary)] truncate font-medium">
            {task.title}
          </p>

          <div className="flex items-center gap-2 mt-0.5">
            <Badge
              variant={isFull ? 'danger' : remainingSlots <= 5 ? 'warning' : 'success'}
              size="sm"
              className="tabular-nums"
            >
              {remainingSlots <= 5 && !isFull && (
                <Flame className="w-3 h-3 fill-current animate-pulse shrink-0 inline-block mr-1" />
              )}
              {isFull ? 'Campaign Full' : `${remainingSlots} spots left`}
            </Badge>
          </div>
        </div>

        {/* Right: Reward + Action Button */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right flex flex-col items-end">
            <span className="text-base sm:text-lg font-bold text-[var(--success)] font-mono tabular-nums leading-none tracking-tight">
              ₹{displayReward}
            </span>
            <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mt-0.5">
              Reward
            </span>
          </div>

          <Button
            size="sm"
            variant={isEnrolled ? 'success' : isButtonDisabled ? 'outline' : 'primary'}
            isLoading={isEnrolling}
            disabled={isButtonDisabled}
            onClick={handleEnrollClick}
            rightIcon={!isButtonDisabled && !isEnrolled ? <ChevronRight className="w-3.5 h-3.5 hidden sm:inline-block" /> : undefined}
          >
            {buttonLabel}
          </Button>
        </div>
      </motion.div>

      {/* Bottom Sheet for Task Details */}
      <TaskDetailsBottomSheet
        task={task}
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
      />
    </>
  );
}
