'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckSquare,
  Search,
  Filter,
  ArrowRight,
  Sparkles,
  Inbox,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { where } from 'firebase/firestore';
import { PageContainer } from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/layout/SectionHeader';
import { EmptyState } from '@/components/ui/empty-state';
import { useAuthContext } from '@/contexts/AuthContext';
import { useRealtimeCollection } from '@/hooks/useRealtimeCollection';
import { EnrollmentDocument, FIRESTORE_COLLECTIONS } from '@/types/firestore';
import { MyTaskCard } from '@/components/tasks/MyTaskCard';
import { TaskGridSkeleton } from '@/components/tasks/TaskCardSkeleton';

type FilterTab = 'all' | 'enrolled' | 'submitted' | 'approved' | 'rejected';

export default function MyTasksPage() {
  const { currentUser, loading: authLoading } = useAuthContext();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const userId = currentUser?.uid;
  const queryConstraints = useMemo(() => {
    if (!userId) return [];
    return [where('userId', '==', userId)];
  }, [userId]);

  const {
    data: enrollments,
    loading: enrollmentsLoading,
  } = useRealtimeCollection<EnrollmentDocument>(
    FIRESTORE_COLLECTIONS.ENROLLMENTS,
    queryConstraints
  );

  const isLoading = authLoading || enrollmentsLoading;

  // Filter & Search Logic + Newest First Sorting
  const filteredEnrollments = useMemo(() => {
    if (!enrollments) return [];

    let list = [...enrollments];

    // Sort newest first
    list.sort((a, b) => {
      const timeA = a.enrolledAt ? new Date(a.enrolledAt).getTime() : 0;
      const timeB = b.enrolledAt ? new Date(b.enrolledAt).getTime() : 0;
      return timeB - timeA;
    });

    // Tab Filter
    if (activeTab === 'enrolled') {
      list = list.filter((e) => e.status === 'pending' && !e.submittedAt);
    } else if (activeTab === 'submitted') {
      list = list.filter((e) => e.status === 'pending' && Boolean(e.submittedAt));
    } else if (activeTab === 'approved') {
      list = list.filter((e) => e.status === 'approved');
    } else if (activeTab === 'rejected') {
      list = list.filter((e) => e.status === 'rejected');
    }

    // Search Query (App Name or Task Title)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (e) =>
          (e.appName && e.appName.toLowerCase().includes(q)) ||
          (e.taskTitle && e.taskTitle.toLowerCase().includes(q))
      );
    }

    return list;
  }, [enrollments, activeTab, searchQuery]);

  // Counts for Badges
  const counts = useMemo(() => {
    if (!enrollments) return { all: 0, enrolled: 0, submitted: 0, approved: 0, rejected: 0 };
    return {
      all: enrollments.length,
      enrolled: enrollments.filter((e) => e.status === 'pending' && !e.submittedAt).length,
      submitted: enrollments.filter((e) => e.status === 'pending' && Boolean(e.submittedAt)).length,
      approved: enrollments.filter((e) => e.status === 'approved').length,
      rejected: enrollments.filter((e) => e.status === 'rejected').length,
    };
  }, [enrollments]);

  return (
    <PageContainer size="xl">
      <SectionHeader
        title="My Tasks"
        subtitle="Track your enrolled tasks, check verification status, resubmit proof, and view earned rewards."
      />

      {/* Main Content Area */}
      {isLoading ? (
        <div className="space-y-6">
          <div className="h-12 bg-[var(--surface)] border border-[var(--border)] rounded-2xl animate-pulse" />
          <TaskGridSkeleton count={6} />
        </div>
      ) : !currentUser ? (
        <EmptyState
          icon={<CheckSquare className="w-8 h-8 text-[var(--warning)]" />}
          title="Sign In Required"
          description="Please sign in to view your enrolled tasks and manage task submissions."
          primaryAction={
            <Link
              href="/login"
              className="px-5 py-2.5 bg-[var(--primary)] text-[var(--primary-fg)] font-semibold text-xs rounded-xl shadow-xs hover:opacity-90 transition-opacity inline-flex items-center gap-2"
            >
              Sign In Now <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
        />
      ) : enrollments.length === 0 ? (
        <div className="py-12 px-4 bg-[var(--surface)] border border-[var(--border)] rounded-3xl text-center flex flex-col items-center justify-center max-w-xl mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center mb-4">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
            No Tasks Enrolled Yet
          </h3>
          <p className="text-sm text-[var(--text-secondary)] max-w-md mb-6 leading-relaxed">
            You haven&apos;t enrolled in any task yet. Browse available tasks on your dashboard, enroll in seconds, and start earning real cash rewards!
          </p>
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-[var(--primary-fg)] font-semibold text-sm rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            Explore Available Tasks <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Controls Bar: Search & Filter Tabs */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-3 shadow-2xs">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              {(
                [
                  { id: 'all', label: 'All', count: counts.all, icon: Inbox },
                  { id: 'enrolled', label: 'Enrolled', count: counts.enrolled, icon: FileCheck },
                  { id: 'submitted', label: 'Submitted', count: counts.submitted, icon: Clock },
                  { id: 'approved', label: 'Approved', count: counts.approved, icon: CheckCircle2 },
                  { id: 'rejected', label: 'Rejected', count: counts.rejected, icon: AlertCircle },
                ] as const
              ).map((tab) => {
                const TabIcon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    aria-label={`Filter by ${tab.label}`}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                      isActive
                        ? 'bg-[var(--primary)] text-[var(--primary-fg)] shadow-2xs'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]'
                    }`}
                  >
                    <TabIcon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-extrabold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-[var(--surface-elevated)] text-[var(--text-muted)]'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search app or task..."
                aria-label="Search by app name or task title"
                className="w-full pl-9 pr-3 py-2 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Cards Grid / Empty Filter State */}
          {filteredEnrollments.length === 0 ? (
            <div className="py-12 px-4 bg-[var(--surface)] border border-[var(--border)] rounded-2xl text-center flex flex-col items-center justify-center">
              <Filter className="w-8 h-8 text-[var(--text-muted)] mb-3" />
              <h4 className="text-base font-bold text-[var(--text-primary)] mb-1">
                No matching tasks found
              </h4>
              <p className="text-xs text-[var(--text-secondary)] max-w-sm mb-4">
                No enrolled tasks match your selected filter or search term. Try resetting your search query or tab filter.
              </p>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('all');
                  setSearchQuery('');
                }}
                className="px-4 py-2 bg-[var(--surface-elevated)] border border-[var(--border)] text-xs font-semibold rounded-xl hover:bg-[var(--primary)] hover:text-[var(--primary-fg)] transition-all"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredEnrollments.map((enrollment) => (
                  <MyTaskCard key={enrollment.id} enrollment={enrollment} />
                ))}
              </div>
            </AnimatePresence>
          )}
        </div>
      )}
    </PageContainer>
  );
}
