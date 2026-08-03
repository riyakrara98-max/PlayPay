'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, Send, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function ResetPasswordForm() {
  const { resetPassword, loading } = useAuth();

  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email) {
      setFormError('Please enter your account email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword(email);
      setSubmitted(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send password reset email.';
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center text-center gap-4 py-2">
        <div className="w-12 h-12 rounded-full bg-[var(--success)]/10 text-[var(--success)] flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6" />
        </div>

        <div className="flex flex-col gap-1">
          <h3 className="text-base font-bold font-heading text-[var(--text-primary)]">
            Reset Link Sent
          </h3>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            We sent a password reset link to <strong className="text-[var(--text-primary)]">{email}</strong>. Check your inbox to proceed.
          </p>
        </div>

        <Button variant="outline" size="md" className="w-full mt-2" leftIcon={<ArrowLeft className="w-4 h-4" />} asChild>
          <Link href="/login">Back to Sign In</Link>
        </Button>
      </div>
    );
  }

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

      <Button
        type="submit"
        variant="primary"
        size="md"
        className="w-full mt-2"
        isLoading={isSubmitting || loading}
        leftIcon={<Send className="w-4 h-4" />}
      >
        Send Reset Link
      </Button>

      <div className="text-center text-xs text-[var(--text-secondary)] mt-2">
        Remember your password?{' '}
        <Link href="/login" className="font-semibold text-[var(--primary)] hover:underline">
          Back to Sign In
        </Link>
      </div>
    </form>
  );
}
