'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Modal } from '@/components/ui/modal';
import { useAuth } from '@/hooks/useAuth';
import { getFirebaseAuth, getFirebaseDb } from '@/firebase/config';
import { FIRESTORE_COLLECTIONS } from '@/types/firestore';

export function OnboardingModal() {
  const { currentUser, userProfile, loading, refreshProfile } = useAuth();
  const [joinMethod, setJoinMethod] = useState<'team' | 'direct' | null>(null);
  const [currentStep, setCurrentStep] = useState<'choose' | 'placeholder'>('choose');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  // Leader Code local state
  const [leaderCode, setLeaderCode] = useState('');
  const [isTouched, setIsTouched] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Auto focus input when step becomes 'placeholder' and joinMethod is 'team'
  useEffect(() => {
    if (currentStep === 'placeholder' && joinMethod === 'team') {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [currentStep, joinMethod]);

  // Show onboarding ONLY if user is logged in, profile is loaded, and profileCompleted is explicitly false
  const showOnboarding = Boolean(
    !loading && currentUser && userProfile && userProfile.profileCompleted === false
  );

  if (!showOnboarding) {
    return null;
  }

  const handleContinue = () => {
    if (!joinMethod || isSubmitting) return;
    setIsSubmitting(true);
    setVerificationError(null);
    setTimeout(() => {
      setCurrentStep('placeholder');
      setIsSubmitting(false);
    }, 300);
  };

  const handleBack = () => {
    if (isVerifying) return;
    setVerificationError(null);
    setCurrentStep('choose');
  };

  const handleLeaderCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.toUpperCase();
    // Prevent consecutive spaces
    val = val.replace(/\s+/g, ' ');
    // Maximum length 20
    if (val.length > 20) {
      val = val.slice(0, 20);
    }
    setLeaderCode(val);
    setVerificationError(null);
  };

  const trimmedLeaderCode = leaderCode.trim();
  const isLeaderCodeValid = trimmedLeaderCode.length >= 4 && trimmedLeaderCode.length <= 20;

  let leaderCodeError = '';
  if (isTouched) {
    if (trimmedLeaderCode.length === 0) {
      leaderCodeError = 'Leader Code is required.';
    } else if (trimmedLeaderCode.length < 4) {
      leaderCodeError = 'Enter a valid Leader Code.';
    }
  }

  // Handle Leader Code Verification & Submission
  const handleLeaderCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTouched(true);
    setVerificationError(null);

    if (!trimmedLeaderCode) {
      setVerificationError('Invalid Leader Code.');
      return;
    }

    if (trimmedLeaderCode.length < 4 || trimmedLeaderCode.length > 20) {
      return;
    }

    const auth = getFirebaseAuth();
    if (!currentUser || !auth.currentUser || auth.currentUser.uid !== currentUser.uid || isVerifying) {
      setVerificationError('Authentication required. Please sign in again.');
      return;
    }

    setIsVerifying(true);

    try {
      const db = getFirebaseDb();
      const normalizedCode = trimmedLeaderCode.toUpperCase();

      // Step 1: Secure single-document lookup in leaderCodes mapping collection
      const leaderCodeRef = doc(db, FIRESTORE_COLLECTIONS.LEADER_CODES, normalizedCode);
      const leaderCodeSnap = await getDoc(leaderCodeRef);

      if (!leaderCodeSnap.exists()) {
        setVerificationError('Invalid Leader Code.');
        setIsVerifying(false);
        return;
      }

      const leaderCodeData = leaderCodeSnap.data();

      // Check memberType on leaderCodes mapping if present (default to valid if not set for backward compatibility)
      if (leaderCodeData.memberType && leaderCodeData.memberType !== 'team_leader') {
        setVerificationError('Invalid Leader Code.');
        setIsVerifying(false);
        return;
      }

      // Check if active status on leaderCodes mapping
      if (leaderCodeData.isLeaderActive === false) {
        setVerificationError('This Team Leader is currently unavailable.');
        setIsVerifying(false);
        return;
      }

      const leaderUid = leaderCodeData.leaderId;
      if (!leaderUid) {
        setVerificationError('Invalid Leader Code.');
        setIsVerifying(false);
        return;
      }

      // Verify auth state before profile update
      if (!auth.currentUser) {
        setVerificationError('Authentication required. Please sign in again.');
        setIsVerifying(false);
        return;
      }

      // Update current user profile
      const currentUserRef = doc(db, FIRESTORE_COLLECTIONS.USERS, currentUser.uid);
      await updateDoc(currentUserRef, {
        memberType: 'team_member',
        leaderId: leaderUid,
        profileCompleted: true,
      });

      // Synchronously wait for profile refresh to complete if auth is active
      if (auth.currentUser) {
        await refreshProfile();
      }
    } catch (err: unknown) {
      console.error('[Leader Verification Error]', err);
      const firebaseErr = err as { code?: string; message?: string };
      if (firebaseErr?.code === 'permission-denied') {
        setVerificationError('Permission denied. Please try again.');
      } else if (firebaseErr?.code === 'unavailable' || (typeof navigator !== 'undefined' && !navigator.onLine)) {
        setVerificationError('Network error. Please check your internet connection.');
      } else {
        setVerificationError('Failed to verify Leader Code. Please try again.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle Direct Join Submission
  const handleDirectJoinSubmit = async () => {
    const auth = getFirebaseAuth();
    if (!currentUser || !auth.currentUser || auth.currentUser.uid !== currentUser.uid || isVerifying) {
      setVerificationError('Authentication required. Please sign in again.');
      return;
    }

    setIsVerifying(true);
    setVerificationError(null);

    try {
      const db = getFirebaseDb();
      const currentUserRef = doc(db, FIRESTORE_COLLECTIONS.USERS, currentUser.uid);
      await updateDoc(currentUserRef, {
        memberType: 'pending',
        profileCompleted: true,
        leaderId: '',
        leaderCode: '',
      });

      // Synchronously wait for profile refresh to complete before unmounting modal or routing
      if (auth.currentUser) {
        await refreshProfile();
      }
    } catch (err: unknown) {
      console.error('[Direct Join Error]', err);
      const firebaseErr = err as { code?: string; message?: string };
      if (firebaseErr?.code === 'permission-denied') {
        setVerificationError('Permission denied. Please try again.');
      } else if (firebaseErr?.code === 'unavailable' || (typeof navigator !== 'undefined' && !navigator.onLine)) {
        setVerificationError('Network error. Please check your internet connection.');
      } else {
        setVerificationError('Failed to submit request. Please try again.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Modal
      isOpen={showOnboarding}
      onClose={() => {}}
      closeOnOverlayClick={false}
      size="md"
    >
      {currentStep === 'choose' ? (
        <div className="p-6 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              Welcome to PlayPay
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Choose how you want to join.
            </p>
          </div>

          <div className="space-y-3">
            {/* Option 1: Team Leader Code */}
            <button
              type="button"
              onClick={() => setJoinMethod('team')}
              disabled={isSubmitting}
              className={`w-full text-left p-4 min-h-[56px] rounded-2xl border transition-all flex items-start gap-3.5 select-none touch-manipulation ${
                joinMethod === 'team'
                  ? 'border-[var(--primary)] bg-[var(--primary)]/10 ring-2 ring-[var(--primary)]/20'
                  : 'border-[var(--border)] bg-[var(--surface-elevated)] hover:border-[var(--text-secondary)]'
              }`}
            >
              <div className="mt-0.5 text-base font-bold text-[var(--primary)] shrink-0">
                {joinMethod === 'team' ? '●' : '○'}
              </div>
              <div>
                <div className="text-sm font-bold text-[var(--text-primary)]">
                  I have a Team Leader Code
                </div>
                <div className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                  Join under your Team Leader.
                </div>
              </div>
            </button>

            {/* Option 2: Join Directly */}
            <button
              type="button"
              onClick={() => setJoinMethod('direct')}
              disabled={isSubmitting}
              className={`w-full text-left p-4 min-h-[56px] rounded-2xl border transition-all flex items-start gap-3.5 select-none touch-manipulation ${
                joinMethod === 'direct'
                  ? 'border-[var(--primary)] bg-[var(--primary)]/10 ring-2 ring-[var(--primary)]/20'
                  : 'border-[var(--border)] bg-[var(--surface-elevated)] hover:border-[var(--text-secondary)]'
              }`}
            >
              <div className="mt-0.5 text-base font-bold text-[var(--primary)] shrink-0">
                {joinMethod === 'direct' ? '●' : '○'}
              </div>
              <div>
                <div className="text-sm font-bold text-[var(--text-primary)]">
                  Join Directly
                </div>
                <div className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                  Request direct verification from PlayPay.
                </div>
              </div>
            </button>
          </div>

          <button
            type="button"
            disabled={!joinMethod || isSubmitting}
            onClick={handleContinue}
            className={`w-full py-3.5 px-4 min-h-[48px] font-bold text-sm rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 select-none touch-manipulation ${
              joinMethod && !isSubmitting
                ? 'bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-fg)] cursor-pointer'
                : 'bg-[var(--surface-elevated)] text-[var(--text-muted)] border border-[var(--border)] cursor-not-allowed opacity-60'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                <span>Loading...</span>
              </>
            ) : (
              <span>Continue</span>
            )}
          </button>
        </div>
      ) : (
        <div className="p-6 space-y-6">
          <button
            type="button"
            onClick={handleBack}
            disabled={isVerifying}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] rounded-lg transition-colors touch-manipulation min-h-[40px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span>Back</span>
          </button>

          {joinMethod === 'team' ? (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-[var(--text-primary)]">
                  Leader Code
                </h2>
                <p className="text-sm text-[var(--text-secondary)] mt-1">
                  Enter the code provided by your Team Leader.
                </p>
              </div>

              <form onSubmit={handleLeaderCodeSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="leaderCodeInput"
                    className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider"
                  >
                    Leader Code
                  </label>
                  <input
                    ref={inputRef}
                    id="leaderCodeInput"
                    type="text"
                    inputMode="text"
                    autoFocus
                    disabled={isVerifying}
                    maxLength={20}
                    value={leaderCode}
                    onChange={handleLeaderCodeChange}
                    onBlur={() => setIsTouched(true)}
                    placeholder="Example: AMIT8421"
                    className={`w-full px-4 py-3.5 min-h-[48px] rounded-xl border text-base font-mono font-medium transition-all bg-[var(--surface-elevated)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none disabled:opacity-60 ${
                      leaderCodeError || verificationError
                        ? 'border-[var(--danger)] focus:ring-2 focus:ring-[var(--danger)]/20'
                        : 'border-[var(--border)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20'
                    }`}
                  />
                  {leaderCodeError && !verificationError && (
                    <p className="text-xs font-medium text-[var(--danger)] mt-1">
                      {leaderCodeError}
                    </p>
                  )}
                  {verificationError && (
                    <p className="text-xs font-medium text-[var(--danger)] mt-1">
                      {verificationError}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!isLeaderCodeValid || isVerifying}
                  className={`w-full py-3.5 px-4 min-h-[48px] font-bold text-sm rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 select-none touch-manipulation ${
                    isLeaderCodeValid && !isVerifying
                      ? 'bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-fg)] cursor-pointer'
                      : 'bg-[var(--surface-elevated)] text-[var(--text-muted)] border border-[var(--border)] cursor-not-allowed opacity-60'
                  }`}
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <span>Continue</span>
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-[var(--text-primary)]">
                  Direct Verification
                </h2>
                <p className="text-sm text-[var(--text-secondary)] mt-1 leading-relaxed">
                  Request direct verification from PlayPay.
                </p>
              </div>

              {verificationError && (
                <div className="p-3.5 rounded-xl bg-[var(--danger)]/10 border border-[var(--danger)]/20 text-xs font-medium text-[var(--danger)]">
                  {verificationError}
                </div>
              )}

              <button
                type="button"
                disabled={isVerifying}
                onClick={handleDirectJoinSubmit}
                className={`w-full py-3.5 px-4 min-h-[48px] font-bold text-sm rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 select-none touch-manipulation ${
                  !isVerifying
                    ? 'bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-fg)] cursor-pointer'
                    : 'bg-[var(--surface-elevated)] text-[var(--text-muted)] border border-[var(--border)] cursor-not-allowed opacity-60'
                }`}
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Request Direct Verification</span>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
