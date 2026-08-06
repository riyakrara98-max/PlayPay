'use client';

import React, { useState } from 'react';
import { UserX, AlertTriangle, Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface BulkBanModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedUserIds: string[];
  onConfirmBulkBan: (targetUserIds: string[], reason: string) => Promise<void>;
}

export function BulkBanModal({
  isOpen,
  onClose,
  selectedUserIds,
  onConfirmBulkBan,
}: BulkBanModalProps) {
  const { toast } = useToast();
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('A ban reason is required for administrative audit logging.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onConfirmBulkBan(selectedUserIds, reason.trim());
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to ban selected users.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Bulk Ban User Accounts"
      description={`Restricting access for ${selectedUserIds.length} selected user(s).`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Batch Restriction Notice</p>
            <p className="text-[11px] opacity-90 mt-0.5">
              Banning these {selectedUserIds.length} accounts will terminate active sessions, block task enrollments, and hold pending payout requests.
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[var(--text-primary)] flex items-center justify-between">
            <span>Mandatory Ban Reason</span>
            <span className="text-[10px] text-rose-500 font-bold">* Required</span>
          </label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Coordinated fraudulent task submissions / Sybil accounts"
            className="w-full text-xs"
            disabled={isSubmitting}
            autoFocus
          />
        </div>

        {error && (
          <p className="text-xs text-rose-500 font-medium bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-lg border border-rose-200 dark:border-rose-800">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
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
            type="submit"
            variant="danger"
            size="sm"
            disabled={isSubmitting || !reason.trim()}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Banning...
              </>
            ) : (
              <>
                <UserX className="w-3.5 h-3.5 mr-1.5" /> Ban {selectedUserIds.length} Accounts
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
