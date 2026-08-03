'use client';

import { useState, useCallback, useRef } from 'react';
import { doc, runTransaction } from 'firebase/firestore';
import { getFirebaseDb, isFirebaseConfigured } from '@/firebase/config';
import { FIRESTORE_COLLECTIONS, EnrollmentDocument, CloudinaryMetadata } from '@/types/firestore';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface SubmitProofParams {
  enrollmentId: string;
  screenshotUrl: string;
  userComment?: string;
  cloudinaryMetadata?: CloudinaryMetadata | null;
  publicIdToRollback?: string | null;
  isResubmission?: boolean;
}

export function useSubmitProof() {
  const { currentUser } = useAuthContext();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Rule 8 — Double Click Protection
  const submitInFlightRef = useRef<boolean>(false);

  const submitProof = useCallback(
    async ({
      enrollmentId,
      screenshotUrl,
      userComment = '',
      cloudinaryMetadata = null,
      publicIdToRollback = null,
      isResubmission = false,
    }: SubmitProofParams): Promise<boolean> => {
      setSubmitError(null);

      // Rule 8 — Double Click Protection Guard
      if (submitInFlightRef.current) {
        console.warn('[SubmitProof] Submission request already in progress.');
        return false;
      }

      // Rule 13 — Authentication Check
      if (!currentUser?.uid) {
        const msg = 'Authentication required to submit task proof.';
        setSubmitError(msg);
        toast({
          title: 'Sign In Required',
          message: msg,
          variant: 'error',
        });
        return false;
      }

      if (!isFirebaseConfigured()) {
        const msg = 'Firestore database is not configured.';
        setSubmitError(msg);
        toast({
          title: 'Configuration Error',
          message: msg,
          variant: 'error',
        });
        return false;
      }

      // Rule 1 — Cloudinary Upload Verification Guard
      if (!screenshotUrl || typeof screenshotUrl !== 'string' || !screenshotUrl.startsWith('https://')) {
        const msg = 'Valid Cloudinary HTTPS screenshot proof is required before submitting.';
        setSubmitError(msg);
        toast({
          title: 'Screenshot Verification Error',
          message: msg,
          variant: 'error',
        });
        return false;
      }

      submitInFlightRef.current = true;
      setIsSubmitting(true);

      try {
        const db = getFirebaseDb();
        const enrollmentRef = doc(db, FIRESTORE_COLLECTIONS.ENROLLMENTS, enrollmentId);

        // Rule 10 — Firestore Atomic Update Transaction
        await runTransaction(db, async (transaction) => {
          const snapshot = await transaction.get(enrollmentRef);

          if (!snapshot.exists()) {
            throw new Error('Task enrollment document does not exist.');
          }

          const existingData = snapshot.data() as EnrollmentDocument;

          // Rule 4 — Ownership Validation
          if (existingData.userId !== currentUser.uid) {
            throw new Error('Permission Denied: You do not own this enrollment.');
          }

          // Rule 2 & Rule 7 — Immutable Submission Lock & Duplicate Submission Prevention
          if (existingData.status === 'approved') {
            throw new Error('This enrollment has already been approved and cannot be modified.');
          }

          if (existingData.status === 'pending' && existingData.submittedAt && !isResubmission) {
            throw new Error('Your proof is already submitted and under review. Duplicate submissions are not allowed.');
          }

          // Rule 12 — Submission Versioning
          const currentVersion = existingData.submissionVersion || 1;
          const nextVersion = isResubmission || existingData.status === 'rejected' ? currentVersion + 1 : currentVersion;

          const now = new Date().toISOString();

          // Rule 5, 6, 11 & 12 — Atomic Update Payload (Only User-Allowed Fields)
          // Preserves immutable fields: userId, taskId, reward, assignedComment, commentIndex, enrolledAt, taskTitle, appName
          // Does NOT write admin fields: reviewedAt, reviewedBy, paymentStatus
          const updatePayload: Record<string, unknown> = {
            status: 'pending', // Re-enter pending review status
            submittedAt: now,
            screenshotUrl,
            proofUrl: screenshotUrl,
            userComment: userComment.trim(),
            submissionVersion: nextVersion,
            lastUpdatedAt: now,
            lastUpdatedBy: currentUser.uid,
            rejectionReason: '', // Clear previous rejection reason
          };

          if (cloudinaryMetadata) {
            updatePayload.cloudinaryMetadata = cloudinaryMetadata;
          }

          transaction.update(enrollmentRef, updatePayload);
        });

        submitInFlightRef.current = false;
        setIsSubmitting(false);

        toast({
          title: isResubmission ? 'Proof Resubmitted! 🚀' : 'Proof Submitted! 🎉',
          message: 'Your proof has been submitted for admin verification.',
          variant: 'success',
        });

        return true;
      } catch (err: unknown) {
        submitInFlightRef.current = false;
        setIsSubmitting(false);

        const errorMsg =
          err instanceof Error ? err.message : 'Failed to submit proof due to database transaction error.';
        setSubmitError(errorMsg);

        // Rule 9 — Upload Rollback Trigger on Firestore Failure
        if (publicIdToRollback) {
          try {
            await fetch('/api/upload/rollback', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ publicId: publicIdToRollback }),
            });
            console.log('[Rule 9 Rollback Executed] Deleted orphaned asset:', publicIdToRollback);
          } catch (rollbackErr) {
            console.error('[Rule 9 Rollback Failed]', rollbackErr);
          }
        }

        toast({
          title: 'Submission Failed',
          message: errorMsg,
          variant: 'error',
        });

        return false;
      }
    },
    [currentUser, toast]
  );

  return {
    submitProof,
    isSubmitting,
    submitError,
  };
}
