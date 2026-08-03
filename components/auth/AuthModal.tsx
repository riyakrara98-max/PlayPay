'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { useAuthModal } from '@/contexts/AuthModalContext';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';

export function AuthModal() {
  const { isOpen, closeAuthModal } = useAuthModal();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeAuthModal}
      title={activeTab === 'login' ? 'Sign In to Enroll' : 'Create an Account'}
      description="You must be signed in to enroll in tasks and start earning verified rewards."
      size="md"
    >
      <div className="space-y-4">
        {/* Toggle buttons */}
        <div className="flex items-center p-1 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'login'
                ? 'bg-[var(--surface)] text-[var(--primary)] shadow-2xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('register')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'register'
                ? 'bg-[var(--surface)] text-[var(--primary)] shadow-2xs'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Register
          </button>
        </div>

        {activeTab === 'login' ? <LoginForm /> : <RegisterForm />}
      </div>
    </Modal>
  );
}
