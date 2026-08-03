'use client';

import { useState, useCallback } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { getFirebaseDb } from '@/firebase/config';
import { FIRESTORE_COLLECTIONS, UserDocument } from '@/types/firestore';
import { validateFullProfileForm, ProfileFormValues, ProfileFormErrors } from '@/lib/profile-validation';
import { handleFirestoreError, OperationType } from '@/lib/firebase-errors';

export interface UseUpdateProfileReturn {
  updateProfile: (
    values: ProfileFormValues,
    onOptimisticUpdate?: (optimisticData: Partial<UserDocument>) => void
  ) => Promise<boolean>;
  updating: boolean;
  errors: ProfileFormErrors;
  generalError: string | null;
  clearErrors: () => void;
}

export function useUpdateProfile(): UseUpdateProfileReturn {
  const { currentUser } = useAuth();
  const [updating, setUpdating] = useState<boolean>(false);
  const [errors, setErrors] = useState<ProfileFormErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const clearErrors = useCallback(() => {
    setErrors({});
    setGeneralError(null);
  }, []);

  const updateProfile = useCallback(
    async (
      values: ProfileFormValues,
      onOptimisticUpdate?: (optimisticData: Partial<UserDocument>) => void
    ): Promise<boolean> => {
      clearErrors();

      // Check offline mode
      if (typeof window !== 'undefined' && !navigator.onLine) {
        setGeneralError('You are currently offline. Please check your internet connection and try again.');
        return false;
      }

      if (!currentUser) {
        setGeneralError('User session expired. Please sign in again.');
        return false;
      }

      // Form validation
      const validation = validateFullProfileForm(values);
      if (!validation.isValid) {
        setErrors(validation.errors);
        setGeneralError('Please fix the validation errors in the form.');
        return false;
      }

      setUpdating(true);

      const timestamp = new Date().toISOString();
      const updatedFields: Partial<UserDocument> = {
        phoneNumber: values.phoneNumber.trim(),
        upiId: values.upiId.trim(),
        bankName: values.bankName.trim(),
        accountHolder: values.accountHolder.trim(),
        accountNumber: values.accountNumber.trim(),
        ifscCode: values.ifscCode.trim().toUpperCase(),
        lastProfileUpdateAt: timestamp,
      };

      // Apply Optimistic Update if callback provided
      if (onOptimisticUpdate) {
        onOptimisticUpdate(updatedFields);
      }

      try {
        const db = getFirebaseDb();
        const userRef = doc(db, FIRESTORE_COLLECTIONS.USERS, currentUser.uid);

        await updateDoc(userRef, updatedFields);
        setUpdating(false);
        return true;
      } catch (err) {
        console.error('[useUpdateProfile Error]', err);
        setGeneralError('Failed to update profile. Changes have been rolled back.');
        setUpdating(false);

        handleFirestoreError(
          err,
          OperationType.UPDATE,
          `${FIRESTORE_COLLECTIONS.USERS}/${currentUser.uid}`
        );
        return false;
      }
    },
    [currentUser, clearErrors]
  );

  return {
    updateProfile,
    updating,
    errors,
    generalError,
    clearErrors,
  };
}
