'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Coins,
  ShieldCheck,
  ExternalLink,
  Copy,
  Check,
  MessageSquare,
  AlertCircle,
  Loader2,
  Send,
  Smartphone,
  RefreshCcw,
  Lock,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { useAuthContext } from '@/contexts/AuthContext';
import { useRealtimeDocument } from '@/hooks/useRealtimeDocument';
import { useSubmitProof } from '@/hooks/useSubmitProof';
import { useToast } from '@/hooks/use-toast';
import { TaskDocument, EnrollmentDocument, FIRESTORE_COLLECTIONS, CloudinaryMetadata } from '@/types/firestore';
import { TaskStatusTimeline } from '@/components/tasks/TaskStatusTimeline';
import { TaskInstructionsList } from '@/components/tasks/TaskInstructionsList';
import { ScreenshotUploader } from '@/components/tasks/ScreenshotUploader';
import { formatDate, formatDateTime } from '@/utils/formatters';
import { isTaskExpired } from '@/lib/taskAvailability';
import { resolveMemberReward } from '@/lib/rewardResolver';

interface TaskDetailPageProps {
  params: Promise<{ enrollmentId: string }>;
}

export default function TaskDetailPage({ params }: TaskDetailPageProps) {
  const { enrollmentId } = use(params);
  const router = useRouter();
  const { currentUser, userProfile, loading: authLoading } = useAuthContext();
  const { toast } = useToast();

  // Load Realtime Enrollment
  const {
    data: enrollment,
    loading: enrollmentLoading,
    error: enrollmentError,
  } = useRealtimeDocument<EnrollmentDocument>(
    FIRESTORE_COLLECTIONS.ENROLLMENTS,
    enrollmentId
  );

  // Load Realtime Task
  const taskId = enrollment?.taskId || null;
  const {
    data: task,
    loading: taskLoading,
  } = useRealtimeDocument<TaskDocument>(FIRESTORE_COLLECTIONS.TASKS, taskId);

  // Submission hook
  const { submitProof, isSubmitting } = useSubmitProof();

  // Local state for uploading, metadata and hint comment
  const [uploadedData, setUploadedData] = useState<{
    url: string;
    publicId: string;
    metadata: CloudinaryMetadata;
  } | null>(null);

  const [userComment, setUserComment] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Initialize screenshot and comment from enrollment if exists
  const initialScreenshotUrl = enrollment?.screenshotUrl;
  const initialUserComment = enrollment?.userComment;
  const cloudinaryPublicId = enrollment?.cloudinaryMetadata?.public_id;

  React.useEffect(() => {
    if (initialScreenshotUrl) {
      setUploadedData((prev) => {
        if (prev?.url === initialScreenshotUrl) return prev;
        return {
          url: initialScreenshotUrl,
          publicId: cloudinaryPublicId || 'existing_proof',
          metadata: {
            public_id: cloudinaryPublicId || 'existing_proof',
            secure_url: initialScreenshotUrl,
          },
        };
      });
    }
    if (initialUserComment) {
      setUserComment((prev) => (prev ? prev : initialUserComment));
    }
  }, [initialScreenshotUrl, initialUserComment, cloudinaryPublicId]);

  const handleUploadComplete = React.useCallback(
    (data: { url: string; publicId: string; metadata: CloudinaryMetadata } | null) => {
      setUploadedData(data);
    },
    []
  );

  // Copy assigned comment handler
  const handleCopyComment = (commentText: string) => {
    if (!commentText) return;
    navigator.clipboard.writeText(commentText);
    setCopied(true);
    toast({
      title: 'Comment Copied! 📋',
      message: 'Assigned comment copied to clipboard.',
      variant: 'success',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  // Guards
  if (authLoading || enrollmentLoading || taskLoading) {
    return (
      <PageContainer size="lg">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
          <p className="text-xs text-[var(--text-secondary)] font-medium">
            Loading task verification details...
          </p>
        </div>
      </PageContainer>
    );
  }

  if (!currentUser) {
    return (
      <PageContainer size="lg">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 text-center max-w-md mx-auto my-12">
          <AlertCircle className="w-12 h-12 text-[var(--warning)] mx-auto mb-3" />
          <h2 className="text-base font-bold text-[var(--text-primary)]">Authentication Required</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 mb-5">
            Please sign in to view your enrolled task details.
          </p>
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="w-full py-2.5 px-4 bg-[var(--primary)] text-[var(--primary-fg)] text-xs font-semibold rounded-xl"
          >
            Return to Dashboard
          </button>
        </div>
      </PageContainer>
    );
  }

  if (enrollmentError || !enrollment) {
    return (
      <PageContainer size="lg">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 text-center max-w-md mx-auto my-12">
          <AlertCircle className="w-12 h-12 text-[var(--danger)] mx-auto mb-3" />
          <h2 className="text-base font-bold text-[var(--text-primary)]">Enrollment Not Found</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 mb-5">
            The task enrollment you are trying to view does not exist or has been removed.
          </p>
          <Link
            href="/my-tasks"
            className="inline-block w-full py-2.5 px-4 bg-[var(--surface-elevated)] border border-[var(--border)] text-xs font-semibold text-[var(--text-primary)] rounded-xl"
          >
            View My Tasks
          </Link>
        </div>
      </PageContainer>
    );
  }

  // Rule 4 — Ownership Validation
  if (enrollment.userId !== currentUser.uid) {
    return (
      <PageContainer size="lg">
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 text-center max-w-md mx-auto my-12">
          <AlertCircle className="w-12 h-12 text-[var(--danger)] mx-auto mb-3" />
          <h2 className="text-base font-bold text-[var(--text-primary)]">Access Denied</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 mb-5">
            Permission Denied: You do not own this task enrollment.
          </p>
          <Link
            href="/my-tasks"
            className="inline-block w-full py-2.5 px-4 bg-[var(--primary)] text-[var(--primary-fg)] text-xs font-semibold rounded-xl"
          >
            Return to My Tasks
          </Link>
        </div>
      </PageContainer>
    );
  }

  // Status checks according to Rule 2 & Rule 3
  const resolvedReward = resolveMemberReward(
    enrollment.rewardAmount || enrollment.reward || task?.rewardAmount || 0,
    userProfile?.effectiveReward
  );

  const isApproved = enrollment.status === 'approved';
  const isRejected = enrollment.status === 'rejected';
  const isPendingSubmitted = enrollment.status === 'pending' && Boolean(enrollment.submittedAt);
  const isPendingUnsubmitted = enrollment.status === 'pending' && !enrollment.submittedAt;

  const isExpired = isTaskExpired((task || enrollment) as unknown as TaskDocument);

  const isExpiredUnsubmitted = isPendingUnsubmitted && isExpired;
  const isExpiredRejected = isRejected && isExpired;

  // Rule 2: Immutable Lock when submitted & pending or approved
  // Rule 3: Unlock screenshot & comment ONLY if rejected (and NOT expired)
  const isReadOnly = isApproved || isPendingSubmitted || isExpiredUnsubmitted || isExpiredRejected;

  // Determine comment mode
  const isHintMode = task?.commentMode === 'hint';
  const isFixedMode =
    task?.commentMode === 'fixed' ||
    Boolean(enrollment.assignedComment && enrollment.assignedComment.length > 0);

  const playStoreUrl = task?.playStoreUrl || task?.appUrl || 'https://play.google.com/store';

  // Rule 7 — Duplicate submission prevention & Validation check
  const canSubmit = Boolean(
    uploadedData?.url &&
      (!isHintMode || userComment.trim().length > 0) &&
      !isReadOnly &&
      !isSubmitting
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    await submitProof({
      enrollmentId,
      screenshotUrl: uploadedData!.url,
      userComment: isHintMode ? userComment : undefined,
      cloudinaryMetadata: uploadedData!.metadata,
      publicIdToRollback: uploadedData!.publicId,
      isResubmission: isRejected,
    });
  };

  return (
    <PageContainer size="lg">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto space-y-6 pb-12"
      >
        {/* Back Navigation Button */}
        <Link
          href="/my-tasks"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Tasks
        </Link>

        {/* Page Header Card */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 sm:p-6 shadow-xs relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-14 h-14 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                {task?.appIcon ? (
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
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[var(--text-secondary)] truncate">
                    {task?.appName || 'Partner Application'}
                  </span>
                  {task?.isVerified && (
                    <span className="inline-flex items-center text-[var(--primary)] shrink-0">
                      <ShieldCheck className="w-4 h-4 fill-[var(--primary)]/10" />
                    </span>
                  )}
                </div>
                <h1 className="text-lg sm:text-xl font-extrabold text-[var(--text-primary)] leading-tight truncate">
                  {task?.title || enrollment.taskTitle || 'Enrolled Task'}
                </h1>
                <p className="text-[11px] text-[var(--text-muted)] font-mono mt-0.5">
                  Enrolled:{' '}
                  {formatDate(enrollment.enrolledAt)}
                </p>
              </div>
            </div>

            {/* Reward Badge */}
            <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-[var(--border)]">
              <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">
                Reward Amount
              </span>
              <div className="flex items-center gap-1 text-xl sm:text-2xl font-black text-[var(--primary)] font-mono">
                <Coins className="w-5 h-5 text-[var(--primary)]" />
                <span>₹{resolvedReward}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Timeline */}
        <TaskStatusTimeline
          status={enrollment.status}
          enrolledAt={enrollment.enrolledAt}
          submittedAt={enrollment.submittedAt}
          reviewedAt={enrollment.reviewedAt}
          rejectionReason={enrollment.rejectionReason}
          submissionVersion={enrollment.submissionVersion}
        />

        {/* Approved Banner */}
        {isApproved && (
          <div className="p-4 rounded-2xl bg-[var(--success)]/10 border border-[var(--success)]/30 text-[var(--text-primary)] flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[var(--success)] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-[var(--success)]">Proof Verified & Reward Credited</h4>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                Your submission passed admin verification on{' '}
                {enrollment.reviewedAt
                  ? formatDate(enrollment.reviewedAt)
                  : 'recently'}
                . Reward of ₹{resolvedReward} has been credited.
              </p>
            </div>
          </div>
        )}

        {/* Under Review Read-Only Banner (Rule 2) */}
        {isPendingSubmitted && (
          <div className="p-4 rounded-2xl bg-[var(--warning)]/10 border border-[var(--warning)]/30 text-[var(--text-primary)] flex items-start gap-3">
            <Lock className="w-5 h-5 text-[var(--warning)] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-[var(--warning)]">Submission Locked for Admin Review</h4>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                Your task proof was submitted on{' '}
                {formatDateTime(enrollment.submittedAt!)}
                . All fields are locked while our verification team reviews your screenshot.
              </p>
            </div>
          </div>
        )}

        {/* Expired Banner */}
        {(isExpiredUnsubmitted || isExpiredRejected) && (
          <div className="p-4 rounded-2xl bg-[var(--danger)]/10 border border-[var(--danger)]/30 text-[var(--danger)] flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-[var(--danger)]" />
            <div>
              <h4 className="text-xs font-bold text-[var(--danger)]">Task Expired</h4>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                Submission deadline has passed. This task is no longer accepting proof submissions.
              </p>
            </div>
          </div>
        )}

        {/* Rejected Banner & Unlock Prompt (Rule 3) */}
        {isRejected && !isExpired && (
          <div className="p-4 rounded-2xl bg-[var(--danger)]/10 border border-[var(--danger)]/30 text-[var(--text-primary)] flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[var(--danger)] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-[var(--danger)]">Submission Proof Rejected</h4>
              <p className="text-xs text-[var(--text-primary)] font-medium mt-1">
                Reason: &quot;{enrollment.rejectionReason || 'Proof screenshot invalid or comment unverified.'}&quot;
              </p>
              <p className="text-[11px] text-[var(--text-secondary)] mt-1">
                🔓 Editing unlocked: Please replace your screenshot or comment below and click &apos;Resubmit Task Proof&apos;.
              </p>
            </div>
          </div>
        )}

        {/* Task Instructions */}
        <TaskInstructionsList
          instructions={task?.instructions}
          appName={task?.appName || task?.title}
        />

        {/* Fixed Comment Mode Section */}
        {isFixedMode && enrollment.assignedComment && (
          <div className="bg-[var(--surface)] border border-[var(--primary)]/30 rounded-2xl p-5 shadow-xs mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[var(--primary)] uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4" /> Assigned Comment to Post
              </span>
              <button
                type="button"
                onClick={() => handleCopyComment(enrollment.assignedComment!)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--primary)] hover:underline cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy Comment'}
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--primary)]/5 border border-[var(--primary)]/20 text-xs font-medium text-[var(--text-primary)] font-mono leading-relaxed select-all">
              &quot;{enrollment.assignedComment}&quot;
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-2">
              💡 Copy this exact text and paste it into your Google Play Store review.
            </p>
          </div>
        )}

        {/* Hint Comment Mode Section */}
        {isHintMode && (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 shadow-xs mb-6 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-primary)]">
              <MessageSquare className="w-4 h-4 text-[var(--primary)]" />
              Write Your Review Comment <span className="text-[var(--danger)]">*</span>
            </div>

            {task?.hint && (
              <p className="text-xs text-[var(--text-secondary)] bg-[var(--surface-elevated)] p-3 rounded-xl border border-[var(--border)] italic">
                Hint / Guidelines: &quot;{task.hint}&quot;
              </p>
            )}

            <textarea
              value={userComment}
              onChange={(e) => setUserComment(e.target.value)}
              disabled={isReadOnly}
              placeholder="Enter or paste the exact comment text you submitted on Play Store..."
              rows={3}
              className="w-full p-3 text-xs bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all resize-none disabled:opacity-60 disabled:cursor-not-allowed"
            />
            <p className="text-[10px] text-[var(--text-muted)] font-mono text-right">
              {userComment.trim().length} characters entered
            </p>
          </div>
        )}

        {/* Play Store CTA Button */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 shadow-xs mb-6 text-center space-y-3">
          <p className="text-xs text-[var(--text-secondary)] font-medium">
            Open the app page on Google Play Store to install and leave your rating or comment:
          </p>
          <a
            href={playStoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3.5 bg-[var(--surface-elevated)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--text-primary)] text-sm font-bold rounded-xl shadow-xs transition-all duration-200 active:scale-95"
          >
            <Smartphone className="w-4 h-4 text-[var(--primary)]" />
            <span>Open Play Store App Page</span>
            <ExternalLink className="w-4 h-4 text-[var(--text-muted)] ml-1" />
          </a>
        </div>

        {/* Screenshot Uploader */}
        <ScreenshotUploader
          initialUrl={uploadedData?.url || initialScreenshotUrl}
          onUploadComplete={handleUploadComplete}
          isDisabled={isReadOnly}
        />

        {/* Rule 2 & 7: Submit Button shown ONLY if not read-only */}
        {(isExpiredUnsubmitted || isExpiredRejected) ? (
          <div className="pt-2">
            <button
              type="button"
              disabled
              className="w-full py-4 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 bg-[var(--surface-elevated)] text-[var(--text-muted)] border border-[var(--border)] cursor-not-allowed opacity-70"
            >
              <Lock className="w-5 h-5" />
              <span>Task Expired</span>
            </button>
            <p className="text-[11px] text-center text-[var(--text-muted)] mt-2 font-medium">
              Submission deadline has passed.
            </p>
          </div>
        ) : !isReadOnly ? (
          <div className="pt-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`w-full py-4 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 ${
                canSubmit
                  ? 'bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-fg)] active:scale-[0.99] cursor-pointer'
                  : 'bg-[var(--surface-elevated)] text-[var(--text-muted)] border border-[var(--border)] cursor-not-allowed opacity-70'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Verifying & Submitting Proof...</span>
                </>
              ) : isRejected ? (
                <>
                  <RefreshCcw className="w-5 h-5" />
                  <span>Resubmit Task Proof</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Submit Task Proof for Review</span>
                </>
              )}
            </button>

            {!canSubmit && !isSubmitting && (
              <p className="text-[11px] text-center text-[var(--text-muted)] mt-2 font-medium">
                {!uploadedData?.url
                  ? '⚠️ Upload screenshot proof above to enable submission.'
                  : isHintMode && !userComment.trim()
                  ? '⚠️ Enter your review comment above to enable submission.'
                  : ''}
              </p>
            )}
          </div>
        ) : null}
      </motion.div>
    </PageContainer>
  );
}
