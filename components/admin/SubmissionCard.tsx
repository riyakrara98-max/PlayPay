'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  CreditCard,
  History,
  Image as ImageIcon,
  MessageSquare,
  Sparkles,
  User,
  ShieldCheck,
  Check,
  AlertCircle,
  Lock,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { EnrollmentDocument } from '@/types/firestore';

interface SubmissionCardProps {
  submission: EnrollmentDocument;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  onOpenLightbox: (imageUrl: string, title: string, subtitle: string) => void;
  onApprove: (submission: EnrollmentDocument) => void;
  onReject: (submission: EnrollmentDocument) => void;
  onStartProcessing: (submission: EnrollmentDocument) => void;
  onMarkPaid: (submission: EnrollmentDocument) => void;
  onViewAudit: (submission: EnrollmentDocument) => void;
}

export function SubmissionCard({
  submission,
  isSelected = false,
  onToggleSelect,
  onOpenLightbox,
  onApprove,
  onReject,
  onStartProcessing,
  onMarkPaid,
  onViewAudit,
}: SubmissionCardProps) {
  const [imageError, setImageError] = useState(false);

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = () => {
    switch (submission.status) {
      case 'approved':
        return (
          <Badge variant="success" size="sm">
            <CheckCircle2 className="w-3 h-3 inline mr-1" /> Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="danger" size="sm">
            <XCircle className="w-3 h-3 inline mr-1" /> Rejected
          </Badge>
        );
      case 'pending':
      default:
        return (
          <Badge variant="warning" size="sm">
            <Clock className="w-3 h-3 inline mr-1" /> Pending Review
          </Badge>
        );
    }
  };

  const getPaymentBadge = () => {
    switch (submission.paymentStatus) {
      case 'paid':
        return (
          <Badge variant="success" size="sm">
            <ShieldCheck className="w-3 h-3 inline mr-1" /> Paid (Ref: {submission.paymentReference || 'OK'})
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant="primary" size="sm">
            <Clock className="w-3 h-3 inline mr-1" /> Processing Payment
          </Badge>
        );
      case 'requested':
        return (
          <Badge variant="accent" size="sm">
            <CreditCard className="w-3 h-3 inline mr-1" /> Payment Requested
          </Badge>
        );
      case 'pending':
      default:
        return (
          <Badge variant="ghost" size="sm">
            Payment Unclaimed
          </Badge>
        );
    }
  };

  const proofImage = submission.screenshotUrl || submission.proofUrl;

  return (
    <Card
      variant="elevated"
      className={`p-4 sm:p-5 transition-all relative overflow-hidden ${
        isSelected ? 'border-amber-500/60 ring-1 ring-amber-500/40 bg-amber-500/5' : ''
      }`}
    >
      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
        {/* Left: User Info + Selection Checkbox */}
        <div className="flex items-center gap-3 min-w-0">
          {submission.status === 'pending' && onToggleSelect && (
            <Checkbox
              checked={isSelected}
              onChange={() => onToggleSelect(submission.id)}
              aria-label={`Select submission for ${submission.userName}`}
            />
          )}

          <Avatar
            src={submission.userAvatar || undefined}
            alt={submission.userName || 'User'}
            name={submission.userName || 'User'}
            size="md"
          />

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-[var(--text-primary)] truncate">
                {submission.userName || 'Anonymous User'}
              </span>
              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[var(--surface-elevated)] border border-[var(--border)] text-[var(--text-secondary)]">
                v{submission.submissionVersion || 1}
              </span>
            </div>
            <div className="text-xs font-mono text-[var(--text-muted)] truncate">
              {submission.userEmail || submission.userId}
            </div>
          </div>
        </div>

        {/* Right: Badges + Reward Pill */}
        <div className="flex items-center gap-2 shrink-0">
          {getStatusBadge()}
          {getPaymentBadge()}
          <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 font-extrabold text-sm sm:text-base">
            ₹{submission.reward || submission.rewardAmount}
          </div>
        </div>
      </div>

      {/* Main Body Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 py-4">
        {/* App & Task Metadata (Col 1 to 8) */}
        <div className="md:col-span-8 space-y-3">
          {/* App Title Header */}
          <div className="flex items-center gap-2.5">
            {submission.appIcon ? (
              <img
                src={submission.appIcon}
                alt={submission.appName || 'App'}
                className="w-9 h-9 rounded-[var(--radius-md)] object-cover border border-[var(--border)] shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-[var(--radius-md)] bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-xs shrink-0 border border-blue-500/20">
                APP
              </div>
            )}
            <div>
              <h4 className="text-sm font-bold text-[var(--text-primary)] leading-tight">
                {submission.appName}
              </h4>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                {submission.taskTitle}
              </p>
            </div>
          </div>

          {/* Assigned Comment / Fixed Comment or User Comment */}
          {submission.assignedComment ? (
            <div className="p-2.5 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-[var(--radius-md)] text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-amber-500 font-semibold text-[11px]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Assigned Comment (Fixed Mode)</span>
              </div>
              <p className="font-mono text-[var(--text-primary)] italic bg-[var(--surface)] p-2 rounded border border-[var(--border)]">
                &quot;{submission.assignedComment}&quot;
              </p>
            </div>
          ) : null}

          {submission.userComment ? (
            <div className="p-2.5 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-[var(--radius-md)] text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-blue-500 font-semibold text-[11px]">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>User Submitted Feedback / Comment</span>
              </div>
              <p className="text-[var(--text-primary)] bg-[var(--surface)] p-2 rounded border border-[var(--border)]">
                &quot;{submission.userComment}&quot;
              </p>
            </div>
          ) : null}

          {/* Timestamps & Audit summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-[var(--text-secondary)] pt-1">
            <div>
              Submitted: <span className="font-mono text-[var(--text-primary)]">{formatDate(submission.submittedAt || submission.enrolledAt)}</span>
            </div>
            {submission.reviewedAt && (
              <div>
                Reviewed: <span className="font-mono text-[var(--text-primary)]">{formatDate(submission.reviewedAt)}</span>
              </div>
            )}
            {submission.rejectionReason && (
              <div className="col-span-full p-2 bg-rose-500/10 border border-rose-500/20 rounded text-rose-500">
                <strong>Rejection Reason:</strong> {submission.rejectionReason}
              </div>
            )}
          </div>
        </div>

        {/* Proof Screenshot Thumbnail (Col 9 to 12) */}
        <div className="md:col-span-4 flex flex-col items-center justify-center">
          {proofImage && !imageError ? (
            <div
              onClick={() =>
                onOpenLightbox(
                  proofImage,
                  `${submission.appName} — Proof Screenshot`,
                  `Submitted by ${submission.userName} on ${formatDate(submission.submittedAt || submission.enrolledAt)}`
                )
              }
              className="group relative w-full h-36 bg-slate-950/60 rounded-[var(--radius-md)] border border-[var(--border)] overflow-hidden cursor-pointer flex items-center justify-center hover:border-amber-500/50 transition-all"
            >
              <img
                src={proofImage}
                alt="Proof Thumbnail"
                onError={() => setImageError(true)}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs gap-1 font-semibold">
                <ImageIcon className="w-5 h-5 text-amber-400" />
                <span>Click Fullscreen Lightbox</span>
              </div>
            </div>
          ) : (
            <div className="w-full h-36 rounded-[var(--radius-md)] bg-[var(--surface-elevated)] border border-[var(--border)] border-dashed flex flex-col items-center justify-center text-center p-3 text-[var(--text-muted)] text-xs">
              <AlertCircle className="w-6 h-6 text-rose-400 mb-1" />
              <span>Screenshot Missing or Unreachable</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[var(--border)]">
        {/* Left: Audit Trail Link */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewAudit(submission)}
          leftIcon={<History className="w-3.5 h-3.5" />}
          className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          View Audit History
        </Button>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Approval & Rejection buttons (for pending or resubmitted) */}
          {submission.status === 'pending' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onReject(submission)}
                leftIcon={<XCircle className="w-3.5 h-3.5 text-rose-500" />}
                className="hover:border-rose-500/50 hover:bg-rose-500/10 hover:text-rose-500"
              >
                Reject
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => onApprove(submission)}
                leftIcon={<Check className="w-3.5 h-3.5" />}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Approve & Lock Reward
              </Button>
            </>
          )}

          {/* Payment Workflow buttons */}
          {submission.status === 'approved' && submission.paymentStatus === 'requested' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onStartProcessing(submission)}
              leftIcon={<Clock className="w-3.5 h-3.5 text-blue-500" />}
              className="border-blue-500/30 text-blue-500 hover:bg-blue-500/10"
            >
              Start Processing
            </Button>
          )}

          {submission.status === 'approved' &&
            (submission.paymentStatus === 'requested' || submission.paymentStatus === 'processing') && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onMarkPaid(submission)}
                leftIcon={<CreditCard className="w-3.5 h-3.5" />}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Mark Paid
              </Button>
            )}

          {submission.paymentStatus === 'paid' && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-semibold px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20">
              <Lock className="w-3.5 h-3.5" />
              <span>Payout Paid & Locked</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
