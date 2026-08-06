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
  Briefcase,
  Users2,
  FileBarChart,
  Wallet,
  AlertCircle
} from 'lucide-react';

import { useAdminDashboardData } from '@/hooks/useAdminDashboardData';
import { useAuth } from '@/hooks/useAuth';
import { PageContainer } from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/layout/SectionHeader';
import { ContentContainer } from '@/components/layout/ContentContainer';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { parseDateInput } from '@/utils/formatters';

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
  const { userProfile } = useAuth();

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

  const formatActivityTime = (dateInput?: unknown) => {
    if (!dateInput) return 'Just now';
    try {
      const date = parseDateInput(dateInput);
      if (!date) return 'Just now';
      return date.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Just now';
    }
  };

  const adminName = userProfile?.displayName || 'Administrator';
  
  // Date formatting for welcome section
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  const hasAlerts = isOffline || error || stats.pendingSubmissions > 0 || stats.eligiblePaymentRequests > 0;

  return (
    <PageContainer size="xl" className="pb-16 space-y-6 md:space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-[var(--hairline)]">
        <div className="space-y-1">
          <p className="text-[14px] text-[var(--ink-mute)] font-medium">{today}</p>
          <h1 className="text-[28px] md:text-[32px] font-display font-semibold text-[var(--ink)] tracking-tight">
            Welcome back, {adminName}
          </h1>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-pill)] bg-[var(--canvas)] border border-[var(--hairline)] text-[13px] font-medium shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isOffline ? 'bg-[var(--ruby)]' : 'bg-[var(--success)]'}`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isOffline ? 'bg-[var(--ruby)]' : 'bg-[var(--success)]'}`} />
            </span>
            <span className="text-[var(--ink-secondary)]">
              {isOffline ? 'Offline' : 'System Live'}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            disabled={loading}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          >
            Sync
          </Button>
        </div>
      </div>

      {/* Critical Alerts */}
      {hasAlerts && (
        <section className="space-y-3">
          <h2 className="text-[16px] font-semibold text-[var(--ink)] tracking-tight flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[var(--ruby)]" />
            Critical Alerts
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(error || isOffline) && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-[var(--ruby)]/10 border border-[var(--ruby)]/20 rounded-[var(--radius-lg)] flex items-start gap-3"
              >
                <AlertTriangle className="w-5 h-5 shrink-0 text-[var(--ruby)] mt-0.5" />
                <div className="flex flex-col gap-1.5">
                  <span className="font-semibold text-[14px] text-[var(--ruby)] leading-none">System Connection Issue</span>
                  <p className="text-[13px] text-[var(--ruby)]/80 leading-snug">
                    {isOffline ? 'Device is currently offline. Realtime updates are paused.' : error}
                  </p>
                  <Button variant="outline" size="sm" className="w-fit mt-1 border-[var(--ruby)]/30 text-[var(--ruby)] hover:bg-[var(--ruby)]/10" onClick={refetch}>
                    Retry Connection
                  </Button>
                </div>
              </motion.div>
            )}

            {stats.pendingSubmissions > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-[var(--warning)]/10 border border-[var(--warning)]/20 rounded-[var(--radius-lg)] flex items-start gap-3"
              >
                <FileCheck className="w-5 h-5 shrink-0 text-[var(--warning)] mt-0.5" />
                <div className="flex flex-col gap-1.5">
                  <span className="font-semibold text-[14px] text-[var(--warning)] leading-none">Pending Submissions</span>
                  <p className="text-[13px] text-[var(--warning)]/80 leading-snug">
                    There are {stats.pendingSubmissions} submissions waiting for verification.
                  </p>
                  <Button variant="outline" size="sm" className="w-fit mt-1 border-[var(--warning)]/30 text-[var(--warning)] hover:bg-[var(--warning)]/20" asChild>
                    <Link href="/admin/submissions">Review Now</Link>
                  </Button>
                </div>
              </motion.div>
            )}

            {stats.eligiblePaymentRequests > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-[var(--primary)]/10 border border-[var(--primary)]/20 rounded-[var(--radius-lg)] flex items-start gap-3"
              >
                <Wallet className="w-5 h-5 shrink-0 text-[var(--primary-deep)] mt-0.5" />
                <div className="flex flex-col gap-1.5">
                  <span className="font-semibold text-[14px] text-[var(--primary-deep)] leading-none">Pending Payouts</span>
                  <p className="text-[13px] text-[var(--primary-deep)]/80 leading-snug">
                    {stats.eligiblePaymentRequests} users have requested payouts that need processing.
                  </p>
                  <Button variant="outline" size="sm" className="w-fit mt-1 border-[var(--primary)]/30 text-[var(--primary-deep)] hover:bg-[var(--primary)]/20" asChild>
                    <Link href="/admin/payments">Process Payouts</Link>
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </section>
      )}

      {/* Quick Actions */}
      <section className="space-y-4">
        <h2 className="text-[16px] font-semibold text-[var(--ink)] tracking-tight">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link href="/admin/tasks/create" className="group">
            <div className="flex flex-col items-center justify-center p-4 rounded-[var(--radius-lg)] bg-[var(--canvas)] border border-[var(--hairline)] hover:border-[var(--primary-soft)] hover:shadow-md transition-all gap-2 text-center h-full cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-[var(--canvas-soft)] group-hover:bg-[var(--primary)]/10 text-[var(--ink-secondary)] group-hover:text-[var(--primary)] flex items-center justify-center transition-colors">
                <PlusCircle className="w-5 h-5" />
              </div>
              <span className="text-[13px] font-medium text-[var(--ink)]">Create Task</span>
            </div>
          </Link>

          <Link href="/admin/users" className="group">
            <div className="flex flex-col items-center justify-center p-4 rounded-[var(--radius-lg)] bg-[var(--canvas)] border border-[var(--hairline)] hover:border-[var(--primary-soft)] hover:shadow-md transition-all gap-2 text-center h-full cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-[var(--canvas-soft)] group-hover:bg-[var(--primary)]/10 text-[var(--ink-secondary)] group-hover:text-[var(--primary)] flex items-center justify-center transition-colors">
                <Users2 className="w-5 h-5" />
              </div>
              <span className="text-[13px] font-medium text-[var(--ink)]">Manage Users</span>
            </div>
          </Link>
          
          <Link href="/admin/reports" className="group">
            <div className="flex flex-col items-center justify-center p-4 rounded-[var(--radius-lg)] bg-[var(--canvas)] border border-[var(--hairline)] hover:border-[var(--primary-soft)] hover:shadow-md transition-all gap-2 text-center h-full cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-[var(--canvas-soft)] group-hover:bg-[var(--primary)]/10 text-[var(--ink-secondary)] group-hover:text-[var(--primary)] flex items-center justify-center transition-colors">
                <FileBarChart className="w-5 h-5" />
              </div>
              <span className="text-[13px] font-medium text-[var(--ink)]">View Reports</span>
            </div>
          </Link>

          <Link href="/admin/settings" className="group">
            <div className="flex flex-col items-center justify-center p-4 rounded-[var(--radius-lg)] bg-[var(--canvas)] border border-[var(--hairline)] hover:border-[var(--primary-soft)] hover:shadow-md transition-all gap-2 text-center h-full cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-[var(--canvas-soft)] group-hover:bg-[var(--primary)]/10 text-[var(--ink-secondary)] group-hover:text-[var(--primary)] flex items-center justify-center transition-colors">
                <Settings className="w-5 h-5" />
              </div>
              <span className="text-[13px] font-medium text-[var(--ink)]">Settings</span>
            </div>
          </Link>
        </div>
      </section>

      {/* Platform KPIs */}
      <section className="space-y-4">
        <h2 className="text-[16px] font-semibold text-[var(--ink)] tracking-tight">
          Platform Overview
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-[var(--ink-mute)]" />
              <span className="text-[13px] font-medium text-[var(--ink-mute)]">Total Users</span>
            </div>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-[24px] font-semibold font-tabular text-[var(--ink)]">
                <AnimatedCounter value={stats.totalUsers} />
              </div>
            )}
          </Card>

          <Card className="p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-[var(--ink-mute)]" />
              <span className="text-[13px] font-medium text-[var(--ink-mute)]">New Today</span>
            </div>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-[24px] font-semibold font-tabular text-[var(--ink)]">
                <AnimatedCounter value={stats.todaysEnrollments} />
              </div>
            )}
          </Card>

          <Card className="p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-3">
              <CheckSquare className="w-4 h-4 text-[var(--ink-mute)]" />
              <span className="text-[13px] font-medium text-[var(--ink-mute)]">Active Tasks</span>
            </div>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-[24px] font-semibold font-tabular text-[var(--ink)]">
                <AnimatedCounter value={stats.activeTasks} />
              </div>
            )}
          </Card>

          <Card className="p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-3">
              <FileCheck className="w-4 h-4 text-[var(--ink-mute)]" />
              <span className="text-[13px] font-medium text-[var(--ink-mute)]">Submissions</span>
            </div>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-[24px] font-semibold font-tabular text-[var(--ink)]">
                <AnimatedCounter value={stats.pendingSubmissions} />
              </div>
            )}
          </Card>

          <Card className="p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-[var(--ink-mute)]" />
              <span className="text-[13px] font-medium text-[var(--ink-mute)]">Approved</span>
            </div>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-[24px] font-semibold font-tabular text-[var(--ink)]">
                <AnimatedCounter value={stats.approvedTasks} />
              </div>
            )}
          </Card>

          <Card className="p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-3">
              <Wallet className="w-4 h-4 text-[var(--ink-mute)]" />
              <span className="text-[13px] font-medium text-[var(--ink-mute)]">Payouts</span>
            </div>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-[24px] font-semibold font-tabular text-[var(--ink)]">
                <AnimatedCounter value={stats.eligiblePaymentRequests} />
              </div>
            )}
          </Card>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Live Stream */}
        <ContentContainer variant="card" className="p-6 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-[var(--hairline)]">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[var(--primary)]" />
              <h3 className="text-[16px] font-semibold text-[var(--ink)]">
                Recent Activity
              </h3>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-[13px]">
              <Link href="/admin/submissions">View All</Link>
            </Button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-16 w-full rounded-[var(--radius-md)]" />
              ))}
            </div>
          ) : recentActivity.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center justify-center gap-3 bg-[var(--canvas-soft)] border border-dashed border-[var(--hairline)] rounded-[var(--radius-lg)]">
              <div className="w-12 h-12 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
                <Inbox className="w-6 h-6" />
              </div>
              <div className="space-y-1 max-w-sm">
                <p className="text-[14px] font-medium text-[var(--ink)]">No Recent Activity</p>
                <p className="text-[13px] text-[var(--ink-mute)]">
                  When users enroll in tasks or submit proofs, logs will stream here.
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-[var(--hairline)]">
              {recentActivity.slice(0, 5).map((activity) => (
                <div
                  key={activity.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--canvas-soft)] border border-[var(--hairline)] shrink-0 flex items-center justify-center group-hover:border-[var(--primary-soft)] transition-colors">
                      <CheckSquare className="w-4 h-4 text-[var(--ink-secondary)] group-hover:text-[var(--primary)]" />
                    </div>

                    <div className="flex flex-col min-w-0 justify-center">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[14px] font-medium text-[var(--ink)] truncate">
                          {activity.userName || activity.userId || 'User'}
                        </span>
                        <span className="text-[11px] text-[var(--ink-mute)]">•</span>
                        <span className="text-[13px] text-[var(--ink-secondary)] truncate">
                          {activity.taskTitle || activity.appName || `Task ID: ${activity.taskId}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[12px] text-[var(--ink-mute)] mt-1">
                        <span className="font-tabular">₹{activity.rewardAmount ?? activity.reward ?? 0}</span>
                        <span>•</span>
                        <span>{formatActivityTime(activity.enrolledAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    {getStatusBadge(activity.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ContentContainer>

        {/* System Health */}
        <div className="space-y-6">
          <ContentContainer variant="card" className="p-6">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--hairline)] mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[var(--success)]" />
                <h3 className="text-[16px] font-semibold text-[var(--ink)]">
                  System Health
                </h3>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col">
                  <span className="text-[14px] font-medium text-[var(--ink)]">Maintenance Mode</span>
                  <span className="text-[13px] text-[var(--ink-mute)]">Site Settings Configuration</span>
                </div>
                {siteSettings?.maintenanceMode ? (
                  <Badge variant="warning" size="sm">Active</Badge>
                ) : (
                  <Badge variant="success" size="sm">Disabled</Badge>
                )}
              </div>

              <div className="h-[1px] w-full bg-[var(--hairline)]" />

              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col">
                  <span className="text-[14px] font-medium text-[var(--ink)]">Firestore Stream</span>
                  <span className="text-[13px] text-[var(--ink-mute)]">Database connection</span>
                </div>
                {isOffline ? (
                  <Badge variant="danger" size="sm">Offline</Badge>
                ) : (
                  <Badge variant="success" size="sm">Online</Badge>
                )}
              </div>

              <div className="h-[1px] w-full bg-[var(--hairline)]" />

              <div className="flex items-start justify-between gap-3">
                <div className="flex flex-col">
                  <span className="text-[14px] font-medium text-[var(--ink)]">Global Announcement</span>
                  <span className="text-[13px] text-[var(--ink-mute)]">Active Broadcast Status</span>
                </div>
                {siteSettings?.announcement ? (
                  <Badge variant="accent" size="sm">Active</Badge>
                ) : (
                  <Badge variant="outline" size="sm">Disabled</Badge>
                )}
              </div>
            </div>
          </ContentContainer>
        </div>
      </div>
    </PageContainer>
  );
}
