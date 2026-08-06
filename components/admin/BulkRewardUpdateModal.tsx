'use client';

import React, { useState, useEffect } from 'react';
import { IndianRupee, RotateCcw, AlertCircle, CheckCircle2, Layers } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserDocument } from '@/types/firestore';

interface BulkRewardUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMembers: UserDocument[];
  onApplyBulkReward: (
    memberIds: string[],
    reward: number | null,
    onProgress: (completed: number, total: number) => void
  ) => Promise<{ updated: number; failed: number }>;
}

export function BulkRewardUpdateModal({
  isOpen,
  onClose,
  selectedMembers,
  onApplyBulkReward,
}: BulkRewardUpdateModalProps) {
  const [rewardInput, setRewardInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState<{ completed: number; total: number } | null>(null);
  const [resultSummary, setResultSummary] = useState<{ updated: number; failed: number } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setRewardInput('');
      setErrorMsg(null);
      setIsSubmitting(false);
      setProgress(null);
      setResultSummary(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const validateReward = (val: string): { isValid: boolean; numValue?: number; error?: string } => {
    const trimmed = val.trim();
    if (!trimmed) {
      return { isValid: false, error: 'Please enter a reward amount or click "Reset to Task Default".' };
    }

    if (!/^\d+$/.test(trimmed)) {
      if (trimmed.includes('.')) {
        return { isValid: false, error: 'Reward must be a whole number (decimals are not allowed).' };
      }
      if (trimmed.startsWith('-')) {
        return { isValid: false, error: 'Reward amount cannot be negative.' };
      }
      return { isValid: false, error: 'Please enter a valid whole number with digits only.' };
    }

    const num = parseInt(trimmed, 10);
    if (isNaN(num)) {
      return { isValid: false, error: 'Please enter a valid numeric value.' };
    }

    if (num < 0) {
      return { isValid: false, error: 'Minimum reward amount is ₹0.' };
    }

    if (num > 1000) {
      return { isValid: false, error: 'Maximum allowed reward is ₹1000 per task.' };
    }

    return { isValid: true, numValue: num };
  };

  const executeBulkUpdate = async (targetReward: number | null) => {
    setErrorMsg(null);
    setIsSubmitting(true);
    const total = selectedMembers.length;
    setProgress({ completed: 0, total });

    const memberIds = selectedMembers.map((m) => m.uid);

    try {
      const res = await onApplyBulkReward(memberIds, targetReward, (completed, totalCount) => {
        setProgress({ completed, total: totalCount });
      });

      setResultSummary(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Bulk update failed.';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApply = () => {
    const { isValid, numValue, error } = validateReward(rewardInput);
    if (!isValid || numValue === undefined) {
      setErrorMsg(error || 'Invalid reward input.');
      return;
    }
    executeBulkUpdate(numValue);
  };

  const handleResetToDefault = () => {
    executeBulkUpdate(null);
  };

  return (
    <Modal isOpen={isOpen} onClose={isSubmitting ? () => {} : onClose} size="md">
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--border)] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-[var(--primary)] shrink-0" />
              <h2 className="text-xl font-bold text-[var(--text-primary)]">
                Bulk Reward Update
              </h2>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Apply reward changes to multiple team members at once.
            </p>
          </div>
        </div>

        {/* Selected Members Count Badge */}
        <div className="p-3.5 rounded-xl bg-[var(--bg-muted)] border border-[var(--border)] flex items-center justify-between text-xs">
          <span className="text-[var(--text-secondary)] font-medium">
            Selected Team Members:
          </span>
          <span className="font-bold text-[var(--primary)] px-2.5 py-1 rounded bg-[var(--card)] border border-[var(--border)]">
            {selectedMembers.length} Members Selected
          </span>
        </div>

        {/* Result Summary View */}
        {resultSummary ? (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 space-y-3">
            <div className="flex items-center gap-2 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Reward updated successfully.</span>
            </div>
            <div className="text-xs space-y-1 font-mono text-[var(--text-primary)]">
              <p>Updated: <strong>{resultSummary.updated}</strong> member(s)</p>
              {resultSummary.failed > 0 && (
                <p className="text-rose-500">Failed: <strong>{resultSummary.failed}</strong> member(s)</p>
              )}
            </div>
            <div className="pt-3 border-t border-emerald-500/20 flex justify-end">
              <Button variant="primary" size="sm" onClick={onClose} className="text-xs">
                Done
              </Button>
            </div>
          </div>
        ) : isSubmitting && progress ? (
          /* Progress Indicator View */
          <div className="p-6 rounded-xl bg-[var(--bg-muted)] border border-[var(--border)] text-center space-y-3">
            <div className="w-8 h-8 border-3 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-[var(--text-primary)] font-mono">
              Updating {progress.completed} / {progress.total}...
            </p>
            <p className="text-[11px] text-[var(--text-secondary)]">
              Please wait while updating Firestore records...
            </p>
          </div>
        ) : (
          /* Input Form View */
          <div className="space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[var(--text-primary)]">
                New Custom Reward Amount (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[var(--text-secondary)]">
                  ₹
                </span>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="e.g. 5, 6, 7, 8, 10"
                  value={rewardInput}
                  onChange={(e) => {
                    setRewardInput(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  className="pl-7 font-mono text-sm"
                  disabled={isSubmitting}
                />
              </div>
              <p className="text-[11px] text-[var(--text-secondary)]">
                Whole numbers between <strong>0</strong> and <strong>1000</strong>. Or use &apos;Reset to Task Default&apos;.
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-4 border-t border-[var(--border)]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleResetToDefault}
                disabled={isSubmitting}
                className="text-xs text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Task Default</span>
              </Button>

              <div className="flex items-center gap-2 justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleApply}
                  disabled={isSubmitting}
                  className="text-xs"
                >
                  Apply
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
