'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  collection,
  query,
  onSnapshot,
  getDocs,
  startAfter,
  doc,
  runTransaction,
  serverTimestamp,
  increment,
  getDoc,
  orderBy,
  limit,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { getFirebaseDb } from '@/firebase/config';
import {
  EnrollmentDocument,
  EnrollmentStatus,
  PaymentStatus,
  TaskDocument,
  FIRESTORE_COLLECTIONS,
} from '@/types/firestore';
import { useToast } from '@/hooks/use-toast';
import { getSafeTime, parseDateInput } from '@/utils/formatters';

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

  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const PAGE_SIZE = 50;

  // Task Document Cache and In-Flight tracking for N+1 optimization
  const taskCacheRef = useRef<Map<string, TaskDocument>>(new Map());
  const missingTaskIdsInFlightRef = useRef<Set<string>>(new Set());
  const rawEnrollmentsRef = useRef<EnrollmentDocument[]>([]);
  const page1EnrollmentsRef = useRef<EnrollmentDocument[]>([]);
  const extraEnrollmentsRef = useRef<EnrollmentDocument[]>([]);
  const lastEnrollmentDocRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);

  // Function to merge raw enrollments with task cache and state
  const mergeAndSetSubmissions = useCallback((rawEnrollments: EnrollmentDocument[]) => {
    const list: EnrollmentDocument[] = rawEnrollments.map((item) => {
      const tid = item.taskId || item.lockedTaskId || '';
      const task = tid ? taskCacheRef.current.get(tid) : undefined;

      if (task) {
        const resolvedAppName =
          task.appName ||
          task.title ||
          (item.appName && item.appName !== 'Unknown App' ? item.appName : 'Unknown App');
        const resolvedAppIcon = task.appIcon || task.appIconUrl || item.appIcon || '';
        const resolvedTaskTitle =
          task.title ||
          (item.taskTitle && item.taskTitle !== 'Untitled Task' ? item.taskTitle : 'Untitled Task');
        const resolvedCategory = task.category || item.category || 'app_download';
        const resolvedReward =
          item.lockedReward ??
          item.reward ??
          item.rewardAmount ??
          task.rewardAmount ??
          0;
        const resolvedPackageName = task.packageName || (item as any).packageName || '';

        return {
          ...item,
          appName: resolvedAppName,
          appIcon: resolvedAppIcon,
          taskTitle: resolvedTaskTitle,
          category: resolvedCategory,
          reward: Number(resolvedReward),
          rewardAmount: Number(resolvedReward),
          packageName: resolvedPackageName,
        };
      }

      return item;
    });

    // Sort: Default tab "pending" sorts oldest submittedAt first.
    // For other tabs, sort newest submittedAt / enrolledAt first.
    list.sort((a, b) => {
      const timeA = getSafeTime(a.submittedAt || a.enrolledAt);
      const timeB = getSafeTime(b.submittedAt || b.enrolledAt);
      return timeA - timeB; // Oldest first
    });

    setSubmissions(list);
    setLoading(false);
  }, []);

  // Fetch missing task documents on demand (deduplicated & batched)
  const fetchMissingTasks = useCallback(
    async (missingIds: string[]) => {
      if (missingIds.length === 0) return;

      const db = getFirebaseDb();
      missingIds.forEach((id) => missingTaskIdsInFlightRef.current.add(id));

      try {
        const fetchPromises = missingIds.map(async (tid) => {
          try {
            const taskDocRef = doc(db, FIRESTORE_COLLECTIONS.TASKS, tid);
            const taskSnap = await getDoc(taskDocRef);
            if (taskSnap.exists()) {
              taskCacheRef.current.set(tid, { id: tid, ...taskSnap.data() } as TaskDocument);
            }
          } catch (err) {
            console.warn(`[useAdminSubmissions] Failed to fetch task ${tid}:`, err);
          } finally {
            missingTaskIdsInFlightRef.current.delete(tid);
          }
        });

        await Promise.all(fetchPromises);
        mergeAndSetSubmissions(rawEnrollmentsRef.current);
      } catch (err) {
        console.error('[useAdminSubmissions] Error fetching missing tasks:', err);
      }
    },
    [mergeAndSetSubmissions]
  );

  // Realtime listeners for tasks and enrollments
  useEffect(() => {
    queueMicrotask(() => {
      setLoading(true);
      setError(null);
    });

    const db = getFirebaseDb();

    // 1. Realtime listener for Tasks collection (populates task cache)
    const tasksColRef = collection(db, FIRESTORE_COLLECTIONS.TASKS);
    const unsubTasks = onSnapshot(
      tasksColRef,
      (tasksSnap) => {
        tasksSnap.forEach((docSnap: QueryDocumentSnapshot<DocumentData>) => {
          taskCacheRef.current.set(docSnap.id, {
            id: docSnap.id,
            ...docSnap.data(),
          } as TaskDocument);
        });

        if (rawEnrollmentsRef.current.length > 0) {
          mergeAndSetSubmissions(rawEnrollmentsRef.current);
        }
      },
      (err) => {
        console.warn('[useAdminSubmissions] Tasks snapshot warning:', err);
      }
    );

    // 2. Realtime listener for initial page of Enrollments collection (PAGE_SIZE = 50)
    const colRef = collection(db, FIRESTORE_COLLECTIONS.ENROLLMENTS);
    const q = query(colRef, orderBy('enrolledAt', 'desc'), limit(PAGE_SIZE));

    const unsubEnrollments = onSnapshot(
      q,
      (snapshot) => {
        const rawList: EnrollmentDocument[] = [];
        snapshot.forEach((docSnap: QueryDocumentSnapshot<DocumentData>) => {
          const data = docSnap.data();
          rawList.push({
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

        page1EnrollmentsRef.current = rawList;

        if (extraEnrollmentsRef.current.length === 0) {
          lastEnrollmentDocRef.current = snapshot.docs[snapshot.docs.length - 1] || null;
          setHasMore(snapshot.docs.length >= PAGE_SIZE);
        }

        const combinedList = [...page1EnrollmentsRef.current, ...extraEnrollmentsRef.current];
        rawEnrollmentsRef.current = combinedList;

        // Check for missing task IDs in cache
        const uniqueTaskIds = Array.from(
          new Set(
            combinedList.map((e) => e.taskId || e.lockedTaskId || '').filter((id) => id.length > 0)
          )
        );

        const missingIds = uniqueTaskIds.filter(
          (id) => !taskCacheRef.current.has(id) && !missingTaskIdsInFlightRef.current.has(id)
        );

        mergeAndSetSubmissions(combinedList);

        if (missingIds.length > 0) {
          fetchMissingTasks(missingIds);
        }
      },
      (err) => {
        console.error('[useAdminSubmissions] Enrollment snapshot error:', err);
        const msg = err instanceof Error ? err.message : 'Error fetching submissions';
        setError(msg);
        setLoading(false);
      }
    );

    return () => {
      unsubTasks();
      unsubEnrollments();
    };
  }, [fetchMissingTasks, mergeAndSetSubmissions]);

  // Load More callback using startAfter cursor pagination
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !lastEnrollmentDocRef.current) return;

    setLoadingMore(true);
    try {
      const db = getFirebaseDb();
      const colRef = collection(db, FIRESTORE_COLLECTIONS.ENROLLMENTS);
      const q = query(
        colRef,
        orderBy('enrolledAt', 'desc'),
        startAfter(lastEnrollmentDocRef.current),
        limit(PAGE_SIZE)
      );

      const snapshot = await getDocs(q);
      const newEnrollments: EnrollmentDocument[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        newEnrollments.push({
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

      extraEnrollmentsRef.current = [...extraEnrollmentsRef.current, ...newEnrollments];
      if (snapshot.docs.length > 0) {
        lastEnrollmentDocRef.current = snapshot.docs[snapshot.docs.length - 1];
      }
      setHasMore(snapshot.docs.length >= PAGE_SIZE);

      const combinedList = [...page1EnrollmentsRef.current, ...extraEnrollmentsRef.current];
      rawEnrollmentsRef.current = combinedList;

      const uniqueTaskIds = Array.from(
        new Set(
          combinedList.map((e) => e.taskId || e.lockedTaskId || '').filter((id) => id.length > 0)
        )
      );
      const missingIds = uniqueTaskIds.filter(
        (id) => !taskCacheRef.current.has(id) && !missingTaskIdsInFlightRef.current.has(id)
      );

      mergeAndSetSubmissions(combinedList);

      if (missingIds.length > 0) {
        fetchMissingTasks(missingIds);
      }
    } catch (err) {
      console.error('[useAdminSubmissions loadMore error]', err);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, fetchMissingTasks, mergeAndSetSubmissions]);

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
        const itemDate = (parseDateInput(item.submittedAt || item.enrolledAt) || new Date());
        const startDate = (parseDateInput(filters.startDate) || new Date());
        if (itemDate < startDate) return false;
      }
      if (filters.endDate) {
        const itemDate = (parseDateInput(item.submittedAt || item.enrolledAt) || new Date());
        const endDate = (parseDateInput(filters.endDate) || new Date());
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

          // Perform ALL transaction reads BEFORE any writes
          const userRef = userId ? doc(db, FIRESTORE_COLLECTIONS.USERS, userId) : null;
          const userSnap = userRef ? await transaction.get(userRef) : null;

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
          if (userRef && userSnap && userSnap.exists()) {
            transaction.update(userRef, {
              totalTasksCompleted: increment(1),
              lastTaskCompletedAt: serverTimestamp(),
              weeklyStreak: increment(1),
            });
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
      if (enrollmentIds.length === 0) return;

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
    hasMore,
    loadMore,
    approveSubmission,
    rejectSubmission,
    bulkApprove,
    startProcessingPayment,
    markPaidPayment,
  };
}
