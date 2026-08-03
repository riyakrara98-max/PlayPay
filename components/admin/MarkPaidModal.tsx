'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2 } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EnrollmentDocument } from '@/types/firestore';

interface MarkPaidModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: EnrollmentDocument | null;
  onConfirmMarkPaid: (reference: string) => Promise<void>;
}

export function MarkPaidModal({
  isOpen,
  onClose,
  submission,
  onConfirmMarkPaid,
}: MarkPaidModalProps) {
  const [reference, setReference] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      queueMicrotask(() => {
        setReference('');
        setError(null);
        setIsSubmitting(false);
      });
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reference.trim()) {
      setError('Transaction reference number (UTR / Bank Ref ID) is mandatory.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onConfirmMarkPaid(reference.trim());
      onClose();
    } catch (err) {
      console.error('[MarkPaidModal error]', err);
      setError(err instanceof Error ? err.message : 'Failed to mark payment as paid.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!submission) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-emerald-500">
          <CreditCard className="w-5 h-5 shrink-0" />
          <span>Mark Payout as Completed (Paid)</span>
        </div>
      }
      description={`Enter the bank or UPI transaction reference for ${submission.userName || 'User'}'s reward payout.`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Payout Summary Box */}
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-[var(--radius-md)] text-xs space-y-1.5">
          <div className="flex justify-between items-center text-[var(--text-primary)]">
            <span className="font-semibold">Payout Amount:</span>
            <span className="text-base font-bold text-emerald-500">₹{submission.reward || submission.rewardAmount}</span>
          </div>
          <div className="flex justify-between text-[var(--text-secondary)]">
            <span>User Name:</span>
            <span className="text-[var(--text-primary)] font-medium">{submission.userName}</span>
          </div>
          <div className="flex justify-between text-[var(--text-secondary)]">
            <span>Task App:</span>
            <span className="text-[var(--text-primary)] font-medium">{submission.appName}</span>
          </div>
        </div>

        {/* Input for Transaction Ref */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">
            Bank / UPI Transaction Reference (UTR / Payout ID) <span className="text-rose-500">*</span>
          </label>
          <Input
            value={reference}
            onChange={(e) => {
              setReference(e.target.value);
              if (error) setError(null);
            }}
            placeholder="e.g. UTR198273645012 or UPI/2938401923"
            className="w-full text-xs font-mono"
            disabled={isSubmitting}
            autoFocus
          />
          <p className="text-[11px] text-[var(--text-muted)] mt-1">
            This reference will be permanently attached to the enrollment audit log.
          </p>
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
            disabled={!reference.trim() || isSubmitting}
            leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            Confirm & Mark Paid
          </Button>
        </div>
      </form>
    </Modal>
  );
}
