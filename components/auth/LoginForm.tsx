'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, LogIn, Chrome } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { mapAuthError } from '@/lib/firebase-errors';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function LoginForm() {
  const router = useRouter();
  const { login, loginWithGoogle, loading } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email || !password) {
      setFormError('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email, password);
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
      const message = err instanceof Error ? err.message : 'Failed to sign in. Please check credentials.';
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
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
        // User closed the popup intentionally - quietly reset state
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
      {formError && (
        <div className="p-3 rounded-[var(--radius-md)] bg-[var(--danger)]/10 border border-[var(--danger)]/20 text-xs text-[var(--danger)]">
          {formError}
        </div>
      )}

      <Input
        label="Email Address"
        type="email"
        placeholder="you@example.com"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        leftIcon={<Mail className="w-4 h-4" />}
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
          required
        />
        <div className="text-right">
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
        leftIcon={<LogIn className="w-4 h-4" />}
      >
        Sign In
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
        disabled={isSubmitting || loading}
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
