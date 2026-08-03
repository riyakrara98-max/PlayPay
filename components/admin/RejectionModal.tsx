'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { EnrollmentDocument } from '@/types/firestore';

interface RejectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: EnrollmentDocument | null;
  onConfirmReject: (reason: string) => Promise<void>;
}

export function RejectionModal({
  isOpen,
  onClose,
  submission,
  onConfirmReject,
}: RejectionModalProps) {
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      queueMicrotask(() => {
        setReason('');
        setError(null);
        setIsSubmitting(false);
      });
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Rejection reason is required.');
      return;
    }
    if (reason.trim().length < 10) {
      setError('Rejection reason must be at least 10 characters long so user understands what to fix.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onConfirmReject(reason.trim());
      onClose();
    } catch (err) {
      console.error('[RejectionModal error]', err);
      setError(err instanceof Error ? err.message : 'Failed to reject submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!submission) return null;

  const charCount = reason.trim().length;
  const isValid = charCount >= 10;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-rose-500">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>Reject Task Submission</span>
        </div>
      }
      description={`Provide mandatory rejection feedback for ${submission.userName || 'User'}'s submission on "${submission.taskTitle}".`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Submission Context summary card */}
        <div className="p-3 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-[var(--radius-md)] text-xs space-y-1">
          <div className="flex justify-between text-[var(--text-secondary)]">
            <span>App: <strong className="text-[var(--text-primary)]">{submission.appName}</strong></span>
            <span>Reward: <strong className="text-emerald-500 font-semibold">₹{submission.reward}</strong></span>
          </div>
          <div className="text-[var(--text-secondary)]">
            User Email: <span className="text-[var(--text-primary)] font-mono">{submission.userEmail || submission.userId}</span>
          </div>
        </div>

        {/* Textarea for rejection reason */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">
            Rejection Feedback Reason <span className="text-rose-500">*</span>
          </label>
          <Textarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError(null);
            }}
            placeholder="e.g. Screenshot does not clearly show app installed or review comment is missing..."
            rows={4}
            className="w-full text-xs font-sans"
            disabled={isSubmitting}
            autoFocus
          />
          <div className="flex items-center justify-between mt-1 text-[11px]">
            <span className={isValid ? 'text-emerald-500 font-medium' : 'text-[var(--text-muted)]'}>
              {charCount}/10 chars minimum
            </span>
            <span className="text-[var(--text-muted)]">User can resubmit after fixing.</span>
          </div>
        </div>

        {error && (
          <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-[var(--radius-md)] text-xs text-rose-500">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
            disabled={!isValid || isSubmitting}
            className="bg-rose-600 hover:bg-rose-700 text-white"
          >
            Confirm Rejection
          </Button>
        </div>
      </form>
    </Modal>
  );
}
