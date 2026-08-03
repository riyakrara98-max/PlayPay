'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Zap, Shield, Flame, CheckCircle2 } from 'lucide-react';
import { AnnouncementBar } from '@/components/dashboard/AnnouncementBar';
import { TaskGrid } from '@/components/tasks/TaskGrid';

export function PublicDashboard() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-[var(--bg)] text-[var(--text-primary)]">
      {/* Announcement Bar */}
      <AnnouncementBar />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 pb-28 md:pb-12">
        {/* Dashboard Header Hero */}
        <section className="relative overflow-hidden bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-gradient-to-br from-[var(--primary)]/10 to-[var(--accent)]/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-semibold border border-[var(--primary)]/20 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
                <span>PlayPay Live Task Listing</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight font-heading">
                Explore & Complete Tasks
              </h1>

              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Browse real-time partner tasks, track available slots, and earn verified rewards. Updated live directly from Firestore.
              </p>
            </div>

            {/* Live Highlights / Metrics */}
            <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 shrink-0">
              <div className="flex-1 md:flex-initial bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl p-3 min-w-[120px]">
                <div className="flex items-center gap-1.5 text-[var(--success)] text-xs font-semibold mb-1">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Realtime</span>
                </div>
                <div className="text-lg font-bold font-mono text-[var(--text-primary)]">
                  Live
                </div>
                <div className="text-[10px] text-[var(--text-muted)] font-medium">
                  Auto-Sync
                </div>
              </div>

              <div className="flex-1 md:flex-initial bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl p-3 min-w-[120px]">
                <div className="flex items-center gap-1.5 text-[var(--primary)] text-xs font-semibold mb-1">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Verified</span>
                </div>
                <div className="text-lg font-bold font-mono text-[var(--text-primary)]">
                  100%
                </div>
                <div className="text-[10px] text-[var(--text-muted)] font-medium">
                  Protected
                </div>
              </div>

              <div className="flex-1 md:flex-initial bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl p-3 min-w-[120px]">
                <div className="flex items-center gap-1.5 text-[var(--warning)] text-xs font-semibold mb-1">
                  <Flame className="w-3.5 h-3.5" />
                  <span>Rewards</span>
                </div>
                <div className="text-lg font-bold font-mono text-[var(--primary)]">
                  Instant
                </div>
                <div className="text-[10px] text-[var(--text-muted)] font-medium">
                  Tracking
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Live Tasks Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-[var(--text-primary)] font-heading">
                Active Campaigns
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/20">
                <CheckCircle2 className="w-3 h-3" />
                Live
              </span>
            </div>
          </div>

          <TaskGrid />
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-[var(--surface)] border-t border-[var(--border)] py-6 px-4 sm:px-8 text-center text-xs text-[var(--text-muted)]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-[var(--text-primary)] font-heading">
              PlayPay
            </span>
            <span>• Verified Task & Reward Platform</span>
          </div>

          <p>© {new Date().getFullYear()} PlayPay Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
