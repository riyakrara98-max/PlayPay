'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileCheck,
  Search,
  Filter,
  RefreshCw,
  XCircle,
  Clock,
  CheckCircle2,
  CreditCard,
  Layers,
  Calendar,
  IndianRupee,
  ShieldAlert,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/layout/SectionHeader';
import { ContentContainer } from '@/components/layout/ContentContainer';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import dynamic from 'next/dynamic';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useAdminSubmissions, SubmissionsTab } from '@/hooks/useAdminSubmissions';
import { EnrollmentDocument, EnrollmentStatus, PaymentStatus } from '@/types/firestore';
import { SubmissionCard } from '@/components/admin/SubmissionCard';
import { getSafeTime } from '@/utils/formatters';
import { useRouter } from 'next/navigation';

const ScreenshotLightbox = dynamic(
  () => import('@/components/admin/ScreenshotLightbox').then((mod) => mod.ScreenshotLightbox),
  { ssr: false }
);
const RejectionModal = dynamic(
  () => import('@/components/admin/RejectionModal').then((mod) => mod.RejectionModal),
  { ssr: false }
);
const MarkPaidModal = dynamic(
  () => import('@/components/admin/MarkPaidModal').then((mod) => mod.MarkPaidModal),
  { ssr: false }
);
const AuditTrailModal = dynamic(
  () => import('@/components/admin/AuditTrailModal').then((mod) => mod.AuditTrailModal),
  { ssr: false }
);
const BulkApprovalModal = dynamic(
  () => import('@/components/admin/BulkApprovalModal').then((mod) => mod.BulkApprovalModal),
  { ssr: false }
);

