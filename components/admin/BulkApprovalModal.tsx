'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { EnrollmentDocument } from '@/types/firestore';

interface BulkApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSubmissions: EnrollmentDocument[];
  onConfirmBulkApprove: (
    ids: string[],
    onProgress: (current: number, total: number) => void
  ) => Promise<void>;
}

export function BulkApprovalModal({
  isOpen,
  onClose,
  selectedSubmissions,
  onConfirmBulkApprove,
}: BulkApprovalModalProps) {
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<{ current: number; total: number }>({
    current: 0,
    total: 0,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      queueMicrotask(() => {
        setIsProcessing(false);
        setProgress({ current: 0, total: selectedSubmissions.length });
        setError(null);
      });
    }
  }, [isOpen, selectedSubmissions.length]);

  const totalRewards = selectedSubmissions.reduce(
    (sum, item) => sum + Number(item.reward || item.rewardAmount || 0),
    0
  );

  const handleStartBulk = async () => {
    setIsProcessing(true);
    setError(null);
    setProgress({ current: 0, total: selectedSubmissions.length });

    const ids = selectedSubmissions.map((s) => s.id);

    try {
      await onConfirmBulkApprove(ids, (current, total) => {
        setProgress({ current, total });
      });
      onClose();
    } catch (err) {
      console.error('[BulkApprovalModal error]', err);
      setError(err instanceof Error ? err.message : 'Bulk approval encountered an error.');
    } finally {
      setIsProcessing(false);
    }
  };

  const percentage = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={isProcessing ? () => {} : onClose}
      title={
        <div className="flex items-center gap-2 text-emerald-500">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>Bulk Approve Submissions ({selectedSubmissions.length})</span>
        </div>
      }
      description="Executes atomic transactions to verify proof images and lock rewards for selected items."
      size="md"
      closeOnOverlayClick={!isProcessing}
    >
      <div className="space-y-4">
        {/* Summary Card */}
        <div className="p-4 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-[var(--radius-lg)] space-y-2 text-xs">
          <div className="flex justify-between items-center text-[var(--text-primary)]">
            <span className="font-semibold">Selected Submissions Count:</span>
            <span className="text-base font-bold text-[var(--text-primary)]">{selectedSubmissions.length} Items</span>
          </div>
          <div className="flex justify-between items-center text-[var(--text-primary)]">
            <span className="font-semibold">Total Reward Value:</span>
            <span className="text-base font-bold text-emerald-500">₹{totalRewards.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Selected Items Scroll List Preview */}
        <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-md)] text-xs">
          {selectedSubmissions.map((sub) => (
            <div
              key={sub.id}
              className="flex items-center justify-between p-2 rounded bg-[var(--surface-elevated)]"
            >
              <div className="truncate pr-2">
                <span className="font-medium text-[var(--text-primary)]">{sub.userName}</span>
                <span className="text-[var(--text-muted)] text-[11px] block truncate">
                  {sub.appName} — {sub.taskTitle}
                </span>
              </div>
              <span className="font-bold text-emerald-500 shrink-0">₹{sub.reward}</span>
            </div>
          ))}
        </div>

        {/* Progress Bar during Bulk Approval */}
        {isProcessing && (
          <div className="space-y-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-[var(--radius-md)]">
            <div className="flex justify-between text-xs font-semibold text-emerald-500">
              <span>Approving items in atomic transactions...</span>
              <span>
                {progress.current} / {progress.total} ({percentage}%)
              </span>
            </div>
            <Progress value={percentage} variant="success" size="sm" />
          </div>
        )}

        {error && (
          <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-[var(--radius-md)] text-xs text-rose-500 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            isLoading={isProcessing}
            onClick={handleStartBulk}
            leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {isProcessing ? 'Approving...' : `Confirm Bulk Approve (${selectedSubmissions.length})`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
