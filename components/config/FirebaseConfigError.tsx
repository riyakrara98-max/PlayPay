'use client';

import React from 'react';
import { AlertTriangle, Server, Key, HelpCircle } from 'lucide-react';

export function FirebaseConfigError() {
  const missingVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
  ];

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-xl w-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
        {/* Header Icon & Title */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[var(--danger)]/10 text-[var(--danger)] flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Firebase Configuration Error
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Required Firebase environment variables are missing. Demo/local fallback mode has been removed.
            </p>
          </div>
        </div>

        {/* Missing Variables List */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            <Key className="w-4 h-4 text-[var(--primary)]" />
            <span>Missing Environment Variables</span>
          </div>
          <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl p-4 space-y-2 font-mono text-xs">
            {missingVars.map((v) => (
              <div key={v} className="flex items-center justify-between text-[var(--danger)]">
                <span>{v}</span>
                <span className="text-[10px] uppercase font-sans font-medium px-2 py-0.5 rounded bg-[var(--danger)]/10 text-[var(--danger)]">
                  Required
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Steps */}
        <div className="space-y-3 pt-2 border-t border-[var(--border)]">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            <Server className="w-4 h-4 text-[var(--primary)]" />
            <span>How to resolve</span>
          </div>
          <ol className="text-xs sm:text-sm text-[var(--text-secondary)] space-y-2 list-decimal list-inside">
            <li>Configure your Firebase project credentials in your environment variables.</li>
            <li>Add the variables listed above to your environment or <code className="font-mono text-xs bg-[var(--surface-elevated)] px-1.5 py-0.5 rounded text-[var(--text-primary)]">.env.local</code> file.</li>
            <li>Restart the application server to apply changes.</li>
          </ol>
        </div>

        {/* Footer info */}
        <div className="bg-[var(--primary)]/5 border border-[var(--primary)]/20 rounded-xl p-4 flex items-start gap-3 text-xs text-[var(--text-secondary)]">
          <HelpCircle className="w-4 h-4 text-[var(--primary)] shrink-0 mt-0.5" />
          <p>
            The application strictly connects to Firebase Authentication and Firestore. Offline or mock storage is disabled.
          </p>
        </div>
      </div>
    </div>
  );
}