export default function AdminSubmissionsPage() {
  const { currentUser } = useAuth();
  const {
    filteredSubmissions,
    loading,
    error,
    activeTab,
    setActiveTab,
    filters,
    setFilters,
    tabCounts,
    hasMore,
    loadMore,
    approveSubmission,
    rejectSubmission,
    bulkApprove,
    startProcessingPayment,
    markPaidPayment,
  } = useAdminSubmissions(currentUser?.uid);

  // Multi-select state for bulk approval
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState<boolean>(false);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Modals state
  const [lightboxState, setLightboxState] = useState<{
    isOpen: boolean;
    imageUrl: string;
    title: string;
    subtitle: string;
    metadata?: EnrollmentDocument['cloudinaryMetadata'];
  }>({
    isOpen: false,
    imageUrl: '',
    title: '',
    subtitle: '',
  });

  const [rejectionTarget, setRejectionTarget] = useState<EnrollmentDocument | null>(null);
  const [markPaidTarget, setMarkPaidTarget] = useState<EnrollmentDocument | null>(null);
  const [auditTarget, setAuditTarget] = useState<EnrollmentDocument | null>(null);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState<boolean>(false);

  // Toggle single item selection
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Toggle select all pending items
  const handleSelectAll = () => {
    const pendingInFiltered = filteredSubmissions
      .filter((s) => s.status === 'pending')
      .map((s) => s.id);

    if (selectedIds.length >= pendingInFiltered.length && pendingInFiltered.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingInFiltered);
    }
  };

  // Clear all search/filters
  const handleClearFilters = () => {
    setFilters({
      searchQuery: '',
      status: 'all',
      paymentStatus: 'all',
      minReward: '',
      maxReward: '',
      startDate: '',
      endDate: '',
    });
  };

  const hasActiveFilters = Boolean(
    filters.searchQuery ||
      filters.status !== 'all' ||
      filters.paymentStatus !== 'all' ||
      filters.minReward ||
      filters.maxReward ||
      filters.startDate ||
      filters.endDate
  );

  const selectedSubmissions = filteredSubmissions.filter((s) =>
    selectedIds.includes(s.id)
  );

  const activeFilterCount = [
    Boolean(filters.searchQuery),
    filters.status !== 'all',
    filters.paymentStatus !== 'all',
    Boolean(filters.minReward || filters.maxReward),
    Boolean(filters.startDate || filters.endDate),
  ].filter(Boolean).length;

  return (
    <PageContainer size="xl" className="space-y-6">
      {/* Page Header */}
      <SectionHeader
        title="Task Submissions & Payment Queue"
        subtitle="Verify proof screenshots, execute atomic approvals/rejections, and process user payouts in seconds."
      />

      {/* Error banner if present */}
      {error && (
        <div className="p-4 bg-[var(--ruby)]/10 border border-[var(--ruby)]/20 rounded-[var(--radius-xl)] text-xs text-[var(--ruby)] flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Retry Connection
          </Button>
        </div>
      )}

      {/* Main Animated Tabs Navigation */}
      <div className="border-b border-[var(--border)] overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1 min-w-max pb-px relative">
          {[
            { id: 'pending' as SubmissionsTab, label: 'Pending Review', count: tabCounts.pending, icon: Clock },
            { id: 'approved' as SubmissionsTab, label: 'Approved', count: tabCounts.approved, icon: CheckCircle2 },
            { id: 'rejected' as SubmissionsTab, label: 'Rejected', count: tabCounts.rejected, icon: XCircle },
            { id: 'requested_payments' as SubmissionsTab, label: 'Requested Payments', count: tabCounts.requested_payments, icon: CreditCard },
            { id: 'processing_payments' as SubmissionsTab, label: 'Processing Payments', count: tabCounts.processing_payments, icon: Clock },
            { id: 'paid' as SubmissionsTab, label: 'Paid', count: tabCounts.paid, icon: CheckCircle2 },
            { id: 'all' as SubmissionsTab, label: 'All Queue', count: tabCounts.all, icon: Layers },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSelectedIds([]);
                }}
                className={`relative flex items-center gap-2 px-4 py-3 font-bold text-xs transition-colors cursor-pointer select-none ${
                  isActive
                    ? 'text-amber-500'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] rounded-t-lg'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-500' : ''}`} />
                <span>{tab.label}</span>
                <span
                  className={`px-2 py-0.5 text-[10px] rounded-full font-mono font-bold ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'bg-[var(--surface-elevated)] text-[var(--text-secondary)] border border-[var(--border)]'
                  }`}
                >
                  {tab.count}
                </span>

                {/* Animated active indicator bar */}
                {isActive && (
                  <motion.div
                    layoutId="activeSubmissionsTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-full"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search and Filters Toolbar - Desktop & Mobile Friendly */}
      <ContentContainer variant="card" className="p-4 space-y-3.5 rounded-[var(--radius-2xl)] border shadow-xs">
        
        {/* Desktop Layout - Hidden on Mobile */}
        <div className="hidden md:grid md:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="lg:col-span-5 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <Input
              value={filters.searchQuery}
              onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
              placeholder="Search user, email, task, or app name..."
              className="pl-9 text-xs"
            />
          </div>

          {/* Status Filter */}
          <div className="lg:col-span-3">
            <Select
              value={filters.status}
              onChange={(val) => setFilters({ ...filters, status: val as 'all' | EnrollmentStatus })}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'pending', label: 'Pending Review' },
                { value: 'approved', label: 'Approved' },
                { value: 'rejected', label: 'Rejected' },
              ]}
            />
          </div>

          {/* Payment Status Filter */}
          <div className="lg:col-span-2">
            <Select
              value={filters.paymentStatus}
              onChange={(val) => setFilters({ ...filters, paymentStatus: val as 'all' | PaymentStatus })}
              options={[
                { value: 'all', label: 'All Payouts' },
                { value: 'pending', label: 'Unclaimed' },
                { value: 'requested', label: 'Requested' },
                { value: 'processing', label: 'Processing' },
                { value: 'paid', label: 'Paid' },
              ]}
            />
          </div>

          {/* Expand Advanced Filters Toggle */}
          <div className="lg:col-span-2 flex items-center justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              leftIcon={<Filter className="w-3.5 h-3.5 text-amber-500" />}
              rightIcon={
                showAdvancedFilters ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )
              }
              className="w-full text-xs font-semibold"
            >
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Filter & Search Controls (Stripe-designed compact layout) */}
        <div className="grid grid-cols-12 gap-3 md:hidden">
          {/* Search Box */}
          <div className="col-span-12 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <Input
              value={filters.searchQuery}
              onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
              placeholder="Search user, task, app..."
              className="pl-9 text-xs h-10 w-full"
            />
          </div>

          {/* Action Buttons (Filter, Sort, Reset) */}
          <div className="col-span-12 flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsMobileFilterOpen(true)}
              leftIcon={<Filter className="w-3.5 h-3.5 text-amber-500" />}
              className="flex-1 text-xs font-bold h-10 border-slate-200"
            >
              Filter
              {activeFilterCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[10px] font-extrabold font-mono">
                  {activeFilterCount}
                </span>
              )}
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
              className="flex-1 text-xs font-bold h-10 border-slate-200 text-slate-700"
            >
              <span>Sort: {sortOrder === 'newest' ? 'Newest' : 'Oldest'}</span>
            </Button>
          </div>
        </div>

        {/* Expandable Advanced Filters Drawer (Desktop Only) */}
        <div className="hidden md:block">
          <AnimatePresence>
            {showAdvancedFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden pt-2 border-t border-[var(--border)]"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                  <div>
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
                      Min Reward (₹)
                    </label>
                    <Input
                      type="number"
                      value={filters.minReward}
                      onChange={(e) => setFilters({ ...filters, minReward: e.target.value })}
                      placeholder="Min reward (e.g. 10)"
                      className="text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
                      Max Reward (₹)
                    </label>
                    <Input
                      type="number"
                      value={filters.maxReward}
                      onChange={(e) => setFilters({ ...filters, maxReward: e.target.value })}
                      placeholder="Max reward (e.g. 500)"
                      className="text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
                      Submitted After Date
                    </label>
                    <Input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                      className="text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block mb-1">
                      Submitted Before Date
                    </label>
                    <Input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                      className="text-xs"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Filters Active Reset Bar */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2.5 border-t border-[var(--border)] text-xs">
            <span className="text-[var(--text-secondary)]">
              Showing <strong className="text-[var(--text-primary)]">{filteredSubmissions.length}</strong> matching records
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              leftIcon={<RotateCcw className="w-3.5 h-3.5 text-amber-500" />}
              className="text-amber-500 hover:text-amber-400 font-semibold"
            >
              Reset Filters
            </Button>
          </div>
        )}
      </ContentContainer>

      {/* Multi-Select Bulk Action Header (Visible on Pending Tab) */}
      {activeTab === 'pending' && filteredSubmissions.length > 0 && (
        <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900 border border-[var(--border)] rounded-[var(--radius-xl)] text-xs shadow-xxs">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={
                selectedIds.length > 0 &&
                selectedIds.length === filteredSubmissions.filter((s) => s.status === 'pending').length
              }
              onChange={handleSelectAll}
            />
            <span className="font-bold text-[var(--text-primary)]">
              {selectedIds.length > 0 ? (
                <span className="flex items-center gap-2">
                  <span className="bg-amber-500 text-slate-950 font-mono text-[10px] px-2 py-0.5 rounded-full font-bold">
                    {selectedIds.length} Selected
                  </span>
                  <button
                    onClick={() => setSelectedIds([])}
                    className="text-amber-500 hover:underline font-bold ml-1.5 cursor-pointer"
                  >
                    Clear Selection
                  </button>
                </span>
              ) : (
                'Select All Pending for Bulk Moderation'
              )}
            </span>
          </div>

          {selectedIds.length > 0 ? (
            <span className="text-[10px] text-[var(--text-secondary)] font-medium italic hidden sm:inline">
              Actions sticky at bottom
            </span>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSelectAll}
              className="text-slate-600 hover:text-slate-900 font-bold text-xs"
            >
              Select All
            </Button>
          )}
        </div>
      )}

      {/* Submissions List / Grid */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-5 border border-slate-100 rounded-3xl space-y-4 animate-pulse bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200" />
                  <div className="space-y-1.5">
                    <div className="h-4 w-28 bg-slate-200 rounded" />
                    <div className="h-3 w-40 bg-slate-200 rounded" />
                  </div>
                </div>
                <div className="h-6 w-16 bg-slate-200 rounded-full" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-2">
                <div className="lg:col-span-5">
                  <div className="w-full aspect-[4/5] bg-slate-200 rounded-2xl" />
                </div>
                <div className="lg:col-span-7 space-y-4">
                  <div className="h-16 w-full bg-slate-200 rounded-2xl" />
                  <div className="h-10 w-full bg-slate-200 rounded-xl" />
                  <div className="h-20 w-full bg-slate-200 rounded-xl" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <ContentContainer variant="card" className="p-8 sm:p-12 rounded-[var(--radius-2xl)] border border-slate-150 text-center max-w-xl mx-auto my-6 shadow-xxs bg-white">
          <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-500/20 text-amber-500">
            <FileCheck className="w-8 h-8" />
          </div>
          <h3 className="text-base font-extrabold text-[var(--text-primary)]">
            {hasActiveFilters
              ? 'No Submissions Match Your Filters'
              : activeTab === 'pending'
              ? 'No Pending Submissions'
              : activeTab === 'requested_payments'
              ? 'All Payout Requests Settled'
              : 'Submissions Queue Empty'}
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-2 mb-6 max-w-xs mx-auto leading-relaxed">
            {hasActiveFilters
              ? 'Try clearing search terms or date ranges to view other records.'
              : activeTab === 'pending'
              ? 'Fantastic work! All pending user screenshots and task submissions are approved.'
              : activeTab === 'requested_payments'
              ? 'There are no unclaimed payout requests right now.'
              : 'All user task proofs for this category have been processed.'}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
            {hasActiveFilters ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                leftIcon={<RotateCcw className="w-4 h-4" />}
                className="w-full sm:w-auto h-10 rounded-xl"
              >
                Clear All Filters
              </Button>
            ) : activeTab === 'pending' ? (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => router.push('/admin/tasks')}
                  className="w-full sm:w-auto h-10 rounded-xl bg-slate-900 text-white font-bold"
                >
                  Create New Task
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('requested_payments')}
                  className="w-full sm:w-auto h-10 rounded-xl font-bold"
                >
                  Review Pending Payments
                </Button>
              </>
            ) : activeTab === 'requested_payments' ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setActiveTab('pending')}
                className="w-full sm:w-auto h-10 rounded-xl bg-slate-900 text-white font-bold"
              >
                Moderate Pending Proofs
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/admin/dashboard')}
                className="w-full sm:w-auto h-10 rounded-xl font-bold"
              >
                Go to Dashboard
              </Button>
            )}
          </div>
        </ContentContainer>
      ) : (
        <div className="space-y-4">
          {[...filteredSubmissions]
            .sort((a, b) => {
              const timeA = getSafeTime(a.submittedAt || a.enrolledAt);
              const timeB = getSafeTime(b.submittedAt || b.enrolledAt);
              return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
            })
            .map((submission) => (
              <SubmissionCard
                key={submission.id}
                submission={submission}
                isSelected={selectedIds.includes(submission.id)}
                onToggleSelect={handleToggleSelect}
                onOpenLightbox={(imageUrl, title, subtitle, metadata) =>
                  setLightboxState({ isOpen: true, imageUrl, title, subtitle, metadata })
                }
                onApprove={(sub) => approveSubmission(sub.id)}
                onReject={(sub) => setRejectionTarget(sub)}
                onStartProcessing={(sub) => startProcessingPayment(sub.id)}
                onMarkPaid={(sub) => setMarkPaidTarget(sub)}
                onViewAudit={(sub) => setAuditTarget(sub)}
              />
            ))}
        </div>
      )}

      {hasMore && !loading && (
        <div className="flex justify-center mt-6">
          <Button
            onClick={loadMore}
            variant="outline"
            className="px-6 py-2 rounded-xl text-sm font-medium border-emerald-500/30 hover:bg-emerald-500/10 transition-colors"
          >
            Load More Submissions
          </Button>
        </div>
      )}

      {/* Modals */}
      <ScreenshotLightbox
        isOpen={lightboxState.isOpen}
        onClose={() => setLightboxState({ ...lightboxState, isOpen: false })}
        imageUrl={lightboxState.imageUrl}
        title={lightboxState.title}
        subtitle={lightboxState.subtitle}
        metadata={lightboxState.metadata}
      />

      <RejectionModal
        isOpen={Boolean(rejectionTarget)}
        onClose={() => setRejectionTarget(null)}
        submission={rejectionTarget}
        onConfirmReject={(reason) => {
          if (rejectionTarget) {
            return rejectSubmission(rejectionTarget.id, reason);
          }
          return Promise.resolve();
        }}
      />

      <MarkPaidModal
        isOpen={Boolean(markPaidTarget)}
        onClose={() => setMarkPaidTarget(null)}
        submission={markPaidTarget}
        onConfirmMarkPaid={(reference) => {
          if (markPaidTarget) {
            return markPaidPayment(markPaidTarget.id, reference);
          }
          return Promise.resolve();
        }}
      />

      <AuditTrailModal
        isOpen={Boolean(auditTarget)}
        onClose={() => setAuditTarget(null)}
        submission={auditTarget}
      />

      <BulkApprovalModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        selectedSubmissions={selectedSubmissions}
        onConfirmBulkApprove={async (ids, onProgress) => {
          await bulkApprove(ids, onProgress);
          setSelectedIds([]);
        }}
      />
      {/* Sticky Bulk Action Control Bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-0 left-0 right-0 bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-slate-800 text-white py-4 px-4 sm:px-6 z-40 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] pb-[calc(16px+env(safe-area-inset-bottom))]"
          >
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-slate-950 font-mono">
                  {selectedIds.length}
                </span>
                <span className="text-xs font-bold text-slate-200">
                  Selected <span className="hidden sm:inline">for Bulk Actions</span>
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setSelectedIds([])}
                  className="text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-bold h-10 px-3 rounded-xl transition-all"
                >
                  Clear <span className="hidden sm:inline">Selection</span>
                </Button>
                
                <Button
                  type="button"
                  onClick={() => setIsBulkModalOpen(true)}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold h-10 px-4 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all border-none"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approve ({selectedIds.length})
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Filter Bottom Sheet */}
      <AnimatePresence>
        {isMobileFilterOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileFilterOpen(false)}
              className="fixed inset-0 bg-slate-950/60 z-50 backdrop-blur-xs md:hidden"
            />
            {/* Bottom Sheet Panel */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-150 dark:border-slate-800 rounded-t-[28px] z-50 max-h-[85vh] overflow-y-auto shadow-[0_-10px_40px_rgba(0,0,0,0.15)] pb-[calc(24px+env(safe-area-inset-bottom))] md:hidden"
            >
              {/* Drag Handle & Header */}
              <div className="sticky top-0 bg-white dark:bg-slate-900 pt-3 pb-2 px-6 flex flex-col items-center border-b border-slate-50 dark:border-slate-800/50">
                <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mb-3" />
                <div className="w-full flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-[var(--text-primary)]">Filter Submissions</h3>
                  <button
                    onClick={() => setIsMobileFilterOpen(false)}
                    className="text-xs font-bold text-amber-500 hover:text-amber-600"
                  >
                    Done
                  </button>
                </div>
              </div>

              {/* Filters Form Content */}
              <div className="p-6 space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">
                    Review Status
                  </label>
                  <Select
                    value={filters.status}
                    onChange={(val) => setFilters({ ...filters, status: val as 'all' | EnrollmentStatus })}
                    options={[
                      { value: 'all', label: 'All Statuses' },
                      { value: 'pending', label: 'Pending Review' },
                      { value: 'approved', label: 'Approved' },
                      { value: 'rejected', label: 'Rejected' },
                    ]}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">
                    Payout Status
                  </label>
                  <Select
                    value={filters.paymentStatus}
                    onChange={(val) => setFilters({ ...filters, paymentStatus: val as 'all' | PaymentStatus })}
                    options={[
                      { value: 'all', label: 'All Payouts' },
                      { value: 'pending', label: 'Unclaimed' },
                      { value: 'requested', label: 'Requested' },
                      { value: 'processing', label: 'Processing' },
                      { value: 'paid', label: 'Paid' },
                    ]}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">
                      Min Reward (₹)
                    </label>
                    <Input
                      type="number"
                      value={filters.minReward}
                      onChange={(e) => setFilters({ ...filters, minReward: e.target.value })}
                      placeholder="e.g. 10"
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">
                      Max Reward (₹)
                    </label>
                    <Input
                      type="number"
                      value={filters.maxReward}
                      onChange={(e) => setFilters({ ...filters, maxReward: e.target.value })}
                      placeholder="e.g. 500"
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">
                      From Date
                    </label>
                    <Input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">
                      To Date
                    </label>
                    <Input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                      className="text-xs"
                    />
                  </div>
                </div>

                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleClearFilters();
                      setIsMobileFilterOpen(false);
                    }}
                    className="w-full text-xs font-bold border-amber-500/30 text-amber-500 hover:bg-amber-500/10 mt-2"
                  >
                    Reset All Filters
                  </Button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </PageContainer>
  );
}

