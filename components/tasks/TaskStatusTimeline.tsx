'use client';

import React from 'react';
import { motion } from 'motion/react';
import { Check, Clock, AlertCircle, ShieldCheck, FileCheck } from 'lucide-react';
import { EnrollmentStatus } from '@/types/firestore';
import { parseDateInput, formatDate } from '@/utils/formatters';

interface TaskStatusTimelineProps {
  status: EnrollmentStatus;
  enrolledAt: string;
  submittedAt: string | null;
  reviewedAt?: string | null;
  rejectionReason?: string;
  submissionVersion?: number;
}

export function TaskStatusTimeline({
  status,
  enrolledAt,
  submittedAt,
  reviewedAt,
  rejectionReason,
  submissionVersion,
}: TaskStatusTimelineProps) {
  const isSubmitted = Boolean(submittedAt);
  const isApproved = status === 'approved';
  const isRejected = status === 'rejected';

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return '';
    try {
      const d = (parseDateInput(isoString) || new Date());
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const steps = [
    {
      id: 'enrolled',
      title: 'Task Enrolled',
      subtitle: formatDate(enrolledAt) || 'Slot Reserved',
      isCompleted: true,
      isActive: !isSubmitted,
      icon: Check,
    },
    {
      id: 'submitted',
      title: 'Proof Submitted',
      subtitle: isSubmitted ? formatDate(submittedAt) : 'Pending Upload',
      isCompleted: isSubmitted,
      isActive: isSubmitted && status === 'pending',
      icon: FileCheck,
    },
    {
      id: 'review',
      title: 'Under Review',
      subtitle: isSubmitted
        ? isApproved
          ? 'Review Completed'
          : isRejected
          ? 'Review Completed'
          : 'Awaiting Admin Verification'
        : 'Awaiting Proof',
      isCompleted: isApproved || isRejected,
      isActive: isSubmitted && status === 'pending',
      icon: Clock,
    },
    {
      id: 'final',
      title: isApproved ? 'Approved & Paid' : isRejected ? 'Proof Rejected' : 'Final Approval',
      subtitle: isApproved
        ? formatDate(reviewedAt) || 'Reward Credited'
        : isRejected
        ? rejectionReason || 'Resubmission Unlocked'
        : 'Reward Allocation',
      isCompleted: isApproved,
      isFailed: isRejected,
      isActive: isApproved || isRejected,
      icon: isApproved ? ShieldCheck : isRejected ? AlertCircle : Clock,
    },
  ];

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 shadow-xs mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Enrollment Progress
          </h3>
          {submissionVersion && submissionVersion > 1 && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--text-secondary)]">
              v{submissionVersion}
            </span>
          )}
        </div>

        <span
          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
            isApproved
              ? 'bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/20'
              : isRejected
              ? 'bg-[var(--danger)]/10 text-[var(--danger)] border border-[var(--danger)]/20'
              : isSubmitted
              ? 'bg-[var(--warning)]/10 text-[var(--warning)] border border-[var(--warning)]/20'
              : 'bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20'
          }`}
        >
          {isApproved
            ? 'Approved'
            : isRejected
            ? 'Action Required'
            : isSubmitted
            ? 'Under Review'
            : 'InProgress'}
        </span>
      </div>

      <div className="relative flex flex-col sm:flex-row items-start justify-between gap-4 sm:gap-2">
        {/* Horizontal Connector Line for Desktop */}
        <div className="hidden sm:block absolute top-4 left-6 right-6 h-0.5 bg-[var(--border)] -z-0" />

        {steps.map((step, index) => {
          const Icon = step.icon;

          return (
            <div
              key={step.id}
              className="relative z-10 flex sm:flex-col items-center gap-3 sm:gap-2 text-left sm:text-center w-full sm:w-1/4"
            >
              {/* Circle Icon */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold transition-all ${
                  step.isCompleted
                    ? 'bg-[var(--success)] text-[var(--success-fg)] shadow-xs'
                    : step.isFailed
                    ? 'bg-[var(--danger)] text-[var(--danger-fg)] shadow-xs'
                    : step.isActive
                    ? 'bg-[var(--primary)] text-[var(--primary-fg)] ring-4 ring-[var(--primary)]/20'
                    : 'bg-[var(--surface-elevated)] text-[var(--text-muted)] border border-[var(--border)]'
                }`}
              >
                <Icon className="w-4 h-4" />
              </motion.div>

              {/* Text Meta */}
              <div className="min-w-0">
                <span
                  className={`block text-xs font-bold leading-snug ${
                    step.isCompleted
                      ? 'text-[var(--text-primary)]'
                      : step.isFailed
                      ? 'text-[var(--danger)]'
                      : step.isActive
                      ? 'text-[var(--primary)]'
                      : 'text-[var(--text-muted)]'
                  }`}
                >
                  {step.title}
                </span>
                <span className="block text-[11px] text-[var(--text-secondary)] truncate">
                  {step.subtitle}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
