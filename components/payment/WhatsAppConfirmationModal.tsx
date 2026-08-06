'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, CheckCircle2, XCircle, Loader2, Coins, ExternalLink } from 'lucide-react';
import { EnrollmentDocument } from '@/types/firestore';

interface WhatsAppConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isSubmitting: boolean;
  enrollment: EnrollmentDocument | null;
  adminWhatsAppNumber: string;
}

export function WhatsAppConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
  enrollment,
  adminWhatsAppNumber,
}: WhatsAppConfirmationModalProps) {
  if (!isOpen || !enrollment) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-3xl p-6 shadow-2xl overflow-hidden"
        >
          {/* Header Icon */}
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-4 mx-auto">
            <MessageSquare className="w-6 h-6" />
          </div>

          <h3 className="text-xl font-bold text-center text-[var(--text-primary)] mb-1">
            WhatsApp Confirmation
          </h3>
          <p className="text-xs text-center text-[var(--text-secondary)] mb-5">
            Have you successfully sent the payment request message on WhatsApp to Admin?
          </p>

          {/* Task Summary Card */}
          <div className="p-3.5 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] mb-6 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[var(--text-muted)]">App / Task</span>
              <span className="font-bold text-[var(--text-primary)] truncate max-w-[180px]">
                {enrollment.appName || enrollment.taskTitle}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-[var(--border)]/60 pt-2">
              <span className="font-semibold text-[var(--text-muted)]">Reward Amount</span>
              <span className="font-extrabold text-[var(--primary)] font-mono flex items-center gap-1">
                <Coins className="w-3.5 h-3.5" /> ₹
                {enrollment.rewardAmount || enrollment.reward || 0}
              </span>
            </div>
            {adminWhatsAppNumber && (
              <div className="flex items-center justify-between border-t border-[var(--border)]/60 pt-2">
                <span className="font-semibold text-[var(--text-muted)]">Admin Contact</span>
                <span className="font-mono text-[var(--text-secondary)]">
                  +{adminWhatsAppNumber.replace(/\D/g, '')}
                </span>
              </div>
            )}
          </div>

          <p className="text-[11px] text-[var(--text-muted)] text-center mb-6 leading-relaxed">
            Clicking <strong className="text-emerald-600 dark:text-emerald-400">&quot;Yes, Message Sent&quot;</strong> will mark your payment status as <span className="font-semibold text-amber-500">Requested</span> for Admin verification.
          </p>

          {/* Buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] hover:bg-[var(--surface)] text-[var(--text-secondary)] font-semibold text-xs transition-all flex items-center justify-center gap-1.5"
            >
              <XCircle className="w-4 h-4" />
              <span>No, Cancel</span>
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Yes, Message Sent</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
