'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import {
  Users,
  CheckSquare,
  FileCheck,
  CheckCircle2,
  Calendar,
  CreditCard,
  PlusCircle,
  Settings,
  ShieldCheck,
  Wifi,
  WifiOff,
  AlertTriangle,
  Megaphone,
  ArrowRight,
  Clock,
  Sparkles,
  RefreshCw,
  Activity,
  Layers,
  Inbox,
  Lock,
} from 'lucide-react';

import { useAdminDashboardData } from '@/hooks/useAdminDashboardData';
import { PageContainer } from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/layout/SectionHeader';
import { ContentContainer } from '@/components/layout/ContentContainer';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';

export default function AdminDashboardPage() {
  const {
    stats,
    recentActivity,
    siteSettings,
    loading,
    error,
    isOffline,
    refetch,
  } = useAdminDashboardData();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success" size="sm">Approved</Badge>;
      case 'rejected':
        return <Badge variant="danger" size="sm">Rejected</Badge>;
      case 'pending':
      default:
        return <Badge variant="warning" size="sm">Pending</Badge>;
    }
  };

  const formatActivityTime = (isoString?: string | null) => {
    if (!isoString) return 'Just now';
    try {
      const date = new Date(isoString);
      return date.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <PageContainer size="xl" className="pb-16 space-y-8">
      {/* Page Title & Realtime Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <SectionHeader
          title="Admin Control Dashboard"
          subtitle="Real-time telemetry, active offer tasks, pending submission queues, and system status"
        />

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--surface-elevated)] border border-[var(--border)] text-xs font-semibold">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isOffline ? 'bg-rose-400' : 'bg-emerald-400'}`} />
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isOffline ? 'bg-rose-500' : 'bg-emerald-500'}`} />
            </span>
            <span className="text-[var(--text-secondary)] font-mono">
              {isOffline ? 'Offline' : 'Live Firestore Stream'}
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={refetch}
            disabled={loading}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            aria-label="Refresh telemetry data"
          >
            Sync
          </Button>
        </div>
      </div>

      {/* Offline / Error Alert */}
      {(error || isOffline) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-[var(--radius-lg)] flex items-center justify-between gap-4 text-xs text-amber-500"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <div>
              <span className="font-bold">System Status Warning: </span>
              {isOffline
                ? 'Device is currently offline. Realtime updates will resume once connected.'
                : error}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={refetch}>
            Retry Connection
          </Button>
        </motion.div>
      )}

      {/* 6 Realtime Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Stat 1: Total Users */}
        <Card variant="elevated" className="p-5 flex flex-col justify-between relative overflow-hidden group hover:border-[var(--primary)]/40 transition-all">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
              Total Users
            </span>
            <div className="p-2.5 rounded-[var(--radius-md)] bg-blue-500/10 text-blue-500 group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            {loading ? (
              <Skeleton className="h-9 w-24" />
            ) : (
              <div className="text-3xl font-extrabold font-heading text-[var(--text-primary)]">
                <AnimatedCounter value={stats.totalUsers} />
              </div>
            )}
            <p className="text-[11px] text-[var(--text-muted)] mt-1">Verified registered user accounts</p>
          </div>
        </Card>

        {/* Stat 2: Active Tasks */}
        <Card variant="elevated" className="p-5 flex flex-col justify-between relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
              Active Offer Tasks
            </span>
            <div className="p-2.5 rounded-[var(--radius-md)] bg-amber-500/10 text-amber-500 group-hover:scale-105 transition-transform">
              <CheckSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            {loading ? (
              <Skeleton className="h-9 w-24" />
            ) : (
              <div className="text-3xl font-extrabold font-heading text-amber-500">
                <AnimatedCounter value={stats.activeTasks} />
              </div>
            )}
            <p className="text-[11px] text-[var(--text-muted)] mt-1">Currently active tasks in catalogue</p>
          </div>
        </Card>

        {/* Stat 3: Pending Submissions */}
        <Card variant="elevated" className="p-5 flex flex-col justify-between relative overflow-hidden group hover:border-rose-500/40 transition-all">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                Pending Submissions
              </span>
              {stats.pendingSubmissions > 0 && (
                <Badge variant="danger" size="sm" className="animate-pulse">
                  Action Needed
                </Badge>
              )}
            </div>
            <div className="p-2.5 rounded-[var(--radius-md)] bg-rose-500/10 text-rose-500 group-hover:scale-105 transition-transform">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            {loading ? (
              <Skeleton className="h-9 w-24" />
            ) : (
              <div className="text-3xl font-extrabold font-heading text-rose-500">
                <AnimatedCounter value={stats.pendingSubmissions} />
              </div>
            )}
            <p className="text-[11px] text-[var(--text-muted)] mt-1">Submissions awaiting admin review</p>
          </div>
        </Card>

        {/* Stat 4: Approved Tasks */}
        <Card variant="elevated" className="p-5 flex flex-col justify-between relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
              Approved Tasks
            </span>
            <div className="p-2.5 rounded-[var(--radius-md)] bg-emerald-500/10 text-emerald-500 group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            {loading ? (
              <Skeleton className="h-9 w-24" />
            ) : (
              <div className="text-3xl font-extrabold font-heading text-emerald-500">
                <AnimatedCounter value={stats.approvedTasks} />
              </div>
            )}
            <p className="text-[11px] text-[var(--text-muted)] mt-1">Verified completed task proofs</p>
          </div>
        </Card>

        {/* Stat 5: Today's Enrollments */}
        <Card variant="elevated" className="p-5 flex flex-col justify-between relative overflow-hidden group hover:border-cyan-500/40 transition-all">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
              Today&apos;s Enrollments
            </span>
            <div className="p-2.5 rounded-[var(--radius-md)] bg-cyan-500/10 text-cyan-500 group-hover:scale-105 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            {loading ? (
              <Skeleton className="h-9 w-24" />
            ) : (
              <div className="text-3xl font-extrabold font-heading text-cyan-500">
                <AnimatedCounter value={stats.todaysEnrollments} />
              </div>
            )}
            <p className="text-[11px] text-[var(--text-muted)] mt-1">New user enrollments logged today</p>
          </div>
        </Card>

        {/* Stat 6: Eligible Payment Requests */}
        <Card variant="elevated" className="p-5 flex flex-col justify-between relative overflow-hidden group hover:border-violet-500/40 transition-all">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
              Payment Requests
            </span>
            <div className="p-2.5 rounded-[var(--radius-md)] bg-violet-500/10 text-violet-500 group-hover:scale-105 transition-transform">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            {loading ? (
              <Skeleton className="h-9 w-24" />
            ) : (
              <div className="text-3xl font-extrabold font-heading text-violet-500">
                <AnimatedCounter value={stats.eligiblePaymentRequests} />
              </div>
            )}
            <p className="text-[11px] text-[var(--text-muted)] mt-1">Payout claims requested by users</p>
          </div>
        </Card>
      </div>

      {/* Quick Navigation Actions */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <h2 className="text-base font-bold font-heading text-[var(--text-primary)]">
            Admin Management Shortcuts
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/admin/tasks" className="group">
            <Card variant="elevated" isHoverable className="p-5 flex flex-col justify-between h-full hover:border-amber-500/50 transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-[var(--radius-md)] bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <ArrowRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
              </div>
              <div>
                <h3 className="text-sm font-bold font-heading text-[var(--text-primary)] group-hover:text-amber-500 transition-colors">
                  Create Task
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                  Configure new app download, survey, or social tasks for user enrollment.
                </p>
              </div>
            </Card>
          </Link>

          <Link href="/admin/submissions" className="group">
            <Card variant="elevated" isHoverable className="p-5 flex flex-col justify-between h-full hover:border-rose-500/50 transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-[var(--radius-md)] bg-rose-500/10 text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-colors relative">
                  <FileCheck className="w-5 h-5" />
                  {stats.pendingSubmissions > 0 && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-[var(--surface)] animate-ping" />
                  )}
                </div>
                <ArrowRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-rose-500 group-hover:translate-x-1 transition-all" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold font-heading text-[var(--text-primary)] group-hover:text-rose-500 transition-colors">
                    Review Submissions
                  </h3>
                  {stats.pendingSubmissions > 0 && (
                    <Badge variant="danger" size="sm">{stats.pendingSubmissions}</Badge>
                  )}
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                  Inspect user submission proofs, comments, and approve or reject claims.
                </p>
              </div>
            </Card>
          </Link>

          <Link href="/admin/users" className="group">
            <Card variant="elevated" isHoverable className="p-5 flex flex-col justify-between h-full hover:border-blue-500/50 transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-[var(--radius-md)] bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                  <Users className="w-5 h-5" />
                </div>
                <ArrowRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
              </div>
              <div>
                <h3 className="text-sm font-bold font-heading text-[var(--text-primary)] group-hover:text-blue-500 transition-colors">
                  Manage Users
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                  Search user profiles, manage account permissions, and review enrollment logs.
                </p>
              </div>
            </Card>
          </Link>

          <Link href="/admin/settings" className="group">
            <Card variant="elevated" isHoverable className="p-5 flex flex-col justify-between h-full hover:border-slate-500/50 transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-[var(--radius-md)] bg-[var(--surface-elevated)] text-[var(--text-primary)] group-hover:bg-[var(--primary)] group-hover:text-[var(--primary-fg)] transition-colors">
                  <Settings className="w-5 h-5" />
                </div>
                <ArrowRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--primary)] group-hover:translate-x-1 transition-all" />
              </div>
              <div>
                <h3 className="text-sm font-bold font-heading text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
                  Site Settings
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                  Configure maintenance mode, global announcements, and admin contact numbers.
                </p>
              </div>
            </Card>
          </Link>
        </div>
      </div>

      {/* System Status & Announcement Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Health Status Card */}
        <ContentContainer variant="card" className="p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-bold font-heading text-[var(--text-primary)]">
                System Health & Security Status
              </h3>
            </div>
            <Badge variant="outline" size="sm" className="font-mono">
              Live Monitor
            </Badge>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-[var(--radius-md)] bg-[var(--surface-elevated)]/50 border border-[var(--border)]">
              <div className="flex items-center gap-3">
                <Layers className="w-4 h-4 text-[var(--primary)] shrink-0" />
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-[var(--text-primary)]">Maintenance Mode</span>
                  <span className="text-[10px] text-[var(--text-muted)]">Site Settings Configuration</span>
                </div>
              </div>
              {siteSettings?.maintenanceMode ? (
                <Badge variant="warning" size="sm">Active (Restricted)</Badge>
              ) : (
                <Badge variant="success" size="sm">Disabled (Normal Operations)</Badge>
              )}
            </div>

            <div className="flex items-center justify-between p-3 rounded-[var(--radius-md)] bg-[var(--surface-elevated)]/50 border border-[var(--border)]">
              <div className="flex items-center gap-3">
                {isOffline ? (
                  <WifiOff className="w-4 h-4 text-rose-500 shrink-0" />
                ) : (
                  <Wifi className="w-4 h-4 text-emerald-500 shrink-0" />
                )}
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-[var(--text-primary)]">Firestore Realtime Stream</span>
                  <span className="text-[10px] text-[var(--text-muted)]">Database connection status</span>
                </div>
              </div>
              {isOffline ? (
                <Badge variant="danger" size="sm">Disconnected</Badge>
              ) : (
                <Badge variant="success" size="sm">Connected (Online)</Badge>
              )}
            </div>

            <div className="flex items-center justify-between p-3 rounded-[var(--radius-md)] bg-[var(--surface-elevated)]/50 border border-[var(--border)]">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-[var(--text-primary)]">Admin Session Guard</span>
                  <span className="text-[10px] text-[var(--text-muted)]">Role-based access verification</span>
                </div>
              </div>
              <Badge variant="accent" size="sm">Verified Administrator</Badge>
            </div>
          </div>
        </ContentContainer>

        {/* Global Announcement Status Card */}
        <ContentContainer variant="card" className="p-5 flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold font-heading text-[var(--text-primary)]">
                  Global Announcement Status
                </h3>
              </div>
              {siteSettings?.announcement ? (
                <Badge variant="accent" size="sm">Announcement Active</Badge>
              ) : (
                <Badge variant="outline" size="sm">Disabled</Badge>
              )}
            </div>

            <div className="mt-4 p-4 rounded-[var(--radius-md)] bg-[var(--surface-elevated)]/50 border border-[var(--border)] space-y-2">
              <span className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">
                Active Broadcast Text
              </span>
              <p className="text-xs text-[var(--text-primary)] italic leading-relaxed">
                &quot;{siteSettings?.announcement || 'No active announcement broadcast set.'}&quot;
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[var(--border)] text-xs">
            <span className="text-[var(--text-muted)]">Managed via Site Settings</span>
            <Button variant="ghost" size="sm" leftIcon={<Settings className="w-3.5 h-3.5" />} asChild>
              <Link href="/admin/settings">Update Banner</Link>
            </Button>
          </div>
        </ContentContainer>
      </div>

      {/* Recent Activity Live Stream */}
      <ContentContainer variant="card" className="p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[var(--primary)]" />
            <h3 className="text-sm font-bold font-heading text-[var(--text-primary)]">
              Recent Enrollment & Submission Stream (Latest 10)
            </h3>
          </div>

          <Button variant="outline" size="sm" leftIcon={<FileCheck className="w-3.5 h-3.5" />} asChild>
            <Link href="/admin/submissions">View All Queue</Link>
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-[var(--radius-md)]" />
            ))}
          </div>
        ) : recentActivity.length === 0 ? (
          /* Premium Empty State Illustration - Never show plain 'No data' */
          <div className="p-8 text-center flex flex-col items-center justify-center gap-3 bg-[var(--surface-elevated)]/30 border border-dashed border-[var(--border)] rounded-[var(--radius-lg)]">
            <div className="w-12 h-12 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
              <Inbox className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-sm">
              <p className="text-xs font-bold text-[var(--text-primary)]">No Activity Registered Yet</p>
              <p className="text-[11px] text-[var(--text-secondary)]">
                When users enroll in offer tasks or submit completion proofs, realtime event logs will stream here automatically.
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="py-3 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[var(--surface-elevated)]/40 rounded-[var(--radius-md)] transition-colors"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 rounded-[var(--radius-md)] bg-[var(--surface-elevated)] border border-[var(--border)] shrink-0 mt-0.5">
                    <CheckSquare className="w-4 h-4 text-[var(--primary)]" />
                  </div>

                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-[var(--text-primary)] truncate">
                        {activity.userName || activity.userId || 'User'}
                      </span>
                      <span className="text-[11px] text-[var(--text-muted)]">•</span>
                      <span className="text-xs font-medium text-[var(--text-secondary)] truncate">
                        {activity.taskTitle || activity.appName || `Task ID: ${activity.taskId}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)] mt-1">
                      <span>Reward: ₹{activity.rewardAmount ?? activity.reward ?? 0}</span>
                      <span>•</span>
                      <span>Enrolled: {formatActivityTime(activity.enrolledAt)}</span>
                      {activity.submittedAt && (
                        <>
                          <span>•</span>
                          <span className="text-amber-500 font-medium">Submitted</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  {getStatusBadge(activity.status)}
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/admin/submissions">Review</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ContentContainer>
    </PageContainer>
  );
}
