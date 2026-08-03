'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileCheck,
  Coins,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Receipt,
  RotateCcw,
} from 'lucide-react';
import { EnrollmentDocument } from '@/types/firestore';

interface MyTaskCardProps {
  enrollment: EnrollmentDocument;
}

export function MyTaskCard({ enrollment }: MyTaskCardProps) {
  const [isRejectionExpanded, setIsRejectionExpanded] = useState(false);

  const isApproved = enrollment.status === 'approved';
  const isRejected = enrollment.status === 'rejected';
  const isSubmitted = Boolean(enrollment.submittedAt) && enrollment.status === 'pending';
  const isEnrolledOnly = enrollment.status === 'pending' && !enrollment.submittedAt;

  const paymentStatus = enrollment.paymentStatus || 'pending';

  // Format dates nicely
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return null;
    }
  };

  const enrolledDateFormatted = formatDate(enrollment.enrolledAt);
  const approvedDateFormatted = formatDate(enrollment.reviewedAt);

  // Status Badge Configuration
  const getStatusBadge = () => {
    if (isApproved) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/20 shadow-2xs">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Approved
        </span>
      );
    }
    if (isRejected) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-[var(--danger)]/10 text-[var(--danger)] border border-[var(--danger)]/20 shadow-2xs">
          <AlertCircle className="w-3.5 h-3.5" />
          Rejected
        </span>
      );
    }
    if (isSubmitted) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-[var(--warning)]/10 text-[var(--warning)] border border-[var(--warning)]/20 shadow-2xs">
          <Clock className="w-3.5 h-3.5 animate-spin" />
          Submitted
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 shadow-2xs">
        <FileCheck className="w-3.5 h-3.5" />
        Enrolled
      </span>
    );
  };

  // Payment Status Chip Configuration
  const getPaymentStatusChip = () => {
    switch (paymentStatus) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Paid
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            Processing
          </span>
        );
      case 'requested':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Requested
          </span>
        );
      case 'rejected':
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
            Failed
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-[var(--surface-elevated)] text-[var(--text-muted)] border border-[var(--border)]">
            Payment Pending
          </span>
        );
    }
  };

  // Action Button config
  const getActionButton = () => {
    if (isRejected) {
      return {
        label: 'Resubmit Proof',
        icon: RotateCcw,
        variant: 'bg-[var(--danger)] hover:bg-[var(--danger)]/90 text-white',
      };
    }
    if (isApproved) {
      return {
        label: 'View Details',
        icon: ArrowRight,
        variant: 'bg-[var(--surface-elevated)] hover:bg-[var(--primary)] hover:text-[var(--primary-fg)] text-[var(--text-primary)] border border-[var(--border)]',
      };
    }
    if (isSubmitted) {
      return {
        label: 'Under Review',
        icon: Clock,
        variant: 'bg-[var(--surface-elevated)] hover:bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)]',
      };
    }
    return {
      label: 'Continue Task',
      icon: ArrowRight,
      variant: 'bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-fg)] shadow-xs',
    };
  };

  const action = getActionButton();
  const ActionIcon = action.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      whileHover={{ y: -3 }}
      className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
    >
      <div className="space-y-4">
        {/* Top Badges & Header Row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {getStatusBadge()}
            {getPaymentStatusChip()}
          </div>
        </div>

        {/* App Info & Task Title */}
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
            {enrollment.appIcon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={enrollment.appIcon}
                alt={enrollment.appName || enrollment.taskTitle || 'App'}
                className="w-full h-full object-cover"
              />
            ) : (
              <Smartphone className="w-5.5 h-5.5 text-[var(--primary)]" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-medium text-[var(--text-muted)] block truncate">
              {enrollment.appName || 'Partner Application'}
            </span>
            <h3 className="text-base font-bold text-[var(--text-primary)] leading-snug line-clamp-2">
              {enrollment.taskTitle || 'Untitled Task'}
            </h3>
          </div>
        </div>

        {/* Dates & Reward Info Grid */}
        <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-[var(--surface-elevated)]/70 border border-[var(--border)]/60 text-xs">
          <div>
            <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">
              Enrolled On
            </span>
            <span className="font-medium text-[var(--text-secondary)] font-mono">
              {enrolledDateFormatted || 'Recently'}
            </span>
          </div>

          {isApproved ? (
            <div>
              <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">
                Approved On
              </span>
              <span className="font-semibold text-[var(--success)] font-mono">
                {approvedDateFormatted || 'Approved'}
              </span>
            </div>
          ) : (
            <div>
              <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">
                Reward
              </span>
              <span className="font-extrabold text-[var(--primary)] font-mono flex items-center gap-0.5">
                <Coins className="w-3.5 h-3.5" /> ₹
                {enrollment.rewardAmount || enrollment.reward || 0}
              </span>
            </div>
          )}
        </div>

        {/* Reward row if approved date is shown above */}
        {isApproved && (
          <div className="flex items-center justify-between px-1 text-xs">
            <span className="text-[var(--text-muted)] font-medium">Earned Reward</span>
            <span className="text-base font-extrabold text-[var(--primary)] font-mono flex items-center gap-1">
              <Coins className="w-4 h-4" /> ₹{enrollment.rewardAmount || enrollment.reward || 0}
            </span>
          </div>
        )}

        {/* Rejection Reason Accordion */}
        {isRejected && enrollment.rejectionReason && (
          <div className="rounded-xl border border-[var(--danger)]/30 bg-[var(--danger)]/5 overflow-hidden">
            <button
              type="button"
              onClick={() => setIsRejectionExpanded(!isRejectionExpanded)}
              aria-expanded={isRejectionExpanded}
              aria-label="Toggle rejection reason"
              className="w-full p-2.5 flex items-center justify-between text-xs font-semibold text-[var(--danger)] hover:bg-[var(--danger)]/10 transition-colors text-left"
            >
              <span className="flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" /> Rejection Reason
              </span>
              {isRejectionExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            <AnimatePresence>
              {isRejectionExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="px-3 pb-3 text-xs text-[var(--text-secondary)] leading-relaxed border-t border-[var(--danger)]/20 pt-2"
                >
                  <p className="bg-[var(--surface)] p-2.5 rounded-lg border border-[var(--danger)]/20 italic">
                    &quot;{enrollment.rejectionReason}&quot;
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="mt-5 pt-3 border-t border-[var(--border)] flex items-center gap-2">
        <Link
          href={`/my-tasks/${enrollment.id}`}
          className={`w-full py-2.5 px-4 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-all ${action.variant}`}
        >
          <span>{action.label}</span>
          <ActionIcon className="w-3.5 h-3.5" />
        </Link>

        {isApproved && (
          <Link
            href="/payment"
            title="Request Payment"
            className="p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center transition-colors shrink-0"
          >
            <Receipt className="w-4 h-4" />
          </Link>
        )}
      </div>
    </motion.div>
  );
}
