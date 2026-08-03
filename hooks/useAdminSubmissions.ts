'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  collection,
  query,
  onSnapshot,
  doc,
  runTransaction,
  serverTimestamp,
  increment,
  getDoc,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { getFirebaseDb, isFirebaseConfigured } from '@/firebase/config';
import {
  EnrollmentDocument,
  EnrollmentStatus,
  PaymentStatus,
  FIRESTORE_COLLECTIONS,
} from '@/types/firestore';
import { useToast } from '@/hooks/use-toast';

export type SubmissionsTab =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'requested_payments'
  | 'processing_payments'
  | 'paid'
  | 'all';

export interface SubmissionFilters {
  searchQuery: string;
  status: 'all' | EnrollmentStatus;
  paymentStatus: 'all' | PaymentStatus;
  minReward: string;
  maxReward: string;
  startDate: string;
  endDate: string;
}

export function useAdminSubmissions(adminUid?: string) {
  const [submissions, setSubmissions] = useState<EnrollmentDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<SubmissionsTab>('pending');
  const [filters, setFilters] = useState<SubmissionFilters>({
    searchQuery: '',
    status: 'all',
    paymentStatus: 'all',
    minReward: '',
    maxReward: '',
    startDate: '',
    endDate: '',
  });

  // Realtime listener for enrollments collection
  useEffect(() => {
    if (!isFirebaseConfigured()) {
      queueMicrotask(() => {
        setLoading(false);
        setError('Firebase environment is not configured.');
      });
      return;
    }

    queueMicrotask(() => {
      setLoading(true);
      setError(null);
    });

    const db = getFirebaseDb();
    const colRef = collection(db, FIRESTORE_COLLECTIONS.ENROLLMENTS);
    const q = query(colRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: EnrollmentDocument[] = [];
        snapshot.forEach((docSnap: QueryDocumentSnapshot<DocumentData>) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            userId: data.userId || '',
            taskId: data.taskId || '',
            userName: data.userName || 'Anonymous User',
            userEmail: data.userEmail || '',
            userAvatar: data.userAvatar || '',
            appName: data.appName || 'Unknown App',
            appIcon: data.appIcon || '',
            taskTitle: data.taskTitle || 'Untitled Task',
            category: data.category || 'app_download',
            reward: Number(data.reward ?? data.rewardAmount ?? 0),
            rewardAmount: Number(data.rewardAmount ?? data.reward ?? 0),
            assignedComment: data.assignedComment || '',
            commentIndex: data.commentIndex ?? null,
            status: (data.status as EnrollmentStatus) || 'pending',
            enrolledAt: data.enrolledAt || new Date().toISOString(),
            submittedAt: data.submittedAt || null,
            reviewedAt: data.reviewedAt || null,
            reviewedBy: data.reviewedBy || '',
            approvedAt: data.approvedAt || null,
            rejectionReason: data.rejectionReason || '',
            screenshotUrl: data.screenshotUrl || data.proofUrl || '',
            userComment: data.userComment || data.proofNotes || '',
            proofUrl: data.proofUrl || '',
            proofNotes: data.proofNotes || '',
            paymentStatus: (data.paymentStatus as PaymentStatus) || 'pending',
            paymentRequestedAt: data.paymentRequestedAt || null,
            lastWhatsAppRequestAt: data.lastWhatsAppRequestAt || null,
            whatsAppRequestCount: data.whatsAppRequestCount || 0,
            cloudinaryMetadata: data.cloudinaryMetadata || null,
            submissionVersion: data.submissionVersion || 1,
            resubmissionCount: data.resubmissionCount || 0,
            lastUpdatedAt: data.lastUpdatedAt || null,
            lastUpdatedBy: data.lastUpdatedBy || '',
            canResubmit: Boolean(data.canResubmit),
            lockedReward: data.lockedReward,
            lockedTaskId: data.lockedTaskId,
            lockedAssignedComment: data.lockedAssignedComment,
            lockedCommentIndex: data.lockedCommentIndex,
            processedBy: data.processedBy || '',
            processingStartedAt: data.processingStartedAt || null,
            paymentProcessedAt: data.paymentProcessedAt || null,
            paymentReference: data.paymentReference || '',
          });
        });

        // Sort: Default tab "pending" sorts oldest submittedAt first.
        // For other tabs, sort newest submittedAt / enrolledAt first.
        list.sort((a, b) => {
          const timeA = new Date(a.submittedAt || a.enrolledAt).getTime();
          const timeB = new Date(b.submittedAt || b.enrolledAt).getTime();
          return timeA - timeB; // Oldest first
        });

        setSubmissions(list);
        setLoading(false);
      },
      (err) => {
        console.error('[useAdminSubmissions] Snapshot error:', err);
        const msg = err instanceof Error ? err.message : 'Error fetching submissions';
        setError(msg);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Filtered Submissions logic
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((item) => {
      // Tab Filtering
      if (activeTab === 'pending') {
        if (item.status !== 'pending') return false;
      } else if (activeTab === 'approved') {
        if (item.status !== 'approved') return false;
      } else if (activeTab === 'rejected') {
        if (item.status !== 'rejected') return false;
      } else if (activeTab === 'requested_payments') {
        if (item.paymentStatus !== 'requested') return false;
      } else if (activeTab === 'processing_payments') {
        if (item.paymentStatus !== 'processing') return false;
      } else if (activeTab === 'paid') {
        if (item.paymentStatus !== 'paid') return false;
      }

      // Status Filter
      if (filters.status !== 'all' && item.status !== filters.status) {
        return false;
      }

      // Payment Status Filter
      if (filters.paymentStatus !== 'all' && item.paymentStatus !== filters.paymentStatus) {
        return false;
      }

      // Search Query (User Name, Email, Task Title, App Name, User ID)
      if (filters.searchQuery.trim()) {
        const queryStr = filters.searchQuery.toLowerCase().trim();
        const matchesName = (item.userName || '').toLowerCase().includes(queryStr);
        const matchesEmail = (item.userEmail || '').toLowerCase().includes(queryStr);
        const matchesTask = (item.taskTitle || '').toLowerCase().includes(queryStr);
        const matchesApp = (item.appName || '').toLowerCase().includes(queryStr);
        const matchesUser = (item.userId || '').toLowerCase().includes(queryStr);
        if (!matchesName && !matchesEmail && !matchesTask && !matchesApp && !matchesUser) {
          return false;
        }
      }

      // Min/Max Reward Filter
      const rewardVal = Number(item.reward ?? item.rewardAmount ?? 0);
      if (filters.minReward && rewardVal < Number(filters.minReward)) return false;
      if (filters.maxReward && rewardVal > Number(filters.maxReward)) return false;

      // Date Range Filter
      if (filters.startDate) {
        const itemDate = new Date(item.submittedAt || item.enrolledAt);
        const startDate = new Date(filters.startDate);
        if (itemDate < startDate) return false;
      }
      if (filters.endDate) {
        const itemDate = new Date(item.submittedAt || item.enrolledAt);
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        if (itemDate > endDate) return false;
      }

      return true;
    });
  }, [submissions, activeTab, filters]);

  // Tab Badge Counters
  const tabCounts = useMemo(() => {
    return {
      pending: submissions.filter((s) => s.status === 'pending').length,
      approved: submissions.filter((s) => s.status === 'approved').length,
      rejected: submissions.filter((s) => s.status === 'rejected').length,
      requested_payments: submissions.filter((s) => s.paymentStatus === 'requested').length,
      processing_payments: submissions.filter((s) => s.paymentStatus === 'processing').length,
      paid: submissions.filter((s) => s.paymentStatus === 'paid').length,
      all: submissions.length,
    };
  }, [submissions]);

  // Approve single submission using Firestore Atomic Transaction
  const approveSubmission = useCallback(
    async (enrollmentId: string) => {
      if (!isFirebaseConfigured()) return;
      const db = getFirebaseDb();
      const reviewerId = adminUid || 'admin_user';

      try {
        await runTransaction(db, async (transaction) => {
          const enrollRef = doc(db, FIRESTORE_COLLECTIONS.ENROLLMENTS, enrollmentId);
          const enrollSnap = await transaction.get(enrollRef);

          if (!enrollSnap.exists()) {
            throw new Error('Enrollment document not found.');
          }

          const enrollData = enrollSnap.data();

          if (enrollData.status === 'approved') {
            throw new Error('This submission has already been approved.');
          }

          const rewardVal = Number(enrollData.reward ?? enrollData.rewardAmount ?? 0);
          const taskId = enrollData.taskId;
          const userId = enrollData.userId;
          const assignedComment = enrollData.assignedComment || '';
          const commentIndex = enrollData.commentIndex ?? null;

          // 1. Lock reward, taskId, assignedComment, commentIndex and mark approved
          transaction.update(enrollRef, {
            status: 'approved',
            approvedAt: serverTimestamp(),
            reviewedAt: serverTimestamp(),
            reviewedBy: reviewerId,
            lockedReward: rewardVal,
            lockedTaskId: taskId,
            lockedAssignedComment: assignedComment,
            lockedCommentIndex: commentIndex,
            lastUpdatedAt: serverTimestamp(),
            lastUpdatedBy: reviewerId,
          });

          // 2. Update user stats document
          if (userId) {
            const userRef = doc(db, FIRESTORE_COLLECTIONS.USERS, userId);
            const userSnap = await transaction.get(userRef);

            if (userSnap.exists()) {
              transaction.update(userRef, {
                totalTasksCompleted: increment(1),
                lastTaskCompletedAt: serverTimestamp(),
                weeklyStreak: increment(1),
              });
            }
          }
        });

        toast({
          variant: 'success',
          title: 'Submission Approved',
          message: `Task proof verified successfully. Reward locked.`,
        });
      } catch (err) {
        console.error('[approveSubmission error]', err);
        const msg = err instanceof Error ? err.message : 'Failed to approve submission.';
        toast({
          variant: 'error',
          title: 'Approval Failed',
          message: msg,
        });
        throw err;
      }
    },
    [adminUid, toast]
  );

  // Reject single submission using Firestore Atomic Transaction
  const rejectSubmission = useCallback(
    async (enrollmentId: string, reason: string) => {
      if (!isFirebaseConfigured()) return;
      if (!reason || reason.trim().length < 10) {
        throw new Error('Rejection reason must be at least 10 characters long.');
      }

      const db = getFirebaseDb();
      const reviewerId = adminUid || 'admin_user';

      try {
        await runTransaction(db, async (transaction) => {
          const enrollRef = doc(db, FIRESTORE_COLLECTIONS.ENROLLMENTS, enrollmentId);
          const enrollSnap = await transaction.get(enrollRef);

          if (!enrollSnap.exists()) {
            throw new Error('Enrollment document not found.');
          }

          transaction.update(enrollRef, {
            status: 'rejected',
            rejectionReason: reason.trim(),
            reviewedAt: serverTimestamp(),
            reviewedBy: reviewerId,
            canResubmit: true,
            lastUpdatedAt: serverTimestamp(),
            lastUpdatedBy: reviewerId,
          });
        });

        toast({
          variant: 'info',
          title: 'Submission Rejected',
          message: `Submission marked as rejected with mandatory feedback.`,
        });
      } catch (err) {
        console.error('[rejectSubmission error]', err);
        const msg = err instanceof Error ? err.message : 'Failed to reject submission.';
        toast({
          variant: 'error',
          title: 'Rejection Failed',
          message: msg,
        });
        throw err;
      }
    },
    [adminUid, toast]
  );

  // Bulk Approve Submissions
  const bulkApprove = useCallback(
    async (
      enrollmentIds: string[],
      onProgress?: (completed: number, total: number) => void
    ) => {
      if (!isFirebaseConfigured() || enrollmentIds.length === 0) return;

      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < enrollmentIds.length; i++) {
        const id = enrollmentIds[i];
        try {
          await approveSubmission(id);
          successCount++;
        } catch {
          failCount++;
        }
        if (onProgress) {
          onProgress(i + 1, enrollmentIds.length);
        }
      }

      if (successCount > 0) {
        toast({
          variant: 'success',
          title: 'Bulk Approval Finished',
          message: `Successfully approved ${successCount} submissions.${
            failCount > 0 ? ` (${failCount} failed)` : ''
          }`,
        });
      }
    },
    [approveSubmission, toast]
  );

  // Start Processing Payment
  const startProcessingPayment = useCallback(
    async (enrollmentId: string) => {
      if (!isFirebaseConfigured()) return;
      const db = getFirebaseDb();
      const reviewerId = adminUid || 'admin_user';

      try {
        await runTransaction(db, async (transaction) => {
          const enrollRef = doc(db, FIRESTORE_COLLECTIONS.ENROLLMENTS, enrollmentId);
          const enrollSnap = await transaction.get(enrollRef);

          if (!enrollSnap.exists()) {
            throw new Error('Enrollment not found.');
          }

          const data = enrollSnap.data();
          if (data.paymentStatus === 'paid') {
            throw new Error('Payment has already been marked as Paid and cannot be modified.');
          }

          transaction.update(enrollRef, {
            paymentStatus: 'processing',
            processingStartedAt: serverTimestamp(),
            processedBy: reviewerId,
            lastUpdatedAt: serverTimestamp(),
            lastUpdatedBy: reviewerId,
          });
        });

        toast({
          variant: 'info',
          title: 'Processing Started',
          message: 'Payment status updated to Processing.',
        });
      } catch (err) {
        console.error('[startProcessingPayment error]', err);
        const msg = err instanceof Error ? err.message : 'Failed to start payment processing.';
        toast({
          variant: 'error',
          title: 'Action Failed',
          message: msg,
        });
      }
    },
    [adminUid, toast]
  );

  // Mark Paid Payment
  const markPaidPayment = useCallback(
    async (enrollmentId: string, reference: string) => {
      if (!isFirebaseConfigured()) return;
      if (!reference || !reference.trim()) {
        throw new Error('Transaction reference number is required.');
      }

      const db = getFirebaseDb();
      const reviewerId = adminUid || 'admin_user';

      try {
        await runTransaction(db, async (transaction) => {
          const enrollRef = doc(db, FIRESTORE_COLLECTIONS.ENROLLMENTS, enrollmentId);
          const enrollSnap = await transaction.get(enrollRef);

          if (!enrollSnap.exists()) {
            throw new Error('Enrollment not found.');
          }

          const data = enrollSnap.data();
          if (data.paymentStatus === 'paid') {
            throw new Error('Payment is already marked as Paid.');
          }

          transaction.update(enrollRef, {
            paymentStatus: 'paid',
            paymentProcessedAt: serverTimestamp(),
            paymentReference: reference.trim(),
            processedBy: reviewerId,
            lastUpdatedAt: serverTimestamp(),
            lastUpdatedBy: reviewerId,
          });
        });

        toast({
          variant: 'success',
          title: 'Payment Complete',
          message: `Marked as PAID with Ref: ${reference.trim()}`,
        });
      } catch (err) {
        console.error('[markPaidPayment error]', err);
        const msg = err instanceof Error ? err.message : 'Failed to mark payment as paid.';
        toast({
          variant: 'error',
          title: 'Payment Mark Failed',
          message: msg,
        });
        throw err;
      }
    },
    [adminUid, toast]
  );

  return {
    submissions,
    filteredSubmissions,
    loading,
    error,
    activeTab,
    setActiveTab,
    filters,
    setFilters,
    tabCounts,
    approveSubmission,
    rejectSubmission,
    bulkApprove,
    startProcessingPayment,
    markPaidPayment,
  };
}
