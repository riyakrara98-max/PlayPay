'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User, UserPlus, Chrome } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { mapAuthError } from '@/lib/firebase-errors';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

export function RegisterForm() {
  const router = useRouter();
  const { register, loginWithGoogle, loading } = useAuth();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!displayName || !email || !password) {
      setFormError('Please fill out all fields.');
      return;
    }

    if (password.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }

    if (!acceptedTerms) {
      setFormError('You must agree to the Terms of Service to register.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register(email, password, displayName);
      toast({
        title: 'Account Created!',
        message: 'Welcome to PlayPay. Your account is ready.',
        variant: 'success',
      });
      const searchParams = new URLSearchParams(window.location.search);
      const redirectToParam = searchParams.get('redirectTo');
      const safeRedirect = (redirectToParam && redirectToParam.startsWith('/') && !redirectToParam.startsWith('//'))
        ? redirectToParam
        : '/dashboard';
      window.location.href = safeRedirect;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to register account.';
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
        title: 'Google Registration Successful',
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
      console.error('[Google Registration Failure]:', err);
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
        label="Full Name"
        type="text"
        placeholder="Alex Rivers"
        autoComplete="name"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        leftIcon={<User className="w-4 h-4" />}
        required
      />

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

      <Input
        label="Password"
        type="password"
        placeholder="At least 6 characters"
        autoComplete="new-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        leftIcon={<Lock className="w-4 h-4" />}
        required
      />

      <Checkbox
        checked={acceptedTerms}
        onChange={setAcceptedTerms}
        label="I agree to the Terms of Service & Privacy Policy"
      />

      <Button
        type="submit"
        variant="primary"
        size="md"
        className="w-full mt-2"
        isLoading={isSubmitting || loading}
        leftIcon={<UserPlus className="w-4 h-4" />}
      >
        Create Account
      </Button>

      <div className="relative my-2 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--border)]" />
        </div>
        <span className="relative z-10 px-3 bg-[var(--surface)] text-[10px] font-mono text-[var(--text-muted)] uppercase">
          Or Register With
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
        Sign up with Google
      </Button>

      <div className="text-center text-xs text-[var(--text-secondary)] mt-4">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-[var(--primary)] hover:underline">
          Sign In
        </Link>
      </div>
    </form>
  );
}
