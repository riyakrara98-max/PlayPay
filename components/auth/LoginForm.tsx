'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Mail, Lock, LogIn, Chrome, ShieldAlert, Clock, AlertTriangle } from 'lucide-react';
import { fetchSignInMethodsForEmail } from 'firebase/auth';
import { getFirebaseAuth } from '@/firebase/config';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { mapAuthError } from '@/lib/firebase-errors';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 10 * 60 * 1000; // 10 minutes

export function LoginForm() {
  const { login, loginWithGoogle, loading } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);

  const isLockedOut = Boolean(lockedUntil && secondsRemaining > 0);

  // Load and sync lockout status from localStorage whenever email changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setFailedAttempts(0);
      setLockedUntil(null);
      setSecondsRemaining(0);
      return;
    }

    const lockKey = `playpay_lockout_${cleanEmail}`;
    try {
      const stored = localStorage.getItem(lockKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        const now = Date.now();
        if (parsed.lockedUntil && parsed.lockedUntil > now) {
          setLockedUntil(parsed.lockedUntil);
          setFailedAttempts(parsed.attempts || MAX_FAILED_ATTEMPTS);
          setSecondsRemaining(Math.ceil((parsed.lockedUntil - now) / 1000));
        } else {
          setLockedUntil(null);
          setFailedAttempts(parsed.attempts || 0);
          setSecondsRemaining(0);
        }
      } else {
        setLockedUntil(null);
        setFailedAttempts(0);
        setSecondsRemaining(0);
      }
    } catch (err) {
      console.error('Error reading lockout status:', err);
    }
  }, [email]);

  // Live countdown timer for lockout
  useEffect(() => {
    if (!lockedUntil) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.ceil((lockedUntil - now) / 1000);
      if (diff <= 0) {
        clearInterval(interval);
        setLockedUntil(null);
        setSecondsRemaining(0);
        setFailedAttempts(0);
        const cleanEmail = email.trim().toLowerCase();
        if (cleanEmail && typeof window !== 'undefined') {
          localStorage.removeItem(`playpay_lockout_${cleanEmail}`);
        }
        toast({
          title: 'Login Unlocked',
          message: 'The 10-minute lockout period has ended. You may now attempt to sign in again.',
          variant: 'info',
        });
      } else {
        setSecondsRemaining(diff);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lockedUntil, email, toast]);

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setFormError('Please enter both email address and password.');
      return;
    }

    // Double check lockout
    const lockKey = `playpay_lockout_${cleanEmail}`;
    const now = Date.now();
    let currentLockedUntil = lockedUntil;

    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(lockKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.lockedUntil && parsed.lockedUntil > now) {
            currentLockedUntil = parsed.lockedUntil;
            setLockedUntil(parsed.lockedUntil);
            setSecondsRemaining(Math.ceil((parsed.lockedUntil - now) / 1000));
          }
        }
      } catch (err) {
        console.error('Error checking lockout:', err);
      }
    }

    if (currentLockedUntil && currentLockedUntil > now) {
      setFormError('🔒 Login disabled due to 5 failed attempts. Please wait for the lockout timer to expire.');
      return;
    }

    setIsSubmitting(true);

    try {
      await login(cleanEmail, password);

      // On successful sign in, clear lockout tracking
      if (typeof window !== 'undefined') {
        localStorage.removeItem(lockKey);
      }
      setFailedAttempts(0);
      setLockedUntil(null);

      toast({
        title: 'Welcome Back!',
        message: 'You have successfully signed in.',
        variant: 'success',
      });

      const searchParams = new URLSearchParams(window.location.search);
      const redirectToParam = searchParams.get('redirectTo');
      const safeRedirect = (redirectToParam && redirectToParam.startsWith('/') && !redirectToParam.startsWith('//'))
        ? redirectToParam
        : '/dashboard';
      window.location.href = safeRedirect;
    } catch (err: unknown) {
      const newAttemptCount = failedAttempts + 1;
      setFailedAttempts(newAttemptCount);

      if (newAttemptCount >= MAX_FAILED_ATTEMPTS) {
        const lockoutTime = Date.now() + LOCKOUT_MS;
        setLockedUntil(lockoutTime);
        setSecondsRemaining(600);
        if (typeof window !== 'undefined') {
          localStorage.setItem(lockKey, JSON.stringify({
            attempts: newAttemptCount,
            lockedUntil: lockoutTime,
          }));
        }
        setFormError('🔒 5 failed attempts reached! Sign-in is disabled for 10 minutes for your security.');
        toast({
          title: 'Sign-In Temporarily Disabled',
          message: '5 failed login attempts reached. Login disabled for 10 minutes.',
          variant: 'error',
        });
        return;
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem(lockKey, JSON.stringify({
          attempts: newAttemptCount,
          lockedUntil: 0,
        }));
      }

      // Determine exact error reason
      let exactMsg = '';
      const authErr = err as { code?: string; message?: string };
      const code = authErr?.code || '';

      if (code === 'auth/user-not-found') {
        exactMsg = '❌ Account Not Registered: No user found with this email address. Please click "Create an Account" to register.';
      } else if (code === 'auth/wrong-password') {
        exactMsg = '❌ Incorrect Password: The password you entered is incorrect. Please check your password and try again.';
      } else if (code === 'auth/user-disabled') {
        exactMsg = '❌ Account Disabled: This user account has been disabled by admin.';
      } else {
        // Fallback or probe with fetchSignInMethodsForEmail
        try {
          const authInstance = getFirebaseAuth();
          const methods = await fetchSignInMethodsForEmail(authInstance, cleanEmail);
          if (methods.length === 0) {
            exactMsg = '❌ Account Not Registered: This email address is not registered on PlayPay. Please register first.';
          } else if (methods.includes('google.com') && !methods.includes('password')) {
            exactMsg = 'ℹ️ Google Account: This email is registered via Google Sign-In. Please click "Sign in with Google" below.';
          } else {
            exactMsg = '❌ Incorrect Password: The password you entered is incorrect. Please verify your password.';
          }
        } catch {
          exactMsg = mapAuthError(err);
        }
      }

      const attemptsRemaining = MAX_FAILED_ATTEMPTS - newAttemptCount;
      setFormError(`${exactMsg} (${newAttemptCount}/${MAX_FAILED_ATTEMPTS} failed attempt${newAttemptCount > 1 ? 's' : ''}. ${attemptsRemaining} attempt${attemptsRemaining > 1 ? 's' : ''} left before 10 min lockout.)`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (isLockedOut) {
      setFormError('🔒 Sign-in is locked due to 5 failed attempts. Please wait for the lockout timer to expire.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      await loginWithGoogle();
      toast({
        title: 'Google Sign-In Successful',
        message: 'Welcome to PlayPay!',
        variant: 'success',
      });
      const searchParams = new URLSearchParams(window.location.search);
      const redirectToParam = searchParams.get('redirectTo');
      const safeRedirect = (redirectToParam && redirectToParam.startsWith('/') && !redirectToParam.startsWith('//'))
        ? redirectToParam
        : '/dashboard';
      window.location.href = safeRedirect;
    } catch (err: unknown) {
      const isPopupClosed =
        (err as { code?: string })?.code === 'auth/popup-closed-by-user' ||
        (err instanceof Error && err.message.includes('popup-closed-by-user'));

      if (isPopupClosed) {
        return;
      }

      console.error('[Google Sign-In Failure]:', err);
      const message = mapAuthError(err);
      setFormError(message);
      toast({
        title: 'Google Sign-In Error',
        message,
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
      {/* Lockout Banner or Error Alert */}
      {isLockedOut ? (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex flex-col gap-2.5 shadow-sm">
          <div className="flex items-center gap-2 font-bold text-sm text-rose-500">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span>Sign-In Disabled (5 Failed Attempts)</span>
          </div>
          <p className="text-xs text-rose-300/90 leading-relaxed">
            You entered incorrect sign-in details 5 consecutive times. For security, sign-in has been locked for 10 minutes.
          </p>
          <div className="mt-1 flex items-center justify-between bg-rose-950/50 px-3.5 py-2.5 rounded-lg border border-rose-500/30">
            <span className="text-xs text-rose-200 font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 animate-pulse text-rose-400" />
              Lockout Countdown:
            </span>
            <span className="font-mono text-base font-bold text-rose-400 tracking-wider">
              {formatTime(secondsRemaining)}
            </span>
          </div>
        </div>
      ) : formError ? (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-400 flex items-start gap-2.5 leading-relaxed">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
          <div className="flex-1 font-medium">{formError}</div>
        </div>
      ) : null}

      <Input
        label="Email Address"
        type="email"
        placeholder="you@example.com"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        leftIcon={<Mail className="w-4 h-4" />}
        disabled={isLockedOut || isSubmitting || loading}
        required
      />

      <div className="flex flex-col gap-1">
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<Lock className="w-4 h-4" />}
          disabled={isLockedOut || isSubmitting || loading}
          required
        />
        <div className="text-right mt-1">
          <Link
            href="/reset-password"
            className="text-xs font-medium text-[var(--primary)] hover:underline"
          >
            Forgot Password?
          </Link>
        </div>
      </div>

      <Button
        type="submit"
        variant="primary"
        size="md"
        className="w-full mt-2"
        isLoading={isSubmitting || loading}
        disabled={isLockedOut || isSubmitting || loading}
        leftIcon={<LogIn className="w-4 h-4" />}
      >
        {isLockedOut ? `Locked (${formatTime(secondsRemaining)})` : 'Sign In'}
      </Button>

      <div className="relative my-2 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--border)]" />
        </div>
        <span className="relative z-10 px-3 bg-[var(--surface)] text-[10px] font-mono text-[var(--text-muted)] uppercase">
          Or Continue With
        </span>
      </div>

      <Button
        type="button"
        variant="outline"
        size="md"
        className="w-full"
        onClick={handleGoogleLogin}
        disabled={isLockedOut || isSubmitting || loading}
        leftIcon={<Chrome className="w-4 h-4 text-rose-500" />}
      >
        Sign in with Google
      </Button>

      <div className="text-center text-xs text-[var(--text-secondary)] mt-4">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-semibold text-[var(--primary)] hover:underline">
          Create an Account
        </Link>
      </div>
    </form>
  );
}
