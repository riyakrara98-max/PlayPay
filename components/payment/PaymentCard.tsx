'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Smartphone,
  CheckCircle2,
  Clock,
  Coins,
  MessageSquare,
  ShieldCheck,
  Calendar,
  AlertCircle,
  Hourglass,
  CheckCheck,
} from 'lucide-react';
import { EnrollmentDocument } from '@/types/firestore';

interface PaymentCardProps {
  enrollment: EnrollmentDocument;
  paymentEligibilityDays: number;
  adminWhatsAppNumber: string;
  onRequestWhatsApp: (enrollment: EnrollmentDocument, messageUrl: string) => void;
  userName?: string | null;
  userEmail?: string | null;
  userId?: string;
}

export function PaymentCard({
  enrollment,
  paymentEligibilityDays,
  adminWhatsAppNumber,
  onRequestWhatsApp,
  userName,
  userEmail,
  userId,
}: PaymentCardProps) {
  // Determine approved date
  const approvedDateStr =
    enrollment.reviewedAt ||
    enrollment.lastUpdatedAt ||
    enrollment.submittedAt ||
    enrollment.enrolledAt;

  const [currentTime] = React.useState(() => Date.now());

  // Calculate Days Since Completion/Approval safely
  const { daysSinceCompletion, isEligible, daysRemaining, formattedApprovedDate } = React.useMemo(() => {
    const approvedTime = approvedDateStr ? new Date(approvedDateStr).getTime() : currentTime;
    const diffTime = Math.max(0, currentTime - approvedTime);
    const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const eligible = days >= paymentEligibilityDays;
    const remaining = Math.max(0, paymentEligibilityDays - days);
    const formattedDate = new Date(approvedTime).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    return {
      daysSinceCompletion: days,
      isEligible: eligible,
      daysRemaining: remaining,
      formattedApprovedDate: formattedDate,
    };
  }, [approvedDateStr, currentTime, paymentEligibilityDays]);

  const paymentStatus = enrollment.paymentStatus || 'pending';

  // Check button state
  const isPending = paymentStatus === 'pending' || !paymentStatus;
  const isRequested = paymentStatus === 'requested';
  const isProcessing = paymentStatus === 'processing';
  const isPaid = paymentStatus === 'paid';

  const canRequestPayment = isEligible && isPending;

  // Generate WhatsApp Message dynamically
  const generateWhatsAppUrl = () => {
    const cleanNumber = adminWhatsAppNumber.replace(/\D/g, '');

    const message = `Hi Admin,

I would like to request my payment.

Task Details
• App Name: ${enrollment.appName || 'Partner App'}
• Task Title: ${enrollment.taskTitle || 'Completed Task'}
• Approved Date: ${formattedApprovedDate}
• Days Since Completion: ${daysSinceCompletion} day(s)
• Reward Amount: ₹${enrollment.rewardAmount || enrollment.reward || 0}

User Details
• Name: ${userName || 'PlayPay User'}
• Email: ${userEmail || 'N/A'}
• User ID: ${userId || enrollment.userId}

Please verify my completed task and process payment.

Thank you.`;

    const encodedText = encodeURIComponent(message);
    return `https://wa.me/${cleanNumber}?text=${encodedText}`;
  };

  const handleButtonClick = () => {
    if (!canRequestPayment) return;
    const url = generateWhatsAppUrl();
    onRequestWhatsApp(enrollment, url);
  };

  // Payment Status Chip Styling
  const getPaymentStatusChip = () => {
    if (isPaid) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
          <CheckCheck className="w-3.5 h-3.5" />
          Paid
        </span>
      );
    }
    if (isProcessing) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
          <Hourglass className="w-3.5 h-3.5 animate-spin" />
          Processing
        </span>
      );
    }
    if (isRequested) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
          <Clock className="w-3.5 h-3.5" />
          Requested
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-[var(--surface-elevated)] text-[var(--text-secondary)] border border-[var(--border)]">
        Pending Request
      </span>
    );
  };

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
        {/* Top Chips Row */}
        <div className="flex items-center justify-between gap-2">
          {/* Eligibility Chip */}
          {isEligible ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-3 h-3" />
              Eligible
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Clock className="w-3 h-3" />
              Eligible in {daysRemaining} {daysRemaining === 1 ? 'Day' : 'Days'}
            </span>
          )}

          {/* Payment Status Chip */}
          {getPaymentStatusChip()}
        </div>

        {/* App Icon, Name & Title */}
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
            {enrollment.appIcon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={enrollment.appIcon}
                alt={enrollment.appName || enrollment.taskTitle || 'App'}
                className="w-full h-full object-cover"
              />
            ) : (
              <Smartphone className="w-6 h-6 text-[var(--primary)]" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-semibold text-[var(--text-muted)] block truncate">
              {enrollment.appName || 'PlayPay Partner'}
            </span>
            <h3 className="text-base font-bold text-[var(--text-primary)] leading-snug line-clamp-2">
              {enrollment.taskTitle || 'Approved Task'}
            </h3>
          </div>
        </div>

        {/* Reward & Dates Grid */}
        <div className="grid grid-cols-2 gap-2.5 p-3 rounded-xl bg-[var(--surface-elevated)]/70 border border-[var(--border)]/60 text-xs">
          <div>
            <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">
              Approved Date
            </span>
            <span className="font-semibold text-[var(--text-primary)] font-mono flex items-center gap-1 mt-0.5">
              <Calendar className="w-3 h-3 text-[var(--primary)]" />
              {formattedApprovedDate}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">
              Days Since Completion
            </span>
            <span className="font-bold text-[var(--text-secondary)] font-mono block mt-0.5">
              {daysSinceCompletion} {daysSinceCompletion === 1 ? 'day' : 'days'}
            </span>
          </div>
        </div>

        {/* Reward Amount Row */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-[var(--text-muted)] font-medium">Payout Amount</span>
          <span className="text-lg font-extrabold text-[var(--primary)] font-mono flex items-center gap-1">
            <Coins className="w-4 h-4" /> ₹{enrollment.rewardAmount || enrollment.reward || 0}
          </span>
        </div>

        {/* WhatsApp Request Count / History info if present */}
        {(enrollment.whatsAppRequestCount ?? 0) > 0 && (
          <p className="text-[10px] text-[var(--text-muted)] font-mono text-right italic">
            WhatsApp requests sent: {enrollment.whatsAppRequestCount}
          </p>
        )}
      </div>

      {/* Large Full-Width Green WhatsApp Button */}
      <div className="mt-5 pt-3 border-t border-[var(--border)]">
        <button
          type="button"
          onClick={handleButtonClick}
          disabled={!canRequestPayment}
          aria-label={
            canRequestPayment
              ? `Request Payment via WhatsApp for ${enrollment.taskTitle}`
              : `Payment status: ${paymentStatus}`
          }
          className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all shadow-sm ${
            canRequestPayment
              ? 'bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-emerald-500/20 hover:shadow-md active:scale-[0.99] cursor-pointer'
              : 'bg-[var(--surface-elevated)] text-[var(--text-muted)] border border-[var(--border)] cursor-not-allowed'
          }`}
        >
          <MessageSquare className="w-4 h-4 shrink-0 fill-current" />
          <span>
            {isPaid
              ? 'Payment Completed (Paid)'
              : isProcessing
              ? 'Payment Processing...'
              : isRequested
              ? 'Request Sent (Under Admin Review)'
              : !isEligible
              ? `Eligible in ${daysRemaining} ${daysRemaining === 1 ? 'Day' : 'Days'}`
              : 'Request Payment via WhatsApp'}
          </span>
        </button>
      </div>
    </motion.div>
  );
}
