'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ShieldCheck,
  Clock,
  Smartphone,
  ArrowRight,
  CheckCircle2,
  Loader2,
  MessageSquare,
  Zap,
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { TaskDocument } from '@/types/firestore';
import { useAuthContext } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useCountdown } from '@/hooks/useCountdown';
import { useEnrollTask } from '@/hooks/useEnrollTask';
import { useEnrollmentStatus } from '@/hooks/useEnrollmentStatus';
import { useTaskAvailability } from '@/hooks/useTaskAvailability';
import { resolveMemberReward } from '@/lib/rewardResolver';
import { AdSlot } from '@/components/ads/AdSlot';

interface TaskDetailsBottomSheetProps {
  task: TaskDocument | null;
  isOpen: boolean;
  onClose: () => void;
}

function TaskDetailsContent({
  task,
  onClose,
}: {
  task: TaskDocument;
  onClose: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, userProfile } = useAuthContext();
  const { openAuthModal } = useAuthModal();
  const { isEnrolled, enrollment } = useEnrollmentStatus(task.id);
  const { enrollTask, isEnrolling } = useEnrollTask();
  const availability = useTaskAvailability(task, isEnrolled);
  const timeLeft = useCountdown(task.expiresAt);

  const resolvedReward = resolveMemberReward(task.rewardAmount, userProfile?.effectiveReward);

  const {
    remainingSlots,
    progressPercent,
    status: computedStatus,
    isFull,
    isExpired: isTaskExpired,
  } = availability;

  const handleEnrollClick = async () => {
    if (!currentUser) {
      openAuthModal(task.id);
      onClose();
      const targetPath = pathname || '/dashboard';
      router.push(`/login?redirectTo=${encodeURIComponent(targetPath)}&pendingTaskId=${task.id}`);
      return;
    }
    if (isEnrolled) {
      window.location.href = `/my-tasks/${enrollment?.id}`;
      return;
    }
    if (!isEnrolling && (computedStatus === 'available' || computedStatus === 'almost_full')) {
      await enrollTask(task.id, task);
      onClose();
    }
  };

  const isButtonDisabled =
    isEnrolling || (isFull && !isEnrolled) || (isTaskExpired && !isEnrolled);

  let buttonLabel = 'Enroll Now';
  if (isEnrolled) buttonLabel = 'View Task Details';
  else if (isTaskExpired) buttonLabel = 'This task has expired.';
  else if (isFull) buttonLabel = 'Task Full';

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="relative w-full max-w-lg bg-[var(--surface)] border-t sm:border border-[var(--border)] rounded-t-[28px] sm:rounded-[28px] shadow-2xl overflow-hidden max-h-[85vh] flex flex-col z-10"
    >
      {/* Sheet Pull Handle for Mobile */}
      <div className="w-12 h-1.5 bg-[var(--border)] rounded-full mx-auto my-3 sm:hidden shrink-0" />

      {/* Header Bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)] bg-[var(--surface-elevated)]/50 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary)] bg-[var(--primary)]/10 px-2.5 py-1 rounded-full flex items-center gap-1">
            <Zap className="w-3 h-3" /> Campaign Details
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-[var(--surface-elevated)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--border)] transition-all"
          aria-label="Close sheet"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
        {/* App Meta & Reward Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
              {task.appIcon ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={task.appIcon}
                  alt={task.appName || task.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Smartphone className="w-7 h-7 text-[var(--primary)]" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                  {task.appName || 'Partner App'}
                </span>
                {task.isVerified && (
                  <ShieldCheck className="w-4 h-4 text-[var(--primary)]" />
                )}
              </div>
              <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)] leading-tight mt-0.5">
                {task.title}
              </h2>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">
              Reward
            </span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-500 font-mono tracking-tight">
              ₹{resolvedReward}
            </span>
          </div>
        </div>

        {/* Status & Availability Bar */}
        {isTaskExpired ? (
          <div className="p-3.5 rounded-2xl bg-[var(--danger)]/10 border border-[var(--danger)]/20 text-xs font-bold text-[var(--danger)] flex items-center gap-2">
            <Clock className="w-4 h-4 shrink-0" />
            <span>This task has expired.</span>
          </div>
        ) : (
          <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-[var(--text-secondary)] flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[var(--primary)]" />
                {timeLeft ? `Ends in ${timeLeft}` : 'Active Campaign'}
              </span>
              <span
                className={`font-mono ${
                  isFull
                    ? 'text-[var(--danger)] font-bold'
                    : 'text-emerald-500 font-bold'
                }`}
              >
                {isFull ? 'Campaign Full' : `${remainingSlots} Slots Left`}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 rounded-full bg-[var(--border)] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[var(--primary)] to-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Description */}
        {task.description && (
          <div className="space-y-1">
            <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Task Summary
            </h3>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed bg-[var(--surface-elevated)]/50 p-3 rounded-xl border border-[var(--border)]">
              {task.description}
            </p>
          </div>
        )}

        {/* Instructions */}
        {task.instructions && (
          <div className="space-y-1">
            <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Instructions
            </h3>
            <div className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed bg-[var(--surface-elevated)]/50 p-3 rounded-xl border border-[var(--border)] whitespace-pre-line">
              {task.instructions}
            </div>
          </div>
        )}

        {/* Assigned Comment if Enrolled */}
        {isEnrolled && enrollment?.assignedComment && (
          <div className="p-3.5 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-[var(--primary)]">
              <MessageSquare className="w-4 h-4" />
              <span>Your Assigned Comment to Post</span>
            </div>
            <p className="font-mono text-xs text-[var(--text-primary)] bg-[var(--surface)] p-2 rounded-lg border border-[var(--border)] select-all font-semibold">
              &quot;{enrollment.assignedComment}&quot;
            </p>
          </div>
        )}

        {/* Hint if present */}
        {task.hint && (
          <div className="space-y-1">
            <h3 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Helpful Hint
            </h3>
            <p className="text-xs text-[var(--text-secondary)] italic bg-[var(--surface-elevated)]/50 p-2.5 rounded-xl border border-[var(--border)]">
              💡 {task.hint}
            </p>
          </div>
        )}

        <AdSlot placement="task-details" />
      </div>

      {/* Sticky Action Footer */}
      <div className="p-4 bg-[var(--surface)] border-t border-[var(--border)] shrink-0">
        <button
          type="button"
          onClick={handleEnrollClick}
          disabled={isButtonDisabled}
          className={`w-full py-3.5 px-5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 ${
            isEnrolled
              ? 'bg-emerald-500 text-white shadow-md hover:bg-emerald-600'
              : isButtonDisabled
              ? 'bg-[var(--surface-elevated)] text-[var(--text-muted)] border border-[var(--border)] cursor-not-allowed'
              : 'bg-gradient-to-r from-[var(--primary)] to-emerald-500 text-white shadow-lg hover:shadow-[0_8px_20px_rgba(16,185,129,0.3)] hover:-translate-y-0.5'
          }`}
        >
          {isEnrolling ? (
            <Loader2 className="w-5 h-5 animate-spin shrink-0" />
          ) : (
            <>
              <span>{buttonLabel}</span>
              {!isButtonDisabled && <ArrowRight className="w-4 h-4" />}
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}

export function TaskDetailsBottomSheet({
  task,
  isOpen,
  onClose,
}: TaskDetailsBottomSheetProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && task && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
          />

          <TaskDetailsContent task={task} onClose={onClose} />
        </div>
      )}
    </AnimatePresence>
  );
}
