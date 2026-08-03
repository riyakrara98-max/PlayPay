'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/layout/SectionHeader';
import { ContentContainer } from '@/components/layout/ContentContainer';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useAdminSubmissions, SubmissionsTab } from '@/hooks/useAdminSubmissions';
import { EnrollmentDocument, EnrollmentStatus, PaymentStatus } from '@/types/firestore';
import { SubmissionCard } from '@/components/admin/SubmissionCard';
import { ScreenshotLightbox } from '@/components/admin/ScreenshotLightbox';
import { RejectionModal } from '@/components/admin/RejectionModal';
import { MarkPaidModal } from '@/components/admin/MarkPaidModal';
import { AuditTrailModal } from '@/components/admin/AuditTrailModal';
import { BulkApprovalModal } from '@/components/admin/BulkApprovalModal';

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
    approveSubmission,
    rejectSubmission,
    bulkApprove,
    startProcessingPayment,
    markPaidPayment,
  } = useAdminSubmissions(currentUser?.uid);

  // Multi-select state for bulk approval
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals state
  const [lightboxState, setLightboxState] = useState<{
    isOpen: boolean;
    imageUrl: string;
    title: string;
    subtitle: string;
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

  return (
    <PageContainer size="xl" className="space-y-6">
      {/* Page Header */}
      <SectionHeader
        title="Task Submissions & Payment Queue"
        subtitle="Review proof screenshots, execute atomic approvals or rejections, and manage payout workflows."
      />

      {/* Error banner if present */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-[var(--radius-lg)] text-xs text-rose-500 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Retry Connection
          </Button>
        </div>
      )}

      {/* Main Tabs Navigation */}
      <div className="border-b border-[var(--border)] overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-1 min-w-max pb-px">
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
                className={`flex items-center gap-2 px-4 py-3 font-semibold text-xs border-b-2 transition-all cursor-pointer ${
                  isActive
                    ? 'border-amber-500 text-amber-500 bg-amber-500/5'
                    : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                <span
                  className={`ml-1 px-1.5 py-0.5 text-[10px] rounded-full font-mono font-bold ${
                    isActive
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-[var(--surface-elevated)] text-[var(--text-secondary)] border border-[var(--border)]'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search and Filters Toolbar */}
      <ContentContainer variant="card" className="p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="lg:col-span-4 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <Input
              value={filters.searchQuery}
              onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
              placeholder="Search user, email, task, or app name..."
              className="pl-9 text-xs"
            />
          </div>

          {/* Status Filter */}
          <div className="lg:col-span-2">
            <Select
              value={filters.status}
              onChange={(val) => setFilters({ ...filters, status: val as 'all' | EnrollmentStatus })}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'pending', label: 'Pending' },
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

          {/* Date Range Start */}
          <div className="lg:col-span-2">
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              placeholder="Start Date"
              className="text-xs"
            />
          </div>

          {/* Date Range End */}
          <div className="lg:col-span-2">
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              placeholder="End Date"
              className="text-xs"
            />
          </div>
        </div>

        {/* Filters Active Reset Bar */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-[var(--border)] text-xs">
            <span className="text-[var(--text-secondary)]">
              Showing <strong className="text-[var(--text-primary)]">{filteredSubmissions.length}</strong> matching records
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              className="text-amber-500 hover:text-amber-600"
            >
              Reset Filters
            </Button>
          </div>
        )}
      </ContentContainer>

      {/* Multi-Select Bulk Action Header (Visible on Pending Tab) */}
      {activeTab === 'pending' && filteredSubmissions.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-[var(--radius-lg)] text-xs">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={
                selectedIds.length > 0 &&
                selectedIds.length === filteredSubmissions.filter((s) => s.status === 'pending').length
              }
              onChange={handleSelectAll}
            />
            <span className="font-semibold text-[var(--text-primary)]">
              {selectedIds.length > 0
                ? `${selectedIds.length} items selected for bulk action`
                : 'Select all pending items'}
            </span>
          </div>

          {selectedIds.length > 0 && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsBulkModalOpen(true)}
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Approve Selected ({selectedIds.length})
            </Button>
          )}
        </div>
      )}

      {/* Submissions List / Grid */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-44 w-full rounded-[var(--radius-xl)]" />
          <Skeleton className="h-44 w-full rounded-[var(--radius-xl)]" />
          <Skeleton className="h-44 w-full rounded-[var(--radius-xl)]" />
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <ContentContainer variant="card">
          <EmptyState
            icon={<FileCheck className="w-10 h-10 text-[var(--text-muted)]" />}
            title={
              hasActiveFilters
                ? 'No Submissions Match Your Filters'
                : activeTab === 'pending'
                ? 'No Pending Submissions to Review'
                : activeTab === 'requested_payments'
                ? 'No Payout Requests Pending'
                : 'Queue Empty'
            }
            description={
              hasActiveFilters
                ? 'Try adjusting or resetting your search keywords and date ranges.'
                : 'All user task proofs and payout requests for this tab have been processed.'
            }
            primaryAction={
              hasActiveFilters ? (
                <Button variant="outline" size="sm" onClick={handleClearFilters}>
                  Clear Search Filters
                </Button>
              ) : undefined
            }
          />
        </ContentContainer>
      ) : (
        <div className="space-y-4">
          {filteredSubmissions.map((submission) => (
            <SubmissionCard
              key={submission.id}
              submission={submission}
              isSelected={selectedIds.includes(submission.id)}
              onToggleSelect={handleToggleSelect}
              onOpenLightbox={(imageUrl, title, subtitle) =>
                setLightboxState({ isOpen: true, imageUrl, title, subtitle })
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

      {/* Modals */}
      <ScreenshotLightbox
        isOpen={lightboxState.isOpen}
        onClose={() => setLightboxState({ ...lightboxState, isOpen: false })}
        imageUrl={lightboxState.imageUrl}
        title={lightboxState.title}
        subtitle={lightboxState.subtitle}
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
    </PageContainer>
  );
}
