'use client';

import { useState, useCallback, useEffect } from 'react';
import { doc, runTransaction } from 'firebase/firestore';
import { getFirebaseDb, isFirebaseConfigured } from '@/firebase/config';
import { TaskDocument, EnrollmentDocument, FIRESTORE_COLLECTIONS } from '@/types/firestore';
import { useAuthContext } from '@/contexts/AuthContext';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { useToast } from '@/hooks/use-toast';
import { allocateComment } from '@/lib/commentAllocator';
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
    async (taskId: string): Promise<EnrollTaskResult> => {
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

      if (!isFirebaseConfigured()) {
        const msg = ERROR_MESSAGES.NETWORK_ERROR;
        toast({
          title: 'Configuration Error',
          message: 'Firebase database is not connected.',
          variant: 'error',
        });
        return { success: false, errorCode: 'NETWORK_ERROR', message: msg };
      }

      setIsEnrolling(true);

      try {
        const db = getFirebaseDb();
        const enrollmentId = `${taskId}_${currentUser.uid}`;

        const result = await runTransaction(db, async (transaction) => {
          const taskRef = doc(db, FIRESTORE_COLLECTIONS.TASKS, taskId);
          const enrollmentRef = doc(db, FIRESTORE_COLLECTIONS.ENROLLMENTS, enrollmentId);

          // Atomic reads
          const taskSnap = await transaction.get(taskRef);
          if (!taskSnap.exists()) {
            throw new Error('TASK_INACTIVE');
          }

          const taskData = {
            id: taskSnap.id,
            ...taskSnap.data(),
          } as TaskDocument;

          // Status validation
          if (taskData.status !== 'active') {
            throw new Error('TASK_INACTIVE');
          }

          // Expiry validation
          if (taskData.expiresAt) {
            const expiry = new Date(taskData.expiresAt).getTime();
            if (!isNaN(expiry) && expiry <= Date.now()) {
              throw new Error('TASK_EXPIRED');
            }
          }

          // Slots validation
          const totalSlots = taskData.totalSlots ?? taskData.maxSubmissions ?? 1;
          const currentEnrolled = taskData.enrolledCount ?? taskData.currentSubmissions ?? 0;

          if (currentEnrolled >= totalSlots) {
            throw new Error('TASK_FULL');
          }

          // Existing enrollment check inside transaction
          const enrollmentSnap = await transaction.get(enrollmentRef);
          if (enrollmentSnap.exists()) {
            throw new Error('ALREADY_ENROLLED');
          }

          // Atomic comment allocation
          const allocation = allocateComment(taskData, currentEnrolled);

          // Construct enrollment payload
          const now = new Date().toISOString();
          const enrollmentPayload: EnrollmentDocument = {
            id: enrollmentId,
            userId: currentUser.uid,
            taskId: taskId,
            userName:
              userProfile?.displayName ||
              currentUser.displayName ||
              currentUser.email ||
              'User',
            taskTitle: taskData.title,
            reward: taskData.rewardAmount,
            rewardAmount: taskData.rewardAmount,
            assignedComment: allocation.assignedComment,
            commentIndex: allocation.commentIndex,
            status: 'pending',
            enrolledAt: now,
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
            updatedAt: now,
          });

          return enrollmentPayload;
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
          }
        }

        const humanMessage = ERROR_MESSAGES[errorCode] || ERROR_MESSAGES.UNKNOWN_ERROR;
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
    if (currentUser?.uid && pendingTaskId) {
      const taskIdToEnroll = pendingTaskId;
      clearPendingTask();
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
