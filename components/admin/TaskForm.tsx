'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Save,
  Lock,
  MessageSquare,
  FileText,
  DollarSign,
  Smartphone,
  Link as LinkIcon,
  Calendar,
  AlertCircle,
  HelpCircle,
  Loader2,
  List,
  Sparkles,
} from 'lucide-react';
import {
  doc,
  setDoc,
  updateDoc,
  collection,
} from 'firebase/firestore';

import { getFirebaseDb, isFirebaseConfigured } from '@/firebase/config';
import {
  TaskDocument,
  TaskCategory,
  TaskStatus,
  CommentMode,
  FIRESTORE_COLLECTIONS,
} from '@/types/firestore';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CloudinaryIconUpload } from '@/components/admin/CloudinaryIconUpload';
import { LiveTaskPreview, TaskFormData } from '@/components/admin/LiveTaskPreview';

interface TaskFormProps {
  initialTask?: TaskDocument | null;
  isEditMode?: boolean;
}

export function TaskForm({ initialTask = null, isEditMode = false }: TaskFormProps) {
  const router = useRouter();
  const { currentUser, userProfile } = useAuth();

  // Determine if task has existing enrollments to enforce lock rules
  const enrolledCount = initialTask?.enrolledCount ?? initialTask?.currentSubmissions ?? 0;
  const isLockedByEnrollments = isEditMode && enrolledCount > 0;

  // Form Field States
  const [title, setTitle] = useState(initialTask?.title || '');
  const [appName, setAppName] = useState(initialTask?.appName || '');
  const [playStoreUrl, setPlayStoreUrl] = useState(
    initialTask?.playStoreUrl || initialTask?.appUrl || ''
  );
  const [rewardAmount, setRewardAmount] = useState<number>(
    initialTask?.rewardAmount || 10
  );
  const [category, setCategory] = useState<TaskCategory>(
    initialTask?.category || 'app_download'
  );
  const [description, setDescription] = useState(initialTask?.description || '');
  const [instructions, setInstructions] = useState(
    initialTask?.instructions ||
      '1. Download the app from the official Google Play Store.\n2. Open the app and complete registration.\n3. Search and post your assigned review/comment.\n4. Take a clear screenshot of your published comment and upload proof.'
  );
  const [appIcon, setAppIcon] = useState(initialTask?.appIcon || '');

  const [commentMode, setCommentMode] = useState<CommentMode>(
    initialTask?.commentMode || 'fixed'
  );
  const [rawCommentsText, setRawCommentsText] = useState<string>(
    initialTask?.comments ? initialTask.comments.join('\n') : ''
  );
  const [hintText, setHintText] = useState<string>(initialTask?.hint || '');
  const [manualSlots, setManualSlots] = useState<number>(
    initialTask?.totalSlots || initialTask?.maxSubmissions || 10
  );

  const [expiresAt, setExpiresAt] = useState<string>(() => {
    if (initialTask?.expiresAt) {
      try {
        const d = new Date(initialTask.expiresAt);
        // Format to YYYY-MM-DDTHH:mm for datetime-local input
        return d.toISOString().slice(0, 16);
      } catch {
        return '';
      }
    }
    return '';
  });

  const [status, setStatus] = useState<TaskStatus>(
    initialTask?.status || 'active'
  );

  // Status & Validation States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Parse Fixed Comments in real-time
  const commentAnalysis = useMemo(() => {
    if (commentMode !== 'fixed') {
      return {
        lines: [],
        validComments: [],
        duplicates: [],
        emptyCount: 0,
        hasDuplicates: false,
      };
    }

    const lines = rawCommentsText
      .split('\n')
      .map((line) => line.trim());

    const validComments: string[] = [];
    const duplicates: string[] = [];
    const seen = new Set<string>();
    let emptyCount = 0;

    lines.forEach((line) => {
      if (!line) {
        emptyCount++;
        return;
      }
      if (seen.has(line)) {
        duplicates.push(line);
      } else {
        seen.add(line);
        validComments.push(line);
      }
    });

    return {
      lines,
      validComments,
      duplicates,
      emptyCount,
      hasDuplicates: duplicates.length > 0,
    };
  }, [rawCommentsText, commentMode]);

  // Sync Total Slots with Fixed Comments count
  const effectiveTotalSlots =
    commentMode === 'fixed'
      ? commentAnalysis.validComments.length
      : manualSlots;

  // Construct TaskFormData for Live Task Preview
  const previewData: TaskFormData = {
    title,
    appName,
    playStoreUrl,
    rewardAmount: Number(rewardAmount) || 0,
    category,
    description,
    instructions,
    appIcon,
    commentMode,
    commentsText: rawCommentsText,
    parsedComments: commentAnalysis.validComments,
    hintText,
    manualSlots: Number(manualSlots) || 1,
    expiresAt,
    status,
  };

  // Form Validation Logic
  const validateForm = (): boolean => {
    setFormError(null);

    if (!title.trim()) {
      setFormError('Task Title is required.');
      return false;
    }

    if (!appName.trim()) {
      setFormError('App Name is required.');
      return false;
    }

    if (!playStoreUrl.trim()) {
      setFormError('Play Store URL is required.');
      return false;
    }

    // Basic URL validation
    if (
      !playStoreUrl.startsWith('http://') &&
      !playStoreUrl.startsWith('https://')
    ) {
      setFormError('Play Store URL must start with http:// or https://');
      return false;
    }

    if (!rewardAmount || rewardAmount <= 0) {
      setFormError('Reward amount must be greater than ₹0.');
      return false;
    }

    if (commentMode === 'fixed') {
      if (commentAnalysis.validComments.length === 0) {
        setFormError('Fixed Comments mode requires at least 1 valid comment.');
        return false;
      }

      if (commentAnalysis.hasDuplicates) {
        setFormError(
          `Duplicate comments found (${commentAnalysis.duplicates.length}). Please remove duplicate lines before saving.`
        );
        return false;
      }
    } else if (commentMode === 'hint') {
      if (!hintText.trim()) {
        setFormError('Comment Hint guidance is required in Hint Mode.');
        return false;
      }
      if (!manualSlots || manualSlots <= 0) {
        setFormError('Total Slots must be at least 1 in Hint Mode.');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    if (!isFirebaseConfigured()) {
      setFormError('Firebase is not configured.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const db = getFirebaseDb();
      const nowIso = new Date().toISOString();
      const userUid = currentUser?.uid || 'admin_system';

      let formattedExpiry: string | undefined = undefined;
      if (expiresAt) {
        try {
          formattedExpiry = new Date(expiresAt).toISOString();
        } catch {
          // ignore
        }
      }

      if (isEditMode && initialTask?.id) {
        // UPDATE EXISTING TASK
        const taskRef = doc(db, FIRESTORE_COLLECTIONS.TASKS, initialTask.id);

        const updatePayload: Record<string, unknown> = {
          title: title.trim(),
          rewardAmount: Number(rewardAmount),
          category,
          description: description.trim(),
          instructions: instructions.trim(),
          status,
          updatedAt: nowIso,
          updatedBy: userUid,
        };

        if (appIcon) updatePayload.appIcon = appIcon;
        if (formattedExpiry) updatePayload.expiresAt = formattedExpiry;

        // Only update locked fields if NOT locked by existing enrollments
        if (!isLockedByEnrollments) {
          updatePayload.appName = appName.trim();
          updatePayload.playStoreUrl = playStoreUrl.trim();
          updatePayload.appUrl = playStoreUrl.trim();
          updatePayload.commentMode = commentMode;
          updatePayload.totalSlots = effectiveTotalSlots;
          updatePayload.maxSubmissions = effectiveTotalSlots;

          if (commentMode === 'fixed') {
            updatePayload.comments = commentAnalysis.validComments;
            updatePayload.hint = '';
          } else {
            updatePayload.comments = [];
            updatePayload.hint = hintText.trim();
          }
        }

        await updateDoc(taskRef, updatePayload);
      } else {
        // CREATE NEW TASK
        const newDocRef = doc(collection(db, FIRESTORE_COLLECTIONS.TASKS));

        const newTaskPayload: TaskDocument = {
          id: newDocRef.id,
          title: title.trim(),
          appName: appName.trim(),
          playStoreUrl: playStoreUrl.trim(),
          appUrl: playStoreUrl.trim(),
          rewardAmount: Number(rewardAmount),
          category,
          description: description.trim(),
          instructions: instructions.trim(),
          appIcon: appIcon || '',
          commentMode,
          comments: commentMode === 'fixed' ? commentAnalysis.validComments : [],
          hint: commentMode === 'hint' ? hintText.trim() : '',
          totalSlots: effectiveTotalSlots,
          maxSubmissions: effectiveTotalSlots,
          enrolledCount: 0,
          currentSubmissions: 0,
          status,
          isVerified: true,
          expiresAt: formattedExpiry,
          createdBy: userUid,
          createdAt: nowIso,
          updatedAt: nowIso,
        };

        await setDoc(newDocRef, newTaskPayload);
      }

      router.push('/admin/tasks');
    } catch (err: unknown) {
      console.error('[TaskForm Error]', err);
      const msg = err instanceof Error ? err.message : 'Failed to save task document to Firestore.';
      setFormError(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Main Form Column (8 cols) */}
      <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-6">
        {/* Lock Warning Banner if enrollments > 0 */}
        {isLockedByEnrollments && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-[var(--radius-lg)] flex items-start gap-3 text-xs text-amber-500">
            <Lock className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-amber-400">
                Structural Fields Locked ({enrolledCount} active user enrollments)
              </span>
              <p className="text-[11px] leading-relaxed opacity-90">
                To prevent data corruption for users currently completing this task, Comment Mode, Comments, Slot counts, App Name, and Play Store URL are permanently locked. Title, Reward, Instructions, Status, and Expiry date remain fully editable.
              </p>
            </div>
          </div>
        )}

        {/* Section 1: Basic App Details */}
        <div className="p-6 rounded-[var(--radius-xl)] bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-[var(--border)]">
            <Smartphone className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold font-heading text-[var(--text-primary)]">
              App & Offer Identification
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Task Title */}
            <div className="sm:col-span-2">
              <Input
                label="Task Title"
                placeholder="e.g. Rate & Post 5-Star Review on Play Store"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* App Name */}
            <div>
              <Input
                label="Partner App Name"
                placeholder="e.g. Dream11 or Pocket Ludo"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                disabled={isLockedByEnrollments}
                leftIcon={isLockedByEnrollments ? <Lock className="w-4 h-4 text-amber-500" /> : undefined}
                required
              />
            </div>

            {/* Reward Amount */}
            <div>
              <Input
                label="User Reward Amount (₹)"
                type="number"
                min={1}
                step={1}
                placeholder="10"
                value={rewardAmount}
                onChange={(e) => setRewardAmount(Number(e.target.value))}
                leftIcon={<DollarSign className="w-4 h-4 text-emerald-500" />}
                required
              />
            </div>

            {/* Play Store URL */}
            <div className="sm:col-span-2">
              <Input
                label="Google Play Store URL"
                placeholder="https://play.google.com/store/apps/details?id=com.example.app"
                value={playStoreUrl}
                onChange={(e) => setPlayStoreUrl(e.target.value)}
                disabled={isLockedByEnrollments}
                leftIcon={isLockedByEnrollments ? <Lock className="w-4 h-4 text-amber-500" /> : <LinkIcon className="w-4 h-4 text-[var(--text-muted)]" />}
                required
              />
            </div>

            {/* Category */}
            <div>
              <Select
                label="Offer Category"
                value={category}
                onChange={(val) => setCategory(val as TaskCategory)}
                options={[
                  { value: 'app_download', label: 'App Download & Review' },
                  { value: 'survey', label: 'Survey / Questionnaire' },
                  { value: 'video_watch', label: 'Video Watch & Share' },
                  { value: 'social_follow', label: 'Social Media Action' },
                  { value: 'referral', label: 'Referral Sign Up' },
                  { value: 'other', label: 'Other Offer' },
                ]}
              />
            </div>

            {/* Status */}
            <div>
              <Select
                label="Offer Status"
                value={status}
                onChange={(val) => setStatus(val as TaskStatus)}
                options={[
                  { value: 'active', label: 'Active (Published to Users)' },
                  { value: 'paused', label: 'Paused / Inactive' },
                  { value: 'completed', label: 'Completed (Slots Full)' },
                  { value: 'draft', label: 'Draft Mode' },
                ]}
              />
            </div>

            {/* Expiry Date */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                Optional Expiry Date & Time
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[var(--radius-md)] bg-[var(--surface-elevated)] border border-[var(--border)] text-xs font-mono text-[var(--text-primary)] focus:outline-2 focus:outline-[var(--primary)]"
                />
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-1">
                Tasks past expiry date will automatically transition status to Expired.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: App Icon Upload */}
        <div className="p-6 rounded-[var(--radius-xl)] bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
            <h3 className="text-sm font-bold font-heading text-[var(--text-primary)]">
              Cloudinary App Icon Asset
            </h3>
            <Badge variant="outline" size="sm">
              Folder: playpay/app-icons
            </Badge>
          </div>

          <CloudinaryIconUpload
            value={appIcon}
            onChange={(url) => setAppIcon(url)}
          />
        </div>

        {/* Section 3: Comment Allocation Mode & Configuration */}
        <div className="p-6 rounded-[var(--radius-xl)] bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold font-heading text-[var(--text-primary)]">
                Comment Allocation Configuration
              </h3>
            </div>
            {isLockedByEnrollments && (
              <Badge variant="warning" size="sm" className="gap-1">
                <Lock className="w-3 h-3" /> Locked
              </Badge>
            )}
          </div>

          {/* Mode Selector */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={isLockedByEnrollments}
              onClick={() => setCommentMode('fixed')}
              className={`p-3.5 rounded-[var(--radius-md)] border text-left flex flex-col gap-1 transition-all ${
                commentMode === 'fixed'
                  ? 'border-amber-500 bg-amber-500/10 text-amber-500 ring-1 ring-amber-500'
                  : 'border-[var(--border)] bg-[var(--surface-elevated)]/50 text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)]'
              } ${isLockedByEnrollments ? 'cursor-not-allowed opacity-75' : ''}`}
            >
              <div className="flex items-center gap-2 font-bold text-xs">
                <List className="w-4 h-4" />
                <span>Fixed Comments Mode</span>
              </div>
              <span className="text-[10px] text-[var(--text-muted)]">
                Provide specific lines. Each enrolled user gets one unique comment automatically.
              </span>
            </button>

            <button
              type="button"
              disabled={isLockedByEnrollments}
              onClick={() => setCommentMode('hint')}
              className={`p-3.5 rounded-[var(--radius-md)] border text-left flex flex-col gap-1 transition-all ${
                commentMode === 'hint'
                  ? 'border-amber-500 bg-amber-500/10 text-amber-500 ring-1 ring-amber-500'
                  : 'border-[var(--border)] bg-[var(--surface-elevated)]/50 text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)]'
              } ${isLockedByEnrollments ? 'cursor-not-allowed opacity-75' : ''}`}
            >
              <div className="flex items-center gap-2 font-bold text-xs">
                <HelpCircle className="w-4 h-4" />
                <span>Hint Guidance Mode</span>
              </div>
              <span className="text-[10px] text-[var(--text-muted)]">
                Provide general guidelines. Users write their own comment based on your hint.
              </span>
            </button>
          </div>

          {/* Fixed Comments Editor */}
          {commentMode === 'fixed' && (
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[var(--text-primary)]">
                  Comment Database (One comment per line)
                </label>
                <Textarea
                  rows={8}
                  placeholder={`Great gaming app! Smooth interface and super fast payouts.\nLoved the graphics and user experience. 5 stars!\nHighly recommended for casual ludo tournaments.`}
                  value={rawCommentsText}
                  onChange={(e) => setRawCommentsText(e.target.value)}
                  disabled={isLockedByEnrollments}
                  className="font-mono text-xs"
                />
              </div>

              {/* Realtime Comment Analysis Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-[var(--radius-md)] bg-[var(--surface-elevated)] border border-[var(--border)] text-center">
                  <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block">
                    Total Comments
                  </span>
                  <span className="text-lg font-extrabold font-mono text-[var(--primary)]">
                    {commentAnalysis.validComments.length}
                  </span>
                </div>

                <div className="p-3 rounded-[var(--radius-md)] bg-[var(--surface-elevated)] border border-[var(--border)] text-center">
                  <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block">
                    Auto Total Slots
                  </span>
                  <span className="text-lg font-extrabold font-mono text-emerald-500">
                    {effectiveTotalSlots}
                  </span>
                </div>

                <div className="p-3 rounded-[var(--radius-md)] bg-[var(--surface-elevated)] border border-[var(--border)] text-center">
                  <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block">
                    Blank Lines Filtered
                  </span>
                  <span className="text-lg font-extrabold font-mono text-[var(--text-muted)]">
                    {commentAnalysis.emptyCount}
                  </span>
                </div>

                <div className="p-3 rounded-[var(--radius-md)] bg-[var(--surface-elevated)] border border-[var(--border)] text-center">
                  <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block">
                    Duplicates
                  </span>
                  <span className={`text-lg font-extrabold font-mono ${commentAnalysis.hasDuplicates ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {commentAnalysis.duplicates.length}
                  </span>
                </div>
              </div>

              {/* Duplicate Comment Alert */}
              {commentAnalysis.hasDuplicates && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-[var(--radius-md)] text-xs text-rose-500 space-y-1">
                  <div className="flex items-center gap-2 font-bold">
                    <AlertCircle className="w-4 h-4" />
                    <span>Duplicate Comments Detected ({commentAnalysis.duplicates.length})</span>
                  </div>
                  <p className="text-[11px] opacity-90">
                    Duplicate comments: &quot;{commentAnalysis.duplicates.slice(0, 3).join('", "')}&quot;... Please remove duplicates so each slot gets a unique string.
                  </p>
                </div>
              )}

              {/* Parsed Preview (First 10) */}
              {commentAnalysis.validComments.length > 0 && (
                <div className="p-3 rounded-[var(--radius-md)] bg-[var(--surface-elevated)]/40 border border-[var(--border)] space-y-2 text-xs">
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">
                    Parsed Comments Preview (Showing First {Math.min(10, commentAnalysis.validComments.length)} of {commentAnalysis.validComments.length})
                  </span>
                  <ul className="space-y-1 list-disc list-inside text-[var(--text-secondary)] font-mono text-[11px]">
                    {commentAnalysis.validComments.slice(0, 10).map((cmt, idx) => (
                      <li key={idx} className="truncate">
                        &quot;{cmt}&quot;
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Hint Mode Editor */}
          {commentMode === 'hint' && (
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[var(--text-primary)]">
                  Comment Guidance / Hint
                </label>
                <Textarea
                  rows={3}
                  placeholder="e.g. Write a positive 5-star review mentioning the fast withdrawal speed, smooth graphics, and friendly customer support."
                  value={hintText}
                  onChange={(e) => setHintText(e.target.value)}
                  disabled={isLockedByEnrollments}
                />
              </div>

              <div className="max-w-xs">
                <Input
                  label="Manual Total Slots"
                  type="number"
                  min={1}
                  step={1}
                  value={manualSlots}
                  onChange={(e) => setManualSlots(Number(e.target.value))}
                  disabled={isLockedByEnrollments}
                  leftIcon={isLockedByEnrollments ? <Lock className="w-4 h-4 text-amber-500" /> : undefined}
                  required
                />
              </div>
            </div>
          )}
        </div>

        {/* Section 4: Detailed Instructions */}
        <div className="p-6 rounded-[var(--radius-xl)] bg-[var(--surface)] border border-[var(--border)] shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[var(--border)]">
            <FileText className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold font-heading text-[var(--text-primary)]">
              Detailed Offer Instructions & Description
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                Short Description (Card Subtitle)
              </label>
              <Input
                placeholder="e.g. Download and review our partner app to earn instant cash reward"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1">
                Step-by-Step Task Instructions
              </label>
              <Textarea
                rows={6}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="List clear numbered instructions for the user..."
              />
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {formError && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-[var(--radius-lg)] flex items-center gap-3 text-xs text-rose-500 font-medium">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/tasks')}
            disabled={isSubmitting}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            leftIcon={
              isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )
            }
          >
            {isSubmitting
              ? isEditMode
                ? 'Updating Task...'
                : 'Creating Task...'
              : isEditMode
              ? 'Save Task Changes'
              : 'Publish Task Offer'}
          </Button>
        </div>
      </form>

      {/* Live Preview Sidebar (5 cols) */}
      <div className="lg:col-span-5">
        <LiveTaskPreview formData={previewData} />
      </div>
    </div>
  );
}
