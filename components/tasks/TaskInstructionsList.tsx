'use client';

import React from 'react';
import { CheckCircle2, ListOrdered } from 'lucide-react';

interface TaskInstructionsListProps {
  instructions?: string;
  appName?: string;
}

export function TaskInstructionsList({ instructions, appName }: TaskInstructionsListProps) {
  const rawSteps = instructions
    ? instructions
        .split(/\r?\n|\d+\.\s+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
    : [];

  const defaultSteps = [
    `Click the 'Open Play Store App Page' button below to navigate to ${appName || 'the app page'}.`,
    'Install and launch the application on your Android device.',
    'Follow the required task actions (e.g., leave a star rating or write a review as specified).',
    'Take a clear screenshot of your posted review or action.',
    'Upload the screenshot proof below and submit for verification.',
  ];

  const stepsToRender = rawSteps.length > 0 ? rawSteps : defaultSteps;

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 shadow-xs mb-6">
      <div className="flex items-center gap-2 mb-4 text-[var(--text-primary)]">
        <ListOrdered className="w-4 h-4 text-[var(--primary)]" />
        <h3 className="text-sm font-bold">Step-by-Step Task Instructions</h3>
      </div>

      <ol className="space-y-3">
        {stepsToRender.map((step, idx) => (
          <li key={idx} className="flex items-start gap-3 text-xs leading-relaxed text-[var(--text-primary)]">
            <span className="w-5 h-5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
              {idx + 1}
            </span>
            <div className="flex-1 pt-0.5 font-medium">{step}</div>
            <CheckCircle2 className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0 mt-1" />
          </li>
        ))}
      </ol>
    </div>
  );
}
