'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Search,
  Filter,
  Clock,
  User,
  Shield,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  RefreshCw,
  Calendar,
} from 'lucide-react';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { getFirebaseDb, isFirebaseConfigured } from '@/firebase/config';
import { AdminActivityDocument, FIRESTORE_COLLECTIONS } from '@/types/firestore';
import { PageContainer } from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/layout/SectionHeader';
import { ContentContainer } from '@/components/layout/ContentContainer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AdminActivityDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [targetTypeFilter, setTargetTypeFilter] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [pageLimit, setPageLimit] = useState<number>(50);

  // Realtime subscription to adminActivity collection
  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const db = getFirebaseDb();
      const colRef = collection(db, FIRESTORE_COLLECTIONS.ADMIN_ACTIVITY);
      const q = query(colRef, orderBy('createdAt', 'desc'), limit(pageLimit));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const list: AdminActivityDocument[] = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...(docSnap.data() as Omit<AdminActivityDocument, 'id'>),
          }));
          setLogs(list);
          setLoading(false);
        },
        (err) => {
          console.error('[AdminAudit snapshot error]', err);
          setError(err.message);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      queueMicrotask(() => {
        setError(msg);
        setLoading(false);
      });
    }
  }, [pageLimit]);

  // Filter logs by search query, action type, target type, and date range
  const filteredLogs = useMemo(() => {
    let result = [...logs];

    // Search query matching Admin, User, Task, Enrollment, Action, Target ID
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (l) =>
          (l.action && l.action.toLowerCase().includes(q)) ||
          (l.performedByName && l.performedByName.toLowerCase().includes(q)) ||
          (l.performedByEmail && l.performedByEmail.toLowerCase().includes(q)) ||
          (l.performedBy && l.performedBy.toLowerCase().includes(q)) ||
          (l.targetName && l.targetName.toLowerCase().includes(q)) ||
          (l.targetId && l.targetId.toLowerCase().includes(q)) ||
          (l.targetType && l.targetType.toLowerCase().includes(q)) ||
          (l.details && l.details.toLowerCase().includes(q))
      );
    }

    // Action filter
    if (actionFilter !== 'all') {
      result = result.filter((l) => l.action.toLowerCase().includes(actionFilter.toLowerCase()));
    }

    // Target Type filter
    if (targetTypeFilter !== 'all') {
      result = result.filter((l) => (l.targetType || '').toLowerCase() === targetTypeFilter.toLowerCase());
    }

    // Date Range filter
    if (dateRangeFilter !== 'all') {
      const now = Date.now();
      let cutOffMs = 0;
      if (dateRangeFilter === 'today') {
        cutOffMs = 24 * 60 * 60 * 1000;
      } else if (dateRangeFilter === '7days') {
        cutOffMs = 7 * 24 * 60 * 60 * 1000;
      } else if (dateRangeFilter === '30days') {
        cutOffMs = 30 * 24 * 60 * 60 * 1000;
      }

      if (cutOffMs > 0) {
        const threshold = new Date(now - cutOffMs).toISOString();
        result = result.filter((l) => (l.createdAt || l.timestamp || '') >= threshold);
      }
    }

    return result;
  }, [logs, searchQuery, actionFilter, targetTypeFilter, dateRangeFilter]);

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return 'N/A';
    try {
      return new Date(isoString).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const getActionBadgeVariant = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('banned') || act.includes('rejected') || act.includes('deleted')) {
      return 'danger';
    }
    if (act.includes('approved') || act.includes('paid') || act.includes('unbanned') || act.includes('created')) {
      return 'success';
    }
    if (act.includes('update') || act.includes('settings')) {
      return 'accent';
    }
    return 'primary';
  };

  return (
    <PageContainer size="xl">
      <SectionHeader
        title="Admin Audit Trail"
        subtitle="Realtime security log capturing every administrative action, user restriction, and settings update"
      />

      <ContentContainer variant="card" className="space-y-6 p-4 sm:p-6">
        {/* Search & Filter Toolbar */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-[var(--bg-muted)] p-3.5 rounded-xl border border-[var(--border)]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Admin, User, Task, Enrollment, Action, or Target ID..."
              className="pl-9 text-xs w-full bg-[var(--card)]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 min-w-[130px]">
              <Filter className="w-3.5 h-3.5 text-[var(--text-secondary)] shrink-0" />
              <Select
                value={actionFilter}
                onChange={(val) => setActionFilter(val)}
                className="text-xs bg-[var(--card)] py-1 min-w-[140px]"
                options={[
                  { value: 'all', label: 'All Actions' },
                  { value: 'banned', label: 'Banned / Unbanned' },
                  { value: 'task', label: 'Task Actions' },
                  { value: 'approved', label: 'Task Approved' },
                  { value: 'rejected', label: 'Task Rejected' },
                  { value: 'paid', label: 'Payment Processed' },
                  { value: 'settings', label: 'Settings Updated' },
                ]}
              />
            </div>

            <div className="flex items-center gap-1.5 min-w-[120px]">
              <Select
                value={targetTypeFilter}
                onChange={(val) => setTargetTypeFilter(val)}
                className="text-xs bg-[var(--card)] py-1 min-w-[120px]"
                options={[
                  { value: 'all', label: 'All Targets' },
                  { value: 'user', label: 'Target: User' },
                  { value: 'task', label: 'Target: Task' },
                  { value: 'enrollment', label: 'Target: Enrollment' },
                  { value: 'settings', label: 'Target: Settings' },
                ]}
              />
            </div>

            <div className="flex items-center gap-1.5 min-w-[120px]">
              <Calendar className="w-3.5 h-3.5 text-[var(--text-secondary)] shrink-0" />
              <Select
                value={dateRangeFilter}
                onChange={(val) => setDateRangeFilter(val)}
                className="text-xs bg-[var(--card)] py-1 min-w-[120px]"
                options={[
                  { value: 'all', label: 'All Time' },
                  { value: 'today', label: 'Last 24 Hours' },
                  { value: '7days', label: 'Last 7 Days' },
                  { value: '30days', label: 'Last 30 Days' },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Audit Log Timeline */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : filteredLogs.length === 0 ? (
          <EmptyState
            icon={<FileText className="w-8 h-8" />}
            title="No Audit Records Found"
            description={
              searchQuery || actionFilter !== 'all' || targetTypeFilter !== 'all' || dateRangeFilter !== 'all'
                ? 'No audit entries match your specified filter parameters.'
                : 'No administrative activities logged yet.'
            }
          />
        ) : (
          <div className="space-y-3">
            {filteredLogs.map((log) => {
              const isExpanded = expandedLogId === log.id;
              const hasChangedFields = log.changedFields && Object.keys(log.changedFields).length > 0;
              const hasDiff = hasChangedFields || log.before || log.after;

              return (
                <Card
                  key={log.id}
                  className="p-4 border-[var(--border)] bg-[var(--card)] space-y-3 hover:border-[var(--brand)]/50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <Badge variant={getActionBadgeVariant(log.action)} size="sm">
                        {log.action}
                      </Badge>

                      <span className="text-xs font-bold text-[var(--text-primary)]">
                        {log.targetName || log.targetId ? `Target: ${log.targetName || log.targetId}` : ''}
                      </span>
                    </div>

                    <span className="text-[11px] font-mono text-[var(--text-secondary)] flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3 text-[var(--text-secondary)]" />
                      {formatDate(log.createdAt || log.timestamp)}
                    </span>
                  </div>

                  {/* Details Summary */}
                  <div className="text-xs text-[var(--text-secondary)] space-y-1">
                    <p className="text-[var(--text-primary)] font-medium">
                      {log.details || 'No additional notes logged.'}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono opacity-80 pt-1">
                      <span>
                        <strong>Admin:</strong> {log.performedByName || log.performedByEmail || log.performedBy}
                      </span>
                      {log.targetType && (
                        <span>
                          <strong>Type:</strong> <span className="capitalize">{log.targetType}</span>
                        </span>
                      )}
                      {log.targetId && (
                        <span>
                          <strong>Target ID:</strong> {log.targetId.slice(0, 16)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Collapsible Changed Fields / Metadata Diff */}
                  {hasDiff && (
                    <div className="pt-2 border-t border-[var(--border)]">
                      <button
                        type="button"
                        onClick={() => setExpandedLogId(isExpanded ? null : (log.id || null))}
                        className="text-[11px] font-semibold text-[var(--brand)] hover:underline flex items-center gap-1"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-3.5 h-3.5" /> Hide Changed Fields & Diff
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3.5 h-3.5" /> Inspect Changed Fields
                          </>
                        )}
                      </button>

                      {isExpanded && (
                        <div className="pt-2.5 space-y-3 text-[11px]">
                          {hasChangedFields && (
                            <div className="p-3 rounded-lg bg-[var(--bg-muted)] border border-[var(--border)] space-y-2">
                              <span className="font-bold text-[var(--text-primary)] block text-xs">
                                Changed Fields Only (Rule 9):
                              </span>
                              <div className="space-y-1.5 font-mono">
                                {Object.entries(log.changedFields || {}).map(([key, val]) => {
                                  const oldVal = typeof val === 'object' && val !== null && 'old' in val ? (val as { old: unknown }).old : undefined;
                                  const newVal = typeof val === 'object' && val !== null && 'new' in val ? (val as { new: unknown }).new : val;

                                  return (
                                    <div key={key} className="grid grid-cols-1 sm:grid-cols-3 gap-1 bg-[var(--card)] p-2 rounded border border-[var(--border)]">
                                      <span className="font-bold text-[var(--brand)]">{key}:</span>
                                      <span className="text-rose-500 line-through truncate">
                                        Old: {JSON.stringify(oldVal)}
                                      </span>
                                      <span className="text-emerald-500 font-semibold truncate">
                                        New: {JSON.stringify(newVal)}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {(!hasChangedFields && (log.before || log.after)) && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px] font-mono">
                              {log.before && (
                                <div className="p-2.5 rounded-lg bg-[var(--bg-muted)] border border-[var(--border)] overflow-x-auto">
                                  <span className="font-bold text-rose-500 block mb-1">Before:</span>
                                  <pre className="text-[var(--text-secondary)] whitespace-pre-wrap">
                                    {JSON.stringify(log.before, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {log.after && (
                                <div className="p-2.5 rounded-lg bg-[var(--bg-muted)] border border-[var(--border)] overflow-x-auto">
                                  <span className="font-bold text-emerald-500 block mb-1">After:</span>
                                  <pre className="text-[var(--text-secondary)] whitespace-pre-wrap">
                                    {JSON.stringify(log.after, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}

            {/* Pagination Load More */}
            {logs.length >= pageLimit && (
              <div className="pt-4 flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPageLimit((prev) => prev + 50)}
                  className="text-xs"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                  Load Next 50 Audit Logs
                </Button>
              </div>
            )}
          </div>
        )}
      </ContentContainer>
    </PageContainer>
  );
}

