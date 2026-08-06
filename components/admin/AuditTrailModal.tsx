'use client';

import React from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  CreditCard,
  Lock,
  UserCheck,
  ShieldAlert,
  FileCheck2,
  Calendar,
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { EnrollmentDocument } from '@/types/firestore';
import { formatDateTime } from '@/utils/formatters';

interface AuditTrailModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: EnrollmentDocument | null;
}

export function AuditTrailModal({
  isOpen,
  onClose,
  submission,
}: AuditTrailModalProps) {
  if (!submission) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-[var(--text-primary)]">
          <FileCheck2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <span>Submission & Payment Audit Trail</span>
        </div>
      }
      description={`Complete immutable lifecycle history for Enrollment ID: ${submission.id}`}
      size="lg"
    >
      <div className="space-y-6">
        {/* Header Metadata Card */}
        <div className="p-4 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-[var(--radius-lg)] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-[var(--text-secondary)] block">User</span>
            <span className="font-semibold text-[var(--text-primary)]">{submission.userName}</span>
            <span className="font-mono text-[var(--text-muted)] block text-[11px]">{submission.userEmail || submission.userId}</span>
          </div>

          <div>
            <span className="text-[var(--text-secondary)] block">Task App</span>
            <span className="font-semibold text-[var(--text-primary)]">{submission.appName}</span>
            <span className="text-[var(--text-muted)] block text-[11px]">{submission.taskTitle}</span>
          </div>

          <div>
            <span className="text-[var(--text-secondary)] block">Reward Amount</span>
            <span className="font-bold text-emerald-500">₹{submission.reward}</span>
          </div>

          <div>
            <span className="text-[var(--text-secondary)] block">Submission Version</span>
            <span className="font-mono text-[var(--text-primary)] font-semibold">
              v{submission.submissionVersion || 1} {submission.resubmissionCount ? `(${submission.resubmissionCount} resubmissions)` : ''}
            </span>
          </div>
        </div>

        {/* Locked Parameters Audit (if approved) */}
        {submission.status === 'approved' && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-[var(--radius-md)] text-xs space-y-2">
            <div className="flex items-center gap-1.5 text-amber-500 font-semibold">
              <Lock className="w-4 h-4" />
              <span>Permanently Locked Approval Attributes</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-[var(--text-secondary)]">Locked Reward:</span>{' '}
                <strong className="text-emerald-500 font-mono">₹{submission.lockedReward ?? submission.reward}</strong>
              </div>
              <div>
                <span className="text-[var(--text-secondary)]">Locked Task ID:</span>{' '}
                <strong className="text-[var(--text-primary)] font-mono">{submission.lockedTaskId || submission.taskId}</strong>
              </div>
              {submission.assignedComment && (
                <div className="col-span-full">
                  <span className="text-[var(--text-secondary)]">Locked Assigned Comment:</span>{' '}
                  <p className="mt-0.5 p-1.5 bg-[var(--surface)] rounded border border-[var(--border)] italic text-[var(--text-primary)] font-mono">
                    &quot;{submission.lockedAssignedComment || submission.assignedComment}&quot;
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Vertical Audit Trail Timeline */}
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[var(--border)]">
          {/* Step 1: Enrolled / Submitted */}
          <div className="relative flex items-start gap-3">
            <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center border border-blue-500/40">
              <Calendar className="w-3 h-3" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[var(--text-primary)]">Submitted Proof</span>
                <Badge variant="primary" size="sm">Version v{submission.submissionVersion || 1}</Badge>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Timestamp: <span className="font-mono">{formatDateTime(submission.submittedAt || submission.enrolledAt)}</span>
              </p>
              {submission.userComment && (
                <p className="mt-1 text-xs text-[var(--text-muted)] bg-[var(--surface-elevated)] p-2 rounded border border-[var(--border)] italic">
                  User Comment: &quot;{submission.userComment}&quot;
                </p>
              )}
            </div>
          </div>

          {/* Step 2: Verification / Approval / Rejection */}
          {submission.status !== 'pending' && (
            <div className="relative flex items-start gap-3">
              <div
                className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center border ${
                  submission.status === 'approved'
                    ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-500 border-rose-500/40'
                }`}
              >
                {submission.status === 'approved' ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : (
                  <XCircle className="w-3 h-3" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[var(--text-primary)]">
                    {submission.status === 'approved' ? 'Task Approved & Verified' : 'Task Rejected'}
                  </span>
                  <Badge variant={submission.status === 'approved' ? 'success' : 'danger'} size="sm">
                    {submission.status.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Reviewed At: <span className="font-mono">{formatDateTime(submission.reviewedAt || submission.approvedAt)}</span>
                </p>
                {submission.reviewedBy && (
                  <p className="text-[11px] text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                    <UserCheck className="w-3 h-3" /> Reviewed by Admin UID: <code className="font-mono">{submission.reviewedBy}</code>
                  </p>
                )}
                {submission.rejectionReason && (
                  <div className="mt-1.5 p-2 bg-rose-500/10 border border-rose-500/20 rounded text-xs text-rose-500">
                    <strong>Rejection Reason:</strong> {submission.rejectionReason}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Payment Request (if requested or beyond) */}
          {submission.paymentStatus && submission.paymentStatus !== 'pending' && (
            <div className="relative flex items-start gap-3">
              <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-purple-500/20 text-purple-500 flex items-center justify-center border border-purple-500/40">
                <CreditCard className="w-3 h-3" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[var(--text-primary)]">Payment Requested</span>
                  <Badge variant="accent" size="sm">
                    {submission.paymentStatus.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Requested At: <span className="font-mono">{formatDateTime(submission.paymentRequestedAt)}</span>
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Payment Processing (if processing or paid) */}
          {(submission.paymentStatus === 'processing' || submission.paymentStatus === 'paid') && (
            <div className="relative flex items-start gap-3">
              <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center border border-amber-500/40">
                <Clock className="w-3 h-3" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[var(--text-primary)]">Payout Processing</span>
                  <Badge variant="warning" size="sm">PROCESSING</Badge>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Started At: <span className="font-mono">{formatDateTime(submission.processingStartedAt)}</span>
                </p>
                {submission.processedBy && (
                  <p className="text-[11px] text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                    <UserCheck className="w-3 h-3" /> Processed by Admin: <code className="font-mono">{submission.processedBy}</code>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 5: Payment Paid (if paid) */}
          {submission.paymentStatus === 'paid' && (
            <div className="relative flex items-start gap-3">
              <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center border border-emerald-500/40">
                <CheckCircle2 className="w-3 h-3" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[var(--text-primary)]">Payout Completed (Paid)</span>
                  <Badge variant="success" size="sm">PAID (PERMANENT LOCK)</Badge>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Paid At: <span className="font-mono">{formatDateTime(submission.paymentProcessedAt)}</span>
                </p>
                {submission.paymentReference && (
                  <div className="mt-1.5 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded text-xs font-mono text-emerald-500 font-semibold">
                    Transaction Ref: {submission.paymentReference}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
