'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  CreditCard,
  History,
  Image as ImageIcon,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  Check,
  AlertCircle,
  Lock,
  Copy,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Calendar,
  ExternalLink,
  Package,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { EnrollmentDocument } from '@/types/firestore';
import { parseDateInput } from '@/utils/formatters';

interface SubmissionCardProps {
  submission: EnrollmentDocument;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  onOpenLightbox: (
    imageUrl: string,
    title: string,
    subtitle: string,
    metadata?: EnrollmentDocument['cloudinaryMetadata']
  ) => void;
  onApprove: (submission: EnrollmentDocument) => void;
  onReject: (submission: EnrollmentDocument) => void;
  onStartProcessing: (submission: EnrollmentDocument) => void;
  onMarkPaid: (submission: EnrollmentDocument) => void;
  onViewAudit: (submission: EnrollmentDocument) => void;
}

export const SubmissionCard = React.memo(function SubmissionCard({
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
  const [imageLoaded, setImageLoaded] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [expandAssignedComment, setExpandAssignedComment] = useState(false);
  const [expandUserComment, setExpandUserComment] = useState(false);
  const [dragX, setDragX] = useState(0);

  const formatDate = (dateStr?: unknown) => {
    if (!dateStr) return '—';
    try {
      const d = parseDateInput(dateStr);
      if (!d || isNaN(d.getTime())) {
        return typeof dateStr === 'string' ? dateStr : '—';
      }
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return typeof dateStr === 'string' ? dateStr : '—';
    }
  };

  const handleCopyText = (text: string, fieldName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getStatusBadge = () => {
    switch (submission.status) {
      case 'approved':
        return (
          <Badge variant="success" size="sm" className="font-semibold shadow-xs">
            <CheckCircle2 className="w-3.5 h-3.5 inline mr-1 text-[var(--success)]" /> Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="danger" size="sm" className="font-semibold shadow-xs">
            <XCircle className="w-3.5 h-3.5 inline mr-1 text-[var(--ruby)]" /> Rejected
          </Badge>
        );
      case 'pending':
      default:
        return (
          <Badge variant="warning" size="sm" className="font-semibold shadow-xs">
            <Clock className="w-3.5 h-3.5 inline mr-1 text-[var(--warning)] animate-pulse" /> Pending Review
          </Badge>
        );
    }
  };

  const getPaymentBadge = () => {
    switch (submission.paymentStatus) {
      case 'paid':
        return (
          <Badge variant="success" size="sm" className="font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 inline mr-1 text-[var(--success)]" /> Paid
            {submission.paymentReference ? ` (${submission.paymentReference})` : ''}
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant="primary" size="sm" className="font-semibold">
            <Clock className="w-3.5 h-3.5 inline mr-1 text-[var(--primary)] animate-spin" /> Processing
          </Badge>
        );
      case 'requested':
        return (
          <Badge variant="accent" size="sm" className="font-semibold">
            <CreditCard className="w-3.5 h-3.5 inline mr-1" /> Requested
          </Badge>
        );
      case 'pending':
      default:
        return null;
    }
  };

  const proofImage = submission.screenshotUrl || submission.proofUrl;
  const rewardVal = submission.reward || submission.rewardAmount || 0;

  const canSwipe = submission.status === 'pending';

  return (
    <div className="relative overflow-hidden rounded-[var(--radius-2xl)] select-none">
      {/* Swipe Left Background Overlay (Reject) */}
      {canSwipe && (
        <div className="absolute inset-0 bg-rose-600 flex items-center justify-end px-6 text-white rounded-[var(--radius-2xl)] z-0">
          <div className="flex flex-col items-center gap-1.5 opacity-90">
            <XCircle className="w-5 h-5 text-white animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-wider">Release to Reject</span>
          </div>
        </div>
      )}

      {/* Swipe Right Background Overlay (Approve) */}
      {canSwipe && (
        <div className="absolute inset-0 bg-emerald-600 flex items-center justify-start px-6 text-white rounded-[var(--radius-2xl)] z-0">
          <div className="flex flex-col items-center gap-1.5 opacity-90">
            <CheckCircle2 className="w-5 h-5 text-white animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-wider">Release to Approve</span>
          </div>
        </div>
      )}

      <motion.div
        drag={canSwipe ? 'x' : false}
        dragDirectionLock
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.4}
        onDrag={(e, info) => setDragX(info.offset.x)}
        onDragEnd={(e, info) => {
          setDragX(0);
          if (info.offset.x > 140) {
            onApprove(submission);
          } else if (info.offset.x < -140) {
            onReject(submission);
          }
        }}
        className="relative z-10 w-full h-full"
      >
        <Card
          variant="elevated"
          className={`p-4 sm:p-5 transition-all duration-200 relative overflow-hidden rounded-[var(--radius-2xl)] border shadow-sm hover:shadow-md ${
            isSelected
              ? 'border-amber-500/80 ring-2 ring-amber-500/30 bg-amber-500/[0.03]'
              : 'border-[var(--border)] hover:border-amber-500/40'
          }`}
        >
      {/* Moderation Card Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-[var(--border)]">
        {/* Left: Checkbox + User Profile */}
        <div className="flex items-center gap-3 min-w-0">
          {submission.status === 'pending' && onToggleSelect && (
            <div className="shrink-0 flex items-center justify-center">
              <Checkbox
                checked={isSelected}
                onChange={() => onToggleSelect(submission.id)}
                aria-label={`Select submission for ${submission.userName}`}
              />
            </div>
          )}

          <Avatar
            src={submission.userAvatar || undefined}
            alt={submission.userName || 'User'}
            name={submission.userName || 'User'}
            size="md"
            className="ring-2 ring-amber-500/20 shrink-0"
          />

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-[var(--text-primary)] truncate">
                {submission.userName || 'Anonymous User'}
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 shrink-0">
                v{submission.submissionVersion || 1}
              </span>
            </div>
            <div className="text-xs font-mono text-[var(--text-secondary)] truncate flex items-center gap-1 mt-0.5">
              <span>{submission.userEmail || submission.userId}</span>
            </div>
          </div>
        </div>

        {/* Right: Badges & Reward Pill */}
        <div className="flex items-center gap-2 shrink-0">
          {getStatusBadge()}
          {getPaymentBadge()}
          <div className="px-3.5 py-1 rounded-full bg-[var(--success)]/10 border border-[var(--success)]/30 text-[var(--success)] font-black text-sm sm:text-base tracking-tight shadow-2xs font-tabular">
            ₹{rewardVal}
          </div>
        </div>
      </div>

      {/* Main Content Grid: Two Columns on Desktop (Screenshot Left, Details Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 py-4">
        {/* LEFT COLUMN: Large Screenshot Preview (Col 1 to 5 on lg) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-start">
          {proofImage && !imageError ? (
            <div
              onClick={() =>
                onOpenLightbox(
                  proofImage,
                  `${submission.appName} — Proof Screenshot`,
                  `Submitted by ${submission.userName} • ${formatDate(
                    submission.submittedAt || submission.enrolledAt
                  )}`,
                  submission.cloudinaryMetadata
                )
              }
              className="group relative w-full aspect-[9/14] sm:aspect-[4/5] lg:aspect-[9/14] bg-slate-950/80 rounded-[var(--radius-xl)] border border-[var(--border)] overflow-hidden cursor-pointer flex items-center justify-center hover:border-amber-500/60 transition-all shadow-md"
            >
              {!imageLoaded && (
                <div className="absolute inset-0 bg-slate-900/60 animate-pulse flex flex-col items-center justify-center gap-2 text-slate-400">
                  <div className="w-7 h-7 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                  <span className="text-[10px] font-mono">Loading Screenshot...</span>
                </div>
              )}

              <img
                src={proofImage}
                alt="Proof Screenshot"
                loading="lazy"
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
                className={`w-full h-full object-contain p-1 group-hover:scale-[1.02] transition-transform duration-300 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
              />

              {/* Hover Fullscreen Overlay */}
              <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center text-white text-xs gap-1.5 font-bold p-3 text-center">
                <div className="p-2.5 rounded-full bg-amber-500 text-slate-950 shadow-lg transform group-hover:scale-110 transition-transform">
                  <Maximize2 className="w-5 h-5" />
                </div>
                <span className="text-amber-300">Click to Inspect in Lightbox</span>
                <span className="text-[10px] text-slate-300 font-normal">Zoom • Rotate • Inspect</span>
              </div>

              {/* Cloudinary Badge overlay */}
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-sm border border-slate-700/50 text-[10px] font-mono text-emerald-400 flex items-center gap-1 shadow-xs">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Verified Asset</span>
              </div>
            </div>
          ) : (
            <div className="w-full aspect-[4/5] lg:aspect-[9/14] rounded-[var(--radius-xl)] bg-[var(--surface-elevated)] border border-[var(--border)] border-dashed flex flex-col items-center justify-center text-center p-4 text-[var(--text-muted)] text-xs">
              <AlertCircle className="w-8 h-8 text-rose-400 mb-2" />
              <span className="font-semibold text-[var(--text-primary)]">Screenshot Unavailable</span>
              <span className="text-[11px] text-[var(--text-secondary)] mt-1">
                No valid image URL provided by user
              </span>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Details, App Info, Comments & Verification Summary (Col 6 to 12 on lg) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          <div className="space-y-3.5">
            {/* App & Task Info Header */}
            <div className="p-3.5 rounded-[var(--radius-xl)] bg-[var(--surface-elevated)] border border-[var(--border)] flex items-start gap-3">
              {submission.appIcon ? (
                <img
                  src={submission.appIcon}
                  alt={submission.appName || 'App'}
                  loading="lazy"
                  className="w-11 h-11 rounded-[var(--radius-lg)] object-cover border border-[var(--border)] shrink-0 shadow-xs"
                />
              ) : (
                <div className="w-11 h-11 rounded-[var(--radius-lg)] bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-500 flex items-center justify-center font-black text-xs shrink-0 border border-amber-500/30">
                  APP
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm sm:text-base font-extrabold text-[var(--text-primary)] leading-tight truncate">
                    {submission.appName || 'Selected App'}
                  </h4>
                  {submission.category && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] uppercase tracking-wider shrink-0">
                      {submission.category}
                    </span>
                  )}
                </div>

                <p className="text-xs font-semibold text-[var(--text-secondary)] mt-0.5 truncate">
                  {submission.taskTitle || 'Complete Installation & Review'}
                </p>

                <div className="flex items-center gap-2 mt-1.5 text-[11px] text-[var(--text-muted)] font-mono">
                  <Package className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="truncate">Task ID: {submission.taskId || 'task_default'}</span>
                </div>
              </div>
            </div>

            {/* Comments Section */}
            {/* 1. Assigned Comment (Fixed Mode) */}
            {submission.assignedComment && (
              <div className="p-3 rounded-[var(--radius-xl)] bg-amber-500/[0.04] border border-amber-500/30 space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-amber-500 font-bold text-xs">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Assigned Comment (Fixed Mode Requirement)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyText(submission.assignedComment || '', 'assigned')}
                    className="text-[11px] text-amber-500 hover:text-amber-400 font-semibold flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 transition-colors"
                  >
                    {copiedField === 'assigned' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-500">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="relative">
                  <p
                    className={`font-mono text-xs text-[var(--text-primary)] bg-[var(--surface)] p-2.5 rounded-[var(--radius-lg)] border border-[var(--border)] leading-relaxed ${
                      !expandAssignedComment && (submission.assignedComment.length > 140)
                        ? 'line-clamp-2'
                        : ''
                    }`}
                  >
                    &quot;{submission.assignedComment}&quot;
                  </p>
                  {submission.assignedComment.length > 140 && (
                    <button
                      type="button"
                      onClick={() => setExpandAssignedComment(!expandAssignedComment)}
                      className="text-[10px] text-amber-500 hover:underline flex items-center gap-0.5 mt-1 font-semibold"
                    >
                      {expandAssignedComment ? (
                        <span className="inline-flex items-center gap-0.5">
                          Show Less <ChevronUp className="w-3 h-3" />
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5">
                          Show Full Comment <ChevronDown className="w-3 h-3" />
                        </span>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* 2. User Submitted Feedback / Notes */}
            {submission.userComment && (
              <div className="p-3 rounded-[var(--radius-xl)] bg-blue-500/[0.04] border border-blue-500/20 space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-blue-400 font-bold text-xs">
                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                    <span>User Submitted Note / Comment</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyText(submission.userComment || '', 'userComment')}
                    className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 transition-colors"
                  >
                    {copiedField === 'userComment' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-500">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="relative">
                  <p
                    className={`text-xs text-[var(--text-primary)] bg-[var(--surface)] p-2.5 rounded-[var(--radius-lg)] border border-[var(--border)] leading-relaxed ${
                      !expandUserComment && (submission.userComment.length > 140)
                        ? 'line-clamp-2'
                        : ''
                    }`}
                  >
                    &quot;{submission.userComment}&quot;
                  </p>
                  {submission.userComment.length > 140 && (
                    <button
                      type="button"
                      onClick={() => setExpandUserComment(!expandUserComment)}
                      className="text-[10px] text-blue-400 hover:underline flex items-center gap-0.5 mt-1 font-semibold"
                    >
                      {expandUserComment ? (
                        <span className="inline-flex items-center gap-0.5">
                          Show Less <ChevronUp className="w-3 h-3" />
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5">
                          Show Full Comment <ChevronDown className="w-3 h-3" />
                        </span>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Verification & Timestamps Summary Grid */}
            <div className="p-3 rounded-[var(--radius-xl)] bg-[var(--surface-elevated)] border border-[var(--border)] space-y-2">
              <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Verification Details
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                  <Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Submitted:</span>
                  <span className="font-mono text-[var(--text-primary)] font-semibold truncate">
                    {formatDate(submission.submittedAt || submission.enrolledAt)}
                  </span>
                </div>

                {submission.reviewedAt && (
                  <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
                    <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>Reviewed:</span>
                    <span className="font-mono text-[var(--text-primary)] font-semibold truncate">
                      {formatDate(submission.reviewedAt)}
                    </span>
                  </div>
                )}
              </div>

              {submission.rejectionReason && (
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-[var(--radius-lg)] text-rose-500 text-xs font-medium space-y-0.5">
                  <div className="font-bold flex items-center gap-1 text-[11px] uppercase tracking-wider">
                    <AlertCircle className="w-3.5 h-3.5" /> Rejection Feedback
                  </div>
                  <p className="text-xs text-rose-300">{submission.rejectionReason}</p>
                </div>
              )}
            </div>
          </div>

          {/* Card Footer Action Controls */}
          <div className="pt-3 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-2.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewAudit(submission)}
              leftIcon={<History className="w-3.5 h-3.5" />}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              Audit History
            </Button>

            <div className="flex items-center gap-2 shrink-0">
              {/* Approval & Rejection buttons (for pending status) */}
              {submission.status === 'pending' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onReject(submission)}
                    leftIcon={<XCircle className="w-4 h-4 text-[var(--ruby)]" />}
                    className="border-[var(--ruby)]/30 text-[var(--ruby)] hover:bg-[var(--ruby)]/10 hover:border-[var(--ruby)]/60 font-semibold"
                  >
                    Reject
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onApprove(submission)}
                    leftIcon={<Check className="w-4 h-4" />}
                    className="bg-[var(--success)] hover:opacity-90 text-white font-bold shadow-xs"
                  >
                    Approve & Lock
                  </Button>
                </>
              )}

              {/* Payment Workflow buttons */}
              {submission.status === 'approved' && submission.paymentStatus === 'requested' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onStartProcessing(submission)}
                  leftIcon={<Clock className="w-3.5 h-3.5 text-[var(--primary-soft)]" />}
                  className="border-[var(--primary)]/30 text-[var(--primary)] hover:bg-[var(--primary)]/10 font-semibold"
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
                    leftIcon={<CreditCard className="w-4 h-4" />}
                    className="bg-[var(--success)] hover:opacity-90 text-white font-bold shadow-xs"
                  >
                    Mark Paid
                  </Button>
                )}

              {submission.paymentStatus === 'paid' && (
                <div className="flex items-center gap-1.5 text-xs text-[var(--success)] font-extrabold px-3 py-1.5 rounded-full bg-[var(--success)]/10 border border-[var(--success)]/20">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Payout Paid & Locked</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
      </motion.div>
    </div>
  );
});

