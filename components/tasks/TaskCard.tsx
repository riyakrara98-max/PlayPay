'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Clock,
  Smartphone,
  Users,
  Coins,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  MessageSquare,
} from 'lucide-react';
import { TaskDocument } from '@/types/firestore';
import { useCountdown } from '@/hooks/useCountdown';
import { useEnrollTask } from '@/hooks/useEnrollTask';
import { useEnrollmentStatus } from '@/hooks/useEnrollmentStatus';
import { useTaskAvailability } from '@/hooks/useTaskAvailability';

interface TaskCardProps {
  task: TaskDocument;
}

export function TaskCard({ task }: TaskCardProps) {
  const { isEnrolled, enrollment } = useEnrollmentStatus(task.id);
  const { enrollTask, isEnrolling } = useEnrollTask();
  const availability = useTaskAvailability(task, isEnrolled);
  const timeLeft = useCountdown(task.expiresAt);

  const {
    totalSlots,
    enrolledCount,
    remainingSlots,
    progressPercent,
    status: computedStatus,
    isFull,
    isExpired: isTaskExpired,
  } = availability;

  const isExpired = isTaskExpired || timeLeft.isExpired || task.status === 'completed';

  // Progress Bar color logic
  let progressColorClass = 'bg-[var(--success)]';
  if (computedStatus === 'full' || computedStatus === 'expired') {
    progressColorClass = 'bg-[var(--text-muted)]';
  } else if (progressPercent >= 80) {
    progressColorClass = 'bg-[var(--danger)]';
  } else if (progressPercent >= 60) {
    progressColorClass = 'bg-[var(--warning)]';
  }

  const handleEnrollClick = async () => {
    if (isEnrolled) {
      // In Phase 2C, this will navigate to task detail
      return;
    }
    if (isFull || isExpired || isEnrolling) return;

    await enrollTask(task.id);
  };

  // Button Label & State
  let buttonLabel = 'Enroll Now';
  let isButtonDisabled = false;

  if (isEnrolling) {
    buttonLabel = 'Enrolling...';
    isButtonDisabled = true;
  } else if (isEnrolled) {
    buttonLabel = 'View Task →';
    isButtonDisabled = false;
  } else if (isExpired) {
    buttonLabel = 'Expired';
    isButtonDisabled = true;
  } else if (isFull) {
    buttonLabel = 'Task Full';
    isButtonDisabled = true;
  }

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`group relative flex flex-col justify-between bg-[var(--surface)] border rounded-2xl p-5 shadow-xs hover:shadow-lg transition-all duration-300 ${
        isEnrolled
          ? 'border-[var(--primary)]/60 bg-[var(--primary)]/[0.02]'
          : 'border-[var(--border)] hover:border-[var(--primary)]/40'
      }`}
    >
      <div>
        {/* Top Header Row: App Icon + App Name + Status Badge */}
        <div className="flex items-start justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-11 h-11 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] flex items-center justify-center shrink-0 overflow-hidden shadow-2xs group-hover:scale-105 transition-transform">
              {task.appIcon ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={task.appIcon}
                  alt={task.appName || task.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Smartphone className="w-5 h-5 text-[var(--primary)]" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-[var(--text-secondary)] truncate">
                  {task.appName || 'PlayPay Partner'}
                </span>
                {task.isVerified && (
                  <span
                    title="Verified Task"
                    className="inline-flex items-center text-[var(--primary)] shrink-0"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 fill-[var(--primary)]/10" />
                  </span>
                )}
              </div>
              <h3 className="text-base font-bold text-[var(--text-primary)] leading-snug truncate group-hover:text-[var(--primary)] transition-colors">
                {task.title}
              </h3>
            </div>
          </div>

          {/* Status Badge */}
          <div>
            {isEnrolled ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/30 shrink-0">
                <CheckCircle2 className="w-3 h-3" />
                Enrolled
              </span>
            ) : computedStatus === 'available' ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/20 shrink-0">
                <CheckCircle2 className="w-3 h-3" />
                Available
              </span>
            ) : computedStatus === 'almost_full' ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[var(--warning)]/10 text-[var(--warning)] border border-[var(--warning)]/20 shrink-0 animate-pulse">
                <AlertCircle className="w-3 h-3" />
                Almost Full
              </span>
            ) : computedStatus === 'full' ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[var(--surface-elevated)] text-[var(--text-muted)] border border-[var(--border)] shrink-0">
                Full
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[var(--danger)]/10 text-[var(--danger)] border border-[var(--danger)]/20 shrink-0">
                Expired
              </span>
            )}
          </div>
        </div>

        {/* Task Description */}
        {task.description && (
          <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mb-4 leading-relaxed">
            {task.description}
          </p>
        )}

        {/* Assigned Comment Pill if Enrolled */}
        {isEnrolled && enrollment?.assignedComment && (
          <div className="mb-4 p-2.5 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-xs text-[var(--text-primary)] flex items-start gap-2">
            <MessageSquare className="w-3.5 h-3.5 text-[var(--primary)] shrink-0 mt-0.5" />
            <div className="min-w-0">
              <span className="font-semibold text-[var(--primary)] block text-[10px] uppercase tracking-wider">
                Assigned Comment
              </span>
              <p className="truncate italic text-[11px]">&quot;{enrollment.assignedComment}&quot;</p>
            </div>
          </div>
        )}

        {/* Reward & Countdown Section */}
        <div className="flex items-center justify-between bg-[var(--surface-elevated)]/60 rounded-xl p-3 border border-[var(--border)]/60 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center text-[var(--primary)] shrink-0">
              <Coins className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-[var(--text-muted)] tracking-wider block">
                Reward
              </span>
              <span className="text-base font-extrabold text-[var(--primary)] font-mono">
                ₹{task.rewardAmount}
              </span>
            </div>
          </div>

          {/* Expiry timer if available */}
          {task.expiresAt && !timeLeft.isExpired && (
            <div className="text-right">
              <span className="text-[10px] uppercase font-semibold text-[var(--text-muted)] tracking-wider block">
                Expires In
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--warning)] font-mono">
                <Clock className="w-3 h-3" />
                {timeLeft.formatted}
              </span>
            </div>
          )}
        </div>

        {/* Progress Bar & Slots */}
        <div className="space-y-1.5 mb-5">
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-[var(--text-secondary)] flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              {enrolledCount} / {totalSlots} enrolled
            </span>
            <span
              className={`font-semibold font-mono ${
                isFull
                  ? 'text-[var(--danger)]'
                  : computedStatus === 'almost_full'
                  ? 'text-[var(--warning)]'
                  : 'text-[var(--success)]'
              }`}
            >
              {isFull ? 'FULL' : `${remainingSlots} left`}
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-[var(--surface-elevated)] overflow-hidden relative border border-[var(--border)]/50">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className={`h-full rounded-full ${progressColorClass} ${
                computedStatus === 'almost_full' ? 'animate-pulse' : ''
              }`}
            />
          </div>
        </div>
      </div>

      {/* Enroll Action Button */}
      <button
        type="button"
        onClick={handleEnrollClick}
        disabled={isButtonDisabled}
        aria-label={`${buttonLabel} - ${task.title}`}
        className={`w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 ${
          isEnrolled
            ? 'bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/30 hover:bg-[var(--primary)] hover:text-[var(--primary-fg)]'
            : isButtonDisabled
            ? 'bg-[var(--surface-elevated)] text-[var(--text-muted)] border border-[var(--border)] cursor-not-allowed'
            : 'bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-fg)] shadow-md hover:shadow-lg active:scale-[0.99]'
        }`}
      >
        {isEnrolling && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        <span>{buttonLabel}</span>
        {!isButtonDisabled && !isEnrolling && (
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        )}
      </button>
    </motion.article>
  );
}
