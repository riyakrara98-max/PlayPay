'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  Coins,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  HelpCircle,
  CheckCheck,
} from 'lucide-react';
import { where, doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { PageContainer } from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/layout/SectionHeader';
import { EmptyState } from '@/components/ui/empty-state';
import { useAuthContext } from '@/contexts/AuthContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useRealtimeCollection } from '@/hooks/useRealtimeCollection';
import { getFirebaseDb } from '@/firebase/config';
import { EnrollmentDocument, FIRESTORE_COLLECTIONS } from '@/types/firestore';
import { PaymentCard } from '@/components/payment/PaymentCard';
import { WhatsAppConfirmationModal } from '@/components/payment/WhatsAppConfirmationModal';
import { TaskGridSkeleton } from '@/components/tasks/TaskCardSkeleton';
import { logFirestoreError, OperationType } from '@/lib/firebase-errors';
import { AdSlot } from '@/components/ads/AdSlot';

export default function PaymentPage() {
  const { currentUser, loading: authLoading } = useAuthContext();
  const { settings, loading: settingsLoading } = useSiteSettings();

  const [selectedEnrollment, setSelectedEnrollment] = useState<EnrollmentDocument | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(
    null
  );

  const userId = currentUser?.uid;

  // Realtime subscription for ONLY approved enrollments
  const queryConstraints = useMemo(() => {
    if (!userId) return [];
    return [where('userId', '==', userId), where('status', '==', 'approved')];
  }, [userId]);

  const {
    data: approvedEnrollments,
    loading: enrollmentsLoading,
  } = useRealtimeCollection<EnrollmentDocument>(
    FIRESTORE_COLLECTIONS.ENROLLMENTS,
    queryConstraints
  );

  const isLoading = authLoading || settingsLoading || enrollmentsLoading;

  const paymentEligibilityDays = settings?.paymentEligibilityDays ?? 7;
  const adminWhatsAppNumber = settings?.adminWhatsAppNumber || '919876543210';

  // Metrics calculation
  const metrics = useMemo(() => {
    if (!approvedEnrollments) return { totalApproved: 0, totalAmount: 0, paidAmount: 0, requestedAmount: 0 };

    let totalAmount = 0;
    let paidAmount = 0;
    let requestedAmount = 0;

    approvedEnrollments.forEach((e) => {
      const reward = e.rewardAmount || e.reward || 0;
      totalAmount += reward;

      if (e.paymentStatus === 'paid') {
        paidAmount += reward;
      } else if (e.paymentStatus === 'requested' || e.paymentStatus === 'processing') {
        requestedAmount += reward;
      }
    });

    return {
      totalApproved: approvedEnrollments.length,
      totalAmount,
      paidAmount,
      requestedAmount,
    };
  }, [approvedEnrollments]);

  // Handle WhatsApp Link trigger
  const handleRequestWhatsApp = (enrollment: EnrollmentDocument, messageUrl: string) => {
    // Open WhatsApp in new tab
    if (typeof window !== 'undefined') {
      window.open(messageUrl, '_blank', 'noopener,noreferrer');
    }
    // Set active enrollment & open confirmation modal
    setSelectedEnrollment(enrollment);
    setIsModalOpen(true);
  };

  // Handle Modal Confirmation ("Yes, Message Sent")
  const handleConfirmSent = async () => {
    if (!selectedEnrollment || !userId) return;

    setIsSubmitting(true);
    try {
      const db = getFirebaseDb();
      const docRef = doc(db, FIRESTORE_COLLECTIONS.ENROLLMENTS, selectedEnrollment.id);

      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(docRef);
        if (!snap.exists()) {
          throw new Error('Enrollment document not found.');
        }

        const data = snap.data();
        if (data.paymentStatus === 'paid') {
          throw new Error('Payment for this task has already been completed.');
        }

        const currentCount = data.whatsAppRequestCount || 0;

        transaction.update(docRef, {
          paymentStatus: 'requested',
          paymentRequestedAt: serverTimestamp(),
          lastWhatsAppRequestAt: serverTimestamp(),
          whatsAppRequestCount: currentCount + 1,
          lastUpdatedAt: serverTimestamp(),
          lastUpdatedBy: userId,
        });
      });

      setToastMessage({
        text: 'Payment request recorded successfully! Admin will verify and process your payout.',
        type: 'success',
      });

      setIsModalOpen(false);
      setSelectedEnrollment(null);
    } catch (err) {
      logFirestoreError(
        err,
        OperationType.UPDATE,
        `${FIRESTORE_COLLECTIONS.ENROLLMENTS}/${selectedEnrollment.id}`
      );
      setToastMessage({
        text: err instanceof Error ? err.message : 'Failed to update payment status. Please try again.',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);

      // Auto-clear toast after 5s
      setTimeout(() => {
        setToastMessage(null);
      }, 5000);
    }
  };

  return (
    <PageContainer size="xl">
      <SectionHeader
        title="Payment Request"
        subtitle="Request direct payout for your approved tasks via WhatsApp. Verified payouts are processed manually by Admin."
      />

      <AdSlot placement="payment" />

      {/* Global Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`mb-6 p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between gap-3 shadow-md ${
              toastMessage.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
            }`}
          >
            <div className="flex items-center gap-2">
              {toastMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              )}
              <span>{toastMessage.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-xs hover:opacity-75 font-bold"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Notice Banner */}
      <div className="mb-6 p-4 rounded-2xl bg-[var(--surface-elevated)] border border-[var(--border)] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-0.5 text-xs">
            <h3 className="font-bold text-[var(--text-primary)]">
              Manual WhatsApp Payout Workflow
            </h3>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              PlayPay processes payments manually via WhatsApp. Once your task is approved and reaches the <span className="font-semibold text-[var(--primary)]">{paymentEligibilityDays}-day eligibility window</span>, click &quot;Request Payment via WhatsApp&quot; to notify Admin.
            </p>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2 self-start md:self-auto bg-[var(--surface)] px-3 py-1.5 rounded-xl border border-[var(--border)] text-[11px] font-mono text-[var(--text-muted)]">
          <HelpCircle className="w-3.5 h-3.5 text-[var(--primary)]" />
          <span>Eligibility Rule: {paymentEligibilityDays} Days</span>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="h-24 bg-[var(--surface)] border border-[var(--border)] rounded-2xl animate-pulse" />
          <TaskGridSkeleton count={4} />
        </div>
      ) : !currentUser ? (
        <EmptyState
          icon={<CreditCard className="w-8 h-8 text-[var(--warning)]" />}
          title="Sign In Required"
          description="Please sign in to view your approved earnings and request payouts."
          primaryAction={
            <Link
              href="/login"
              className="px-5 py-2.5 bg-[var(--primary)] text-[var(--primary-fg)] font-semibold text-xs rounded-xl shadow-xs hover:opacity-90 transition-opacity inline-flex items-center gap-2"
            >
              Sign In Now <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
        />
      ) : approvedEnrollments.length === 0 ? (
        <div className="py-12 px-4 bg-[var(--surface)] border border-[var(--border)] rounded-3xl text-center flex flex-col items-center justify-center max-w-xl mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center mb-4">
            <Coins className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
            No Approved Tasks for Payment Yet
          </h3>
          <p className="text-sm text-[var(--text-secondary)] max-w-md mb-6 leading-relaxed">
            Payment requests are enabled for approved task completions. Complete tasks from your dashboard or submit proof for your enrolled tasks.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="px-5 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-fg)] font-semibold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              Explore Available Tasks <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/my-tasks"
              className="px-5 py-2.5 bg-[var(--surface-elevated)] border border-[var(--border)] hover:bg-[var(--surface)] text-[var(--text-primary)] font-semibold text-xs rounded-xl transition-all"
            >
              Check My Tasks Status
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Earnings Overview Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xs">
              <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">
                Total Approved
              </span>
              <span className="text-lg font-bold text-[var(--text-primary)] mt-1 block">
                {metrics.totalApproved} {metrics.totalApproved === 1 ? 'Task' : 'Tasks'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xs">
              <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">
                Total Approved Earnings
              </span>
              <span className="text-lg font-extrabold text-[var(--primary)] font-mono mt-1 block">
                ₹{metrics.totalAmount}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xs">
              <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">
                Requested / Processing
              </span>
              <span className="text-lg font-bold text-amber-600 dark:text-amber-400 font-mono mt-1 block">
                ₹{metrics.requestedAmount}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xs">
              <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider block">
                Total Paid
              </span>
              <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-1 block">
                ₹{metrics.paidAmount}
              </span>
            </div>
          </div>

          {/* Payment Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {approvedEnrollments.map((enrollment) => (
              <PaymentCard
                key={enrollment.id}
                enrollment={enrollment}
                paymentEligibilityDays={paymentEligibilityDays}
                adminWhatsAppNumber={adminWhatsAppNumber}
                onRequestWhatsApp={handleRequestWhatsApp}
                userName={currentUser.displayName}
                userEmail={currentUser.email}
                userId={currentUser.uid}
              />
            ))}
          </div>
        </div>
      )}

      {/* WhatsApp Confirmation Dialog Modal */}
      <WhatsAppConfirmationModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEnrollment(null);
        }}
        onConfirm={handleConfirmSent}
        isSubmitting={isSubmitting}
        enrollment={selectedEnrollment}
        adminWhatsAppNumber={adminWhatsAppNumber}
      />
    </PageContainer>
  );
}
