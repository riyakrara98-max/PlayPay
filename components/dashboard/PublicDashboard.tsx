'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  Wallet,
  ArrowRight,
  Shield,
  UploadCloud,
  UserCheck,
  HeadphonesIcon,
  Flame,
} from 'lucide-react';
import { AnnouncementBar } from '@/components/dashboard/AnnouncementBar';
import { TaskGrid } from '@/components/tasks/TaskGrid';
import { useLiveTasks } from '@/hooks/useLiveTasks';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function PublicDashboard() {
  const { tasks } = useLiveTasks();
  const { userProfile } = useAuth();

  const isTeamLeader = userProfile?.memberType === 'team_leader' || userProfile?.role === 'team_leader';

  const liveTasksCount = useMemo(() => {
    return tasks.filter(
      (t) =>
        t.status === 'active' &&
        (t.totalSlots ?? t.maxSubmissions ?? 1) -
          (t.enrolledCount ?? t.currentSubmissions ?? 0) >
          0
    ).length;
  }, [tasks]);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text-primary)] font-body">
      {/* Announcement Ticker */}
      <AnnouncementBar />

      <main className="flex-1 w-full pb-20 md:pb-12">
        {/* Compact Hero Section */}
        <section className="w-full bg-[var(--surface)] border-b border-[var(--border)] py-4 sm:py-6 px-4 sm:px-6 relative overflow-hidden">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Left: Headline & Tagline */}
            <div className="text-center sm:text-left space-y-1">
              <Badge variant="warning" size="sm" className="mb-1">
                <Flame className="w-3.5 h-3.5 fill-current text-[var(--warning)] inline-block mr-1" />
                PlayPay Earning Hub
              </Badge>
              <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tracking-tight font-heading leading-tight">
                Complete App Tasks,{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] to-[var(--success)]">
                  Earn Real Cash
                </span>
              </h1>
              <p className="text-xs text-[var(--text-secondary)] font-medium max-w-md">
                Select a campaign, submit proof, and get paid directly. Fast reviews & verified rewards.
              </p>
            </div>

            {/* Right: Live Counter Pill & Quick Action */}
            <div className="flex items-center gap-4 shrink-0">
              <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-[var(--radius-xl)] px-4 py-2 flex items-center gap-2.5 shadow-2xs">
                <div className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--success)] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[var(--success)]"></span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase block leading-none">
                    Active Tasks
                  </span>
                  <span className="text-base font-bold text-[var(--text-primary)] font-mono tabular-nums leading-tight">
                    {liveTasksCount} Live
                  </span>
                </div>
              </div>

              <Button
                variant="primary"
                size="md"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                onClick={() =>
                  document
                    .getElementById('tasks-section')
                    ?.scrollIntoView({ behavior: 'smooth' })
                }
              >
                Tasks
              </Button>
            </div>
          </div>
        </section>

        {/* Team Leader Portal Enterprise Banner (Visible ONLY for Team Leaders) */}
        {isTeamLeader && (
          <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-4">
            <Card variant="elevated" className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--success)]/15 border border-[var(--success)]/30 text-[var(--success)] flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-[var(--success)]">
                      You are a Team Leader
                    </span>
                    <Badge variant="success" size="sm">
                      {userProfile?.leaderCode || userProfile?.teamLeaderCode || 'ACTIVE'}
                    </Badge>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)] mt-1">
                    Team Management & Custom Reward Portal
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    Manage team members, configure custom task payouts, review proof submissions, and monitor performance analytics.
                  </p>
                </div>
              </div>

              <Button
                variant="success"
                size="md"
                rightIcon={<ArrowRight className="w-4 h-4" />}
                asChild
              >
                <Link href="/team-leader">
                  Open Team Leader Portal
                </Link>
              </Button>
            </Card>
          </section>
        )}

        {/* Above The Fold: Task List Section */}
        <section
          id="tasks-section"
          className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-4 pb-8 scroll-mt-16"
        >
          <TaskGrid />
        </section>

        {/* How It Works (Moved Below Tasks) */}
        <section
          id="how-it-works"
          className="w-full bg-[var(--surface)] border-y border-[var(--border)] py-8 px-4 sm:px-6 mt-6 scroll-mt-16"
        >
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-lg sm:text-xl font-extrabold text-[var(--text-primary)] font-heading">
                How To Start Earning
              </h2>
              <p className="text-xs text-[var(--text-secondary)] font-medium mt-1">
                Earn cash rewards in 3 quick steps
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Step 1 */}
              <Card variant="elevated" className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-wider">
                    Step 1
                  </div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    Enroll Task
                  </h3>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    Reserve your spot in 1 tap
                  </p>
                </div>
              </Card>

              {/* Step 2 */}
              <Card variant="elevated" className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--success)]/10 text-[var(--success)] flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-[var(--success)] uppercase tracking-wider">
                    Step 2
                  </div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    Complete App Task
                  </h3>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    Post review or screenshot
                  </p>
                </div>
              </Card>

              {/* Step 3 */}
              <Card variant="elevated" className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--warning)]/10 text-[var(--warning)] flex items-center justify-center shrink-0">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-[var(--warning)] uppercase tracking-wider">
                    Step 3
                  </div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    Get Paid
                  </h3>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    Fast review & direct payout
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Trust Badges (Compact) */}
        <section className="w-full max-w-5xl mx-auto py-8 px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card variant="default" className="p-4 flex items-center gap-3">
              <Shield className="w-5 h-5 text-[var(--primary)] shrink-0" />
              <span className="font-bold text-[var(--text-primary)] text-xs">
                100% Verified Tasks
              </span>
            </Card>
            <Card variant="default" className="p-4 flex items-center gap-3">
              <UserCheck className="w-5 h-5 text-[var(--success)] shrink-0" />
              <span className="font-bold text-[var(--text-primary)] text-xs">
                Human Review
              </span>
            </Card>
            <Card variant="default" className="p-4 flex items-center gap-3">
              <UploadCloud className="w-5 h-5 text-[var(--accent)] shrink-0" />
              <span className="font-bold text-[var(--text-primary)] text-xs">
                Instant Proof Upload
              </span>
            </Card>
            <Card variant="default" className="p-4 flex items-center gap-3">
              <HeadphonesIcon className="w-5 h-5 text-[var(--warning)] shrink-0" />
              <span className="font-bold text-[var(--text-primary)] text-xs">
                Fast Support
              </span>
            </Card>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full bg-[var(--surface)] border-t border-[var(--border)] py-6 px-4 text-center text-xs text-[var(--text-muted)]">
        <div className="max-w-5xl mx-auto flex flex-col items-center gap-2">
          <span className="text-[var(--text-primary)] font-heading font-extrabold text-sm">
            PlayPay
          </span>
          <p>© {new Date().getFullYear()} PlayPay Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
