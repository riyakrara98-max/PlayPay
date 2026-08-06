'use client';

import React, { useState, useEffect } from 'react';
import { IndianRupee, RotateCcw, AlertCircle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserDocument } from '@/types/firestore';

interface EditMemberRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: UserDocument | null;
  onSaveReward: (memberId: string, reward: number | null) => Promise<void>;
}

interface ConfirmationStepData {
  newReward: number | null;
  newRewardDisplay: string;
  currentRewardDisplay: string;
}

export function EditMemberRewardModal({
  isOpen,
  onClose,
  member,
  onSaveReward,
}: EditMemberRewardModalProps) {
  const [rewardInput, setRewardInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmationData, setConfirmationData] = useState<ConfirmationStepData | null>(null);

  useEffect(() => {
    if (isOpen && member) {
      if (member.effectiveReward !== undefined && member.effectiveReward !== null) {
        setRewardInput(String(member.effectiveReward));
      } else {
        setRewardInput('');
      }
      setErrorMsg(null);
      setConfirmationData(null);
    }
  }, [isOpen, member]);

  if (!isOpen || !member) return null;

  const currentRewardDisplay =
    member.effectiveReward !== undefined && member.effectiveReward !== null
      ? `₹${member.effectiveReward}`
      : 'Task Default';

  const validateReward = (val: string): { isValid: boolean; numValue?: number; error?: string } => {
    const trimmed = val.trim();
    if (!trimmed) {
      return { isValid: false, error: 'Please enter a reward amount or click "Reset to Task Default".' };
    }

    // Check if non-digit characters exist (letters, symbols, decimals)
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

  // Step 1: Prompt for confirmation when Save is clicked
  const handleInitiateSave = () => {
    setErrorMsg(null);
    const { isValid, numValue, error } = validateReward(rewardInput);

    if (!isValid || numValue === undefined) {
      setErrorMsg(error || 'Invalid reward input.');
      return;
    }

    setConfirmationData({
      newReward: numValue,
      newRewardDisplay: `₹${numValue}`,
      currentRewardDisplay,
    });
  };

  // Step 1: Prompt for confirmation when Reset is clicked
  const handleInitiateReset = () => {
    setErrorMsg(null);
    setConfirmationData({
      newReward: null,
      newRewardDisplay: 'Task Default',
      currentRewardDisplay,
    });
  };

  // Step 2: Final confirm call to update Firestore
  const handleConfirmSave = async () => {
    if (!confirmationData) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onSaveReward(member.uid, confirmationData.newReward);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update member reward.';
      setErrorMsg(msg);
      setConfirmationData(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="p-6 space-y-5">
        {confirmationData ? (
          /* Confirmation Step Dialog */
          <div className="space-y-5">
            <div className="flex items-start gap-3 border-b border-[var(--border)] pb-4">
              <CheckCircle2 className="w-6 h-6 text-[var(--primary)] shrink-0 mt-0.5" />
              <div>
                <h2 className="text-xl font-bold text-[var(--text-primary)]">
                  Confirm Reward Change
                </h2>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Please confirm the new task reward for this member.
                </p>
              </div>
            </div>

            {/* Comparison Box */}
            <div className="p-4 rounded-xl bg-[var(--bg-muted)] border border-[var(--border)] space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--text-secondary)] font-semibold uppercase text-[10px]">
                  Member Name
                </span>
                <span className="font-bold text-[var(--text-primary)]">
                  {member.displayName || member.email}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-[var(--border)]/60">
                <span className="text-[var(--text-secondary)] font-semibold uppercase text-[10px]">
                  Current Reward
                </span>
                <span className="font-mono font-bold text-slate-500 dark:text-slate-400">
                  {confirmationData.currentRewardDisplay}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-[var(--border)]/60">
                <span className="text-[var(--text-secondary)] font-semibold uppercase text-[10px]">
                  New Reward
                </span>
                <span className="font-mono font-bold text-[var(--primary)] text-sm">
                  {confirmationData.newRewardDisplay}
                </span>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[var(--border)]">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setConfirmationData(null)}
                disabled={isSubmitting}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleConfirmSave}
                disabled={isSubmitting}
                className="text-xs"
              >
                {isSubmitting ? 'Updating...' : 'Confirm'}
              </Button>
            </div>
          </div>
        ) : (
          /* Form Input Screen */
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-[var(--border)] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <IndianRupee className="w-5 h-5 text-[var(--primary)] shrink-0" />
                  <h2 className="text-xl font-bold text-[var(--text-primary)]">
                    Edit Member Reward
                  </h2>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Member:{' '}
                  <span className="font-bold text-[var(--text-primary)]">
                    {member.displayName || member.email}
                  </span>
                </p>
              </div>
            </div>

            {/* Current State Info */}
            <div className="p-3.5 rounded-xl bg-[var(--bg-muted)] border border-[var(--border)] flex items-center justify-between text-xs">
              <span className="text-[var(--text-secondary)] font-medium">
                Current Reward Status:
              </span>
              <span className="font-bold font-mono text-[var(--primary)] px-2 py-1 rounded bg-[var(--card)] border border-[var(--border)]">
                {currentRewardDisplay}
              </span>
            </div>

            {/* Error Alert */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Form Input */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[var(--text-primary)]">
                Custom Reward Amount (₹)
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
                Enter a whole number between <strong>0</strong> and <strong>1000</strong>. Leave blank or click &apos;Reset to Task Default&apos; to use original task rewards.
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-4 border-t border-[var(--border)]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleInitiateReset}
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
                  onClick={handleInitiateSave}
                  disabled={isSubmitting}
                  className="text-xs"
                >
                  Save Reward
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
