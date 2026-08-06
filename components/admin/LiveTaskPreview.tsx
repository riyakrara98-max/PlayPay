'use client';

import React from 'react';
import {
  ShieldCheck,
  Clock,
  Smartphone,
  Users,
  Coins,
  ArrowRight,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { TaskCategory, CommentMode, TaskStatus } from '@/types/firestore';
import { Badge } from '@/components/ui/badge';
import { parseDateInput } from '@/utils/formatters';

export interface TaskFormData {
  title: string;
  appName: string;
  playStoreUrl: string;
  rewardAmount: number;
  category: TaskCategory;
  description: string;
  instructions: string;
  appIcon: string;
  commentMode: CommentMode;
  commentsText: string;
  parsedComments: string[];
  hintText: string;
  manualSlots: number;
  expiresAt: string;
  status: TaskStatus;
}

interface LiveTaskPreviewProps {
  formData: TaskFormData;
}

export function LiveTaskPreview({ formData }: LiveTaskPreviewProps) {
  const totalSlots =
    formData.commentMode === 'fixed'
      ? formData.parsedComments.length
      : formData.manualSlots || 1;

  const displayTitle = formData.title.trim() || 'Sample Task Title';
  const displayAppName = formData.appName.trim() || 'PlayPay Partner App';

  // Expiry calculation string
  let expiryDisplay = 'No Expiry';
  if (formData.expiresAt) {
    try {
      const expDate = (parseDateInput(formData.expiresAt) || new Date());
      if (!isNaN(expDate.getTime())) {
        expiryDisplay = expDate.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        });
      }
    } catch {
      // fallback
    }
  }

  return (
    <div className="space-y-4 sticky top-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <h3 className="text-xs font-bold font-heading uppercase tracking-wider text-[var(--text-secondary)]">
            Live Task Card Preview
          </h3>
        </div>
        <Badge variant="outline" size="sm" className="text-[10px] font-mono">
          Realtime Render
        </Badge>
      </div>

      {/* Actual User Task Card Representation */}
      <article className="group relative flex flex-col justify-between bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 shadow-md">
        <div>
          {/* Top Header Row: App Icon + App Name + Status Badge */}
          <div className="flex items-start justify-between gap-3 mb-3.5">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative w-11 h-11 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                {formData.appIcon ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={formData.appIcon}
                    alt={displayAppName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Smartphone className="w-5 h-5 text-[var(--primary)]" />
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-[var(--text-secondary)] truncate">
                    {displayAppName}
                  </span>
                  <span
                    title="Verified Task"
                    className="inline-flex items-center text-[var(--primary)] shrink-0"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 fill-[var(--primary)]/10" />
                  </span>
                </div>
                <h4 className="text-base font-bold text-[var(--text-primary)] leading-snug truncate">
                  {displayTitle}
                </h4>
              </div>
            </div>

            {/* Status Badge */}
            <div>
              {formData.status === 'active' ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0">
                  <CheckCircle2 className="w-3 h-3" />
                  Available
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 shrink-0 uppercase">
                  {formData.status}
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          {formData.description && (
            <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mb-4 leading-relaxed">
              {formData.description}
            </p>
          )}

          {/* Assigned Comment Preview if Fixed Mode */}
          {formData.commentMode === 'fixed' && formData.parsedComments.length > 0 && (
            <div className="mb-4 p-2.5 rounded-xl bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-xs text-[var(--text-primary)] flex items-start gap-2">
              <MessageSquare className="w-3.5 h-3.5 text-[var(--primary)] shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="font-semibold text-[var(--primary)] block text-[10px] uppercase tracking-wider">
                  Example Assigned Comment
                </span>
                <p className="truncate italic text-[11px]">
                  &quot;{formData.parsedComments[0]}&quot;
                </p>
              </div>
            </div>
          )}

          {/* Hint Preview if Hint Mode */}
          {formData.commentMode === 'hint' && formData.hintText && (
            <div className="mb-4 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-[var(--text-primary)] flex items-start gap-2">
              <FileText className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <span className="font-semibold text-amber-500 block text-[10px] uppercase tracking-wider">
                  Comment Guidance / Hint
                </span>
                <p className="line-clamp-2 italic text-[11px] text-[var(--text-secondary)]">
                  {formData.hintText}
                </p>
              </div>
            </div>
          )}

          {/* Reward & Expiry Section */}
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
                  ₹{formData.rewardAmount || 0}
                </span>
              </div>
            </div>

            {formData.expiresAt && (
              <div className="text-right">
                <span className="text-[10px] uppercase font-semibold text-[var(--text-muted)] tracking-wider block">
                  Expires On
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-500 font-mono">
                  <Clock className="w-3 h-3" />
                  {expiryDisplay}
                </span>
              </div>
            )}
          </div>

          {/* Progress Bar & Slots */}
          <div className="space-y-1.5 mb-5">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-[var(--text-secondary)] flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                0 / {totalSlots} enrolled
              </span>
              <span className="font-semibold font-mono text-emerald-500">
                {totalSlots} left
              </span>
            </div>

            <div className="w-full h-2 rounded-full bg-[var(--surface-elevated)] overflow-hidden relative border border-[var(--border)]/50">
              <div className="h-full rounded-full bg-emerald-500 w-0" />
            </div>
          </div>
        </div>

        {/* Enroll Action Button Preview */}
        <div className="w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-[var(--primary)] text-[var(--primary-fg)] shadow-sm">
          <span>Enroll Now</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      </article>

      {/* Summary Box */}
      <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--surface-elevated)]/50 border border-[var(--border)] space-y-2 text-xs">
        <div className="flex justify-between items-center text-[var(--text-secondary)]">
          <span>Target Category:</span>
          <span className="font-semibold text-[var(--text-primary)] capitalize">
            {formData.category.replace('_', ' ')}
          </span>
        </div>
        <div className="flex justify-between items-center text-[var(--text-secondary)]">
          <span>Comment Strategy:</span>
          <span className="font-semibold text-amber-500 uppercase">
            {formData.commentMode} Mode
          </span>
        </div>
        <div className="flex justify-between items-center text-[var(--text-secondary)]">
          <span>Total Slot Count:</span>
          <span className="font-bold text-[var(--primary)] font-mono">
            {totalSlots} Slots
          </span>
        </div>
      </div>
    </div>
  );
}
