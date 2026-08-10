'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  orderBy,
  limit,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { getFirebaseDb } from '@/firebase/config';
import { TaskDocument, EnrollmentDocument, FIRESTORE_COLLECTIONS } from '@/types/firestore';
import { useAuthContext } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useToast } from '@/hooks/use-toast';
import { allocateComment } from '@/lib/commentAllocator';
import { getSafeTime, formatDate } from '@/utils/formatters';
import { resolveMemberReward } from '@/lib/rewardResolver';
import {
  EnrollmentErrorCode,
  ERROR_MESSAGES,
} from '@/lib/enrollmentValidator';

export interface EnrollTaskResult {
  success: boolean;
  errorCode?: EnrollmentErrorCode;
  message?: string;
  enrollment?: EnrollmentDocument;
}

export function useEnrollTask() {
  const { currentUser, userProfile } = useAuthContext();
  const { openAuthModal, pendingTaskId, clearPendingTask } = useAuthModal();
  const { toast } = useToast();

  const [isEnrolling, setIsEnrolling] = useState<boolean>(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);

  const enrollTask = useCallback(
    async (taskId: string, resolvedTask?: TaskDocument): Promise<EnrollTaskResult> => {
      setEnrollError(null);

      // 1. Auth check
      if (!currentUser?.uid) {
        openAuthModal(taskId);
        const msg = ERROR_MESSAGES.PERMISSION_DENIED;
        toast({
          title: 'Sign In Required',
          message: 'Please sign in or create an account to enroll.',
          variant: 'warning',
        });
        return { success: false, errorCode: 'PERMISSION_DENIED', message: msg };
      }

      setIsEnrolling(true);

      try {
        const db = getFirebaseDb();
        const enrollmentId = `${taskId}_${currentUser.uid}`;

        // Pre-transaction read to check Task & Cooldown Policy
        const taskRef = doc(db, FIRESTORE_COLLECTIONS.TASKS, taskId);
        const taskSnap = await getDoc(taskRef);

        if (!taskSnap.exists()) {
          throw new Error('TASK_INACTIVE');
        }

        const taskData = {
          id: taskSnap.id,
          ...taskSnap.data(),
        } as TaskDocument;

        if (taskData.status !== 'active') {
          throw new Error('TASK_INACTIVE');
        }

        if (taskData.expiresAt) {
          const expiry = getSafeTime(taskData.expiresAt);
          if (!isNaN(expiry) && expiry <= Date.now()) {
            throw new Error('TASK_EXPIRED');
          }
        }

        // Per-App Re-enrollment Cooldown Check
        const reenrollmentPolicy = taskData.reenrollmentPolicy ?? 'cooldown';
        const cooldownDays =
          reenrollmentPolicy === 'none'
            ? 0
            : typeof taskData.cooldownDays === 'number' && taskData.cooldownDays >= 0
            ? taskData.cooldownDays
            : 10;

        const currentPackageName = (taskData.packageName || '').trim();

        if (currentPackageName) {
          const enrollmentsRef = collection(db, FIRESTORE_COLLECTIONS.ENROLLMENTS);
          const q = query(
            enrollmentsRef,
            where('userId', '==', currentUser.uid),
            where('packageName', '==', currentPackageName)
          );
          const userEnrollmentsSnap = await getDocs(q);

          if (!userEnrollmentsSnap.empty) {
            const docsData = userEnrollmentsSnap.docs.map((d) => d.data());

            // 1. Active Enrollment Check (Rule 1)
            // Active statuses: pending (unexpired), submitted, under_review
            const activeDoc = docsData.find((data) => {
              const status = data.status;
              if (status === 'submitted' || status === 'under_review') {
                return true;
              }
              if (status === 'pending') {
                if (data.expiresAt) {
                  const expiryMs = getSafeTime(data.expiresAt);
                  if (!isNaN(expiryMs) && expiryMs <= Date.now()) {
                    return false; // Expired pending enrollment is no longer active
                  }
                }
                return true;
              }
              return false;
            });

            if (activeDoc) {
              const activeMsg =
                "You already have an active task for this app.\n\nComplete it before today's deadline to become eligible again.";
              setIsEnrolling(false);
              setEnrollError(activeMsg);
              toast({
                title: 'Active Task Exists',
                message: activeMsg,
                variant: 'info',
              });
              return {
                success: false,
                errorCode: 'ACTIVE_TASK_EXISTS' as EnrollmentErrorCode,
                message: activeMsg,
              };
            }

            // 2. Cooldown Check on Completed Work (Rules 2, 3, 4)
            // Cooldown applies ONLY when work/proof was actually performed:
            // submitted, under_review, approved, rejected, payment_pending, paid
            if (reenrollmentPolicy !== 'none' && cooldownDays > 0) {
              const WORK_PERFORMED_STATUSES = [
                'submitted',
                'under_review',
                'approved',
                'rejected',
                'payment_pending',
                'paid',
              ];

              let newestWorkAtMs: number | null = null;

              for (const data of docsData) {
                if (WORK_PERFORMED_STATUSES.includes(data.status)) {
                  let enrolledMs: number | null = null;
                  const ts = data.enrolledAt || data.createdAt || data.submittedAt;
                  if (
                    ts &&
                    typeof ts === 'object' &&
                    'toDate' in ts &&
                    typeof (ts as { toDate: () => Date }).toDate === 'function'
                  ) {
                    enrolledMs = (ts as { toDate: () => Date }).toDate().getTime();
                  } else if (
                    ts &&
                    typeof ts === 'object' &&
                    'seconds' in ts &&
                    typeof (ts as { seconds: number }).seconds === 'number'
                  ) {
                    enrolledMs = (ts as { seconds: number }).seconds * 1000;
                  } else if (typeof ts === 'string' || typeof ts === 'number') {
                    const d = new Date(ts);
                    if (!isNaN(d.getTime())) enrolledMs = d.getTime();
                  }

                  if (enrolledMs !== null) {
                    if (newestWorkAtMs === null || enrolledMs > newestWorkAtMs) {
                      newestWorkAtMs = enrolledMs;
                    }
                  }
                }
              }

              if (newestWorkAtMs !== null) {
                const nowMs = Date.now();
                const cooldownMs = cooldownDays * 24 * 60 * 60 * 1000;
                const elapsedMs = nowMs - newestWorkAtMs;

                if (elapsedMs < cooldownMs) {
                  const remainingMs = cooldownMs - elapsedMs;
                  const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
                  const daysText = remainingDays === 1 ? '1 day' : `${remainingDays} days`;
                  const nextEligibleMs = newestWorkAtMs + cooldownMs;
                  const formattedNextDate = formatDate(nextEligibleMs);
                  const blockedMsg = `You recently completed work for this app.\n\nAvailable again in ${daysText}.\n\nNext eligible date:\n${formattedNextDate}`;

                  setIsEnrolling(false);
                  setEnrollError(blockedMsg);
                  toast({
                    title: 'Cooldown Active',
                    message: blockedMsg,
                    variant: 'info',
                  });
                  return {
                    success: false,
                    errorCode: 'COOLDOWN_ACTIVE' as EnrollmentErrorCode,
                    message: blockedMsg,
                  };
                }
              }
            }
          }
        }

        const result = await runTransaction(db, async (transaction) => {
          const enrollmentRef = doc(db, FIRESTORE_COLLECTIONS.ENROLLMENTS, enrollmentId);

          // Atomic reads inside transaction
          const tSnap = await transaction.get(taskRef);
          if (!tSnap.exists()) {
            throw new Error('TASK_INACTIVE');
          }

          const tData = {
            id: tSnap.id,
            ...tSnap.data(),
          } as TaskDocument;

          // Status validation
          if (tData.status !== 'active') {
            throw new Error('TASK_INACTIVE');
          }

          // Expiry validation
          if (tData.expiresAt) {
            const expiry = getSafeTime(tData.expiresAt);
            if (!isNaN(expiry) && expiry <= Date.now()) {
              throw new Error('TASK_EXPIRED');
            }
          }

          // Slots validation
          const totalSlots = tData.totalSlots ?? tData.maxSubmissions ?? 1;
          const currentEnrolled = tData.enrolledCount ?? tData.currentSubmissions ?? 0;

          if (currentEnrolled >= totalSlots) {
            throw new Error('TASK_FULL');
          }

          // Existing enrollment check inside transaction
          const enrollmentSnap = await transaction.get(enrollmentRef);
          if (enrollmentSnap.exists()) {
            throw new Error('ALREADY_ENROLLED');
          }

          // Atomic comment allocation
          const allocation = allocateComment(tData, currentEnrolled);

          const storedPackageName = (tData.packageName || '').trim();
          
          let taskRewardBase = tData.rewardAmount;
          let leaderRewardAmount = null;
          let assignmentId = null;
          let baseReward = tData.baseReward ?? tData.rewardAmount ?? 0;
          let taskLeaderId = null;
          
          if (resolvedTask) {
             taskRewardBase = resolvedTask.rewardAmount ?? taskRewardBase;
             leaderRewardAmount = resolvedTask._resolvedLeaderRewardAmount ?? null;
             assignmentId = resolvedTask._resolvedAssignmentId ?? null;
             baseReward = resolvedTask._resolvedBaseReward ?? baseReward;
             if (assignmentId) {
               taskLeaderId = userProfile?.leaderId || null;
             }
          }

          const finalReward = resolveMemberReward(taskRewardBase, userProfile?.effectiveReward);

          // Construct enrollment payload
          const enrollmentPayload: Record<string, unknown> = {
            id: enrollmentId,
            leaderRewardAmount,
            baseReward,
            assignmentId,
            leaderId: taskLeaderId,
            rewardResolvedAt: serverTimestamp(),
            userId: currentUser.uid,
            taskId: taskId,
            userName:
              userProfile?.displayName ||
              currentUser.displayName ||
              currentUser.email ||
              'User',
            appName: tData.appName,
            packageName: storedPackageName,
            taskTitle: tData.title,
            reward: finalReward,
            rewardAmount: finalReward,
            assignedComment: allocation.assignedComment,
            commentIndex: allocation.commentIndex,
            status: 'pending',
            enrolledAt: serverTimestamp(),
            submittedAt: null,
            reviewedAt: null,
            reviewedBy: '',
            rejectionReason: '',
            screenshotUrl: '',
            userComment: '',
            paymentStatus: 'pending',
          };

          // Atomic Writes
          transaction.set(enrollmentRef, enrollmentPayload);

          const nextEnrolledCount = currentEnrolled + 1;
          transaction.update(taskRef, {
            enrolledCount: nextEnrolledCount,
            currentSubmissions: nextEnrolledCount,
            updatedAt: serverTimestamp(),
          });

          return enrollmentPayload as unknown as EnrollmentDocument;
        });

        setIsEnrolling(false);

        toast({
          title: 'Enrollment Successful! 🎉',
          message: 'Your slot has been reserved. Complete task instructions before time expires.',
          variant: 'success',
        });

        return {
          success: true,
          enrollment: result,
        };
      } catch (err: unknown) {
        setIsEnrolling(false);
        let errorCode: EnrollmentErrorCode = 'UNKNOWN_ERROR';
        let customErrorMsg: string | null = null;

        if (err instanceof Error) {
          if (
            err.message === 'TASK_FULL' ||
            err.message === 'ALREADY_ENROLLED' ||
            err.message === 'TASK_INACTIVE' ||
            err.message === 'TASK_EXPIRED'
          ) {
            errorCode = err.message as EnrollmentErrorCode;
          } else if (err.message.includes('permission-denied')) {
            errorCode = 'PERMISSION_DENIED';
          } else if (err.message.includes('network') || err.message.includes('unavailable')) {
            errorCode = 'NETWORK_ERROR';
          } else if (err.message.startsWith('You recently worked on this app')) {
            errorCode = 'COOLDOWN_ACTIVE' as EnrollmentErrorCode;
            customErrorMsg = err.message;
          }
        }

        const humanMessage = customErrorMsg || ERROR_MESSAGES[errorCode] || ERROR_MESSAGES.UNKNOWN_ERROR;
        setEnrollError(humanMessage);

        toast({
          title: 'Enrollment Failed',
          message: humanMessage,
          variant: errorCode === 'ALREADY_ENROLLED' ? 'info' : 'error',
        });

        return {
          success: false,
          errorCode,
          message: humanMessage,
        };
      }
    },
    [currentUser, userProfile, openAuthModal, toast]
  );

  // Auto-resume pending enrollment when user authenticates
  useEffect(() => {
    let taskIdToEnroll = pendingTaskId;

    if (!taskIdToEnroll && typeof window !== 'undefined') {
      try {
        taskIdToEnroll = sessionStorage.getItem('playpay_pending_task_id');
      } catch {}

      if (!taskIdToEnroll) {
        const params = new URLSearchParams(window.location.search);
        taskIdToEnroll = params.get('pendingTaskId');
      }
    }

    if (currentUser?.uid && taskIdToEnroll) {
      clearPendingTask();
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.removeItem('playpay_pending_task_id');
        } catch {}
      }
      queueMicrotask(() => {
        enrollTask(taskIdToEnroll);
      });
    }
  }, [currentUser?.uid, pendingTaskId, clearPendingTask, enrollTask]);

  return {
    enrollTask,
    isEnrolling,
    enrollError,
  };
}
