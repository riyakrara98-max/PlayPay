'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  collection,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import {
  CheckSquare,
  PlusCircle,
  Search,
  Filter,
  ArrowUpDown,
  Smartphone,
  Eye,
  Edit,
  Play,
  Pause,
  Trash2,
  Archive,
  ShieldAlert,
  AlertCircle,
  Users,
  Coins,
  Clock,
  MessageSquare,
  RefreshCw,
  X,
  CheckCircle2,
} from 'lucide-react';

import { getFirebaseDb, isFirebaseConfigured } from '@/firebase/config';
import {
  TaskDocument,
  TaskStatus,
  FIRESTORE_COLLECTIONS,
} from '@/types/firestore';
import { useAuth } from '@/hooks/useAuth';
import { PageContainer } from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/layout/SectionHeader';
import { ContentContainer } from '@/components/layout/ContentContainer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Modal } from '@/components/ui/modal';

export default function AdminTaskManagerPage() {
  const { userProfile } = useAuth();
  const isAdmin = userProfile?.role === 'admin';

  // Data States
  const [tasks, setTasks] = useState<TaskDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Sort States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'reward' | 'slots'>('newest');

  // Modal States
  const [previewTask, setPreviewTask] = useState<TaskDocument | null>(null);
  const [deleteTargetTask, setDeleteTargetTask] = useState<TaskDocument | null>(null);
  const [hasEnrollmentsCheck, setHasEnrollmentsCheck] = useState<boolean | null>(null);
  const [isCheckingEnrollments, setIsCheckingEnrollments] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Realtime Firestore Listener for All Tasks
  useEffect(() => {
    if (!isAdmin || !isFirebaseConfigured()) {
      queueMicrotask(() => {
        setLoading(false);
      });
      return;
    }

    let unsubscribe = () => {};

    try {
      const db = getFirebaseDb();
      const colRef = collection(db, FIRESTORE_COLLECTIONS.TASKS);

      unsubscribe = onSnapshot(
        colRef,
        (snap) => {
          const list: TaskDocument[] = snap.docs.map((docSnap) => ({
            id: docSnap.id,
            ...(docSnap.data() as Omit<TaskDocument, 'id'>),
          }));
          setTasks(list);
          setLoading(false);
        },
        (err) => {
          console.error('[Admin Tasks Error]', err);
          setError('Failed to sync tasks from Firestore.');
          setLoading(false);
        }
      );
    } catch (err: unknown) {
      console.error('[Admin Tasks Listener Error]', err);
      const msg = err instanceof Error ? err.message : 'Error connecting to Firestore';
      queueMicrotask(() => {
        setError(msg);
        setLoading(false);
      });
    }

    return () => unsubscribe();
  }, [isAdmin]);

  // Compute expired status automatically
  const processedTasks = useMemo(() => {
    const currentDate = new Date();
    return tasks.map((t) => {
      let isExpired = false;
      if (t.expiresAt) {
        try {
          if (new Date(t.expiresAt) < currentDate) {
            isExpired = true;
          }
        } catch {
          // ignore
        }
      }

      let effectiveStatus = t.status;
      if (isExpired && t.status !== 'completed') {
        effectiveStatus = 'paused'; // Represent expired status
      }

      return {
        ...t,
        computedStatus: effectiveStatus,
        isExpired,
      };
    });
  }, [tasks]);

  // Filter & Search Logic
  const filteredTasks = useMemo(() => {
    return processedTasks
      .filter((task) => {
        // Status Filter
        if (statusFilter === 'active') {
          if (task.status !== 'active' || task.isExpired) return false;
        } else if (statusFilter === 'inactive') {
          if (task.status !== 'paused' && task.status !== 'draft') return false;
        } else if (statusFilter === 'completed') {
          if (task.status !== 'completed') return false;
        } else if (statusFilter === 'expired') {
          if (!task.isExpired) return false;
        }

        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = (task.title || '').toLowerCase().includes(q);
          const matchAppName = (task.appName || '').toLowerCase().includes(q);
          if (!matchTitle && !matchAppName) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'oldest') {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (sortBy === 'reward') {
          return (b.rewardAmount || 0) - (a.rewardAmount || 0);
        }
        if (sortBy === 'slots') {
          return (b.totalSlots || 0) - (a.totalSlots || 0);
        }
        // Default: newest
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [processedTasks, statusFilter, searchQuery, sortBy]);

  // Quick Action: Toggle Status (Activate / Pause)
  const handleToggleStatus = async (task: TaskDocument, newStatus: TaskStatus) => {
    try {
      const db = getFirebaseDb();
      const docRef = doc(db, FIRESTORE_COLLECTIONS.TASKS, task.id);
      await updateDoc(docRef, {
        status: newStatus,
        updatedAt: new Date().toISOString(),
        updatedBy: userProfile?.uid || 'admin',
      });
      setActionSuccessMsg(`Task "${task.title}" status changed to ${newStatus}.`);
      setTimeout(() => setActionSuccessMsg(null), 3000);
    } catch (err: unknown) {
      console.error('[Toggle Status Error]', err);
      setError('Failed to update task status.');
    }
  };

  // Open Delete Safety Confirmation Modal
  const handleOpenDeleteModal = async (task: TaskDocument) => {
    setDeleteTargetTask(task);
    setIsCheckingEnrollments(true);
    setHasEnrollmentsCheck(null);

    const enrolledCount = task.enrolledCount ?? task.currentSubmissions ?? 0;
    if (enrolledCount > 0) {
      setHasEnrollmentsCheck(true);
      setIsCheckingEnrollments(false);
      return;
    }

    // Verify in Firestore enrollments collection
    try {
      const db = getFirebaseDb();
      const q = query(
        collection(db, FIRESTORE_COLLECTIONS.ENROLLMENTS),
        where('taskId', '==', task.id)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        setHasEnrollmentsCheck(true);
      } else {
        setHasEnrollmentsCheck(false);
      }
    } catch {
      setHasEnrollmentsCheck(enrolledCount > 0);
    } finally {
      setIsCheckingEnrollments(false);
    }
  };

  // Execute Hard Delete (Only allowed when no enrollments exist)
  const handleExecuteDelete = async () => {
    if (!deleteTargetTask || hasEnrollmentsCheck) return;

    setIsDeleting(true);
    try {
      const db = getFirebaseDb();
      await deleteDoc(doc(db, FIRESTORE_COLLECTIONS.TASKS, deleteTargetTask.id));
      setActionSuccessMsg(`Task "${deleteTargetTask.title}" permanently deleted.`);
      setTimeout(() => setActionSuccessMsg(null), 3000);
      setDeleteTargetTask(null);
    } catch (err: unknown) {
      console.error('[Delete Task Error]', err);
      setError('Failed to delete task.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Execute Soft Delete / Deactivate (For tasks with enrollments)
  const handleExecuteSoftDelete = async () => {
    if (!deleteTargetTask) return;

    setIsDeleting(true);
    try {
      const db = getFirebaseDb();
      const docRef = doc(db, FIRESTORE_COLLECTIONS.TASKS, deleteTargetTask.id);
      await updateDoc(docRef, {
        status: 'paused',
        updatedAt: new Date().toISOString(),
        updatedBy: userProfile?.uid || 'admin',
      });
      setActionSuccessMsg(
        `Task "${deleteTargetTask.title}" soft deleted (status changed to Paused).`
      );
      setTimeout(() => setActionSuccessMsg(null), 3000);
      setDeleteTargetTask(null);
    } catch (err: unknown) {
      console.error('[Soft Delete Error]', err);
      setError('Failed to soft delete task.');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: string, isExpired?: boolean) => {
    if (isExpired) {
      return <Badge variant="danger" size="sm">Expired</Badge>;
    }
    switch (status) {
      case 'active':
        return <Badge variant="success" size="sm">Active</Badge>;
      case 'paused':
        return <Badge variant="warning" size="sm">Paused</Badge>;
      case 'completed':
        return <Badge variant="accent" size="sm">Completed</Badge>;
      case 'draft':
      default:
        return <Badge variant="outline" size="sm">Draft</Badge>;
    }
  };

  return (
    <PageContainer size="xl" className="pb-16 space-y-6">
      {/* Top Section Header & Primary CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <SectionHeader
          title="Offer Task Management"
          subtitle="Publish, edit, pause, and monitor partner app offer tasks in real time"
        />

        <Button
          variant="primary"
          size="md"
          asChild
          leftIcon={<PlusCircle className="w-4 h-4" />}
          className="shrink-0"
        >
          <Link href="/admin/tasks/create">Create New Task</Link>
        </Button>
      </div>

      {/* Action Notification Toast Alert */}
      {actionSuccessMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-[var(--radius-lg)] flex items-center justify-between gap-3 text-xs text-emerald-500 font-bold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4.5 h-4.5" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button onClick={() => setActionSuccessMsg(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter, Search & Sorting Control Toolbar */}
      <ContentContainer variant="card" className="p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          {/* Search Box (5 cols) */}
          <div className="lg:col-span-5">
            <Input
              placeholder="Search by task title or app name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-[var(--text-muted)]" />}
              size="sm"
            />
          </div>

          {/* Status Filter Tabs (4 cols) */}
          <div className="lg:col-span-4 flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'All' },
              { id: 'active', label: 'Active' },
              { id: 'inactive', label: 'Paused' },
              { id: 'completed', label: 'Completed' },
              { id: 'expired', label: 'Expired' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-bold transition-all shrink-0 ${
                  statusFilter === tab.id
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sort Dropdown (3 cols) */}
          <div className="lg:col-span-3">
            <Select
              value={sortBy}
              onChange={(val) => setSortBy(val as 'newest' | 'oldest' | 'reward' | 'slots')}
              options={[
                { value: 'newest', label: 'Sort: Newest First' },
                { value: 'oldest', label: 'Sort: Oldest First' },
                { value: 'reward', label: 'Sort: Highest Reward' },
                { value: 'slots', label: 'Sort: Most Slots' },
              ]}
            />
          </div>
        </div>
      </ContentContainer>

      {/* Task Manager Data Table / Cards */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-[var(--radius-lg)]" />
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        /* Empty State with Create First Task CTA */
        <Card variant="elevated" className="p-12 text-center flex flex-col items-center justify-center gap-4">
          <div className="w-14 h-14 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <CheckSquare className="w-7 h-7" />
          </div>
          <div className="space-y-1.5 max-w-sm">
            <h3 className="text-base font-bold font-heading text-[var(--text-primary)]">
              No Tasks Found
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              {searchQuery || statusFilter !== 'all'
                ? 'No offer tasks match your current filter criteria. Try adjusting your search query or status filter.'
                : 'There are currently no tasks in the database. Create your first offer task to get started.'}
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            asChild
            leftIcon={<PlusCircle className="w-4 h-4" />}
          >
            <Link href="/admin/tasks/create">Create First Task</Link>
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Desktop Responsive Table View */}
          <div className="hidden md:block overflow-x-auto rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--surface)] shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[var(--surface-elevated)] border-b border-[var(--border)] text-[var(--text-secondary)] font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Partner App</th>
                  <th className="py-3.5 px-4">Task Title</th>
                  <th className="py-3.5 px-4">Reward</th>
                  <th className="py-3.5 px-4">Comment Mode</th>
                  <th className="py-3.5 px-4">Slot Progress</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Expiry</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] font-medium">
                {filteredTasks.map((task) => {
                  const enrolled = task.enrolledCount ?? task.currentSubmissions ?? 0;
                  const total = task.totalSlots ?? task.maxSubmissions ?? 1;
                  const remaining = Math.max(0, total - enrolled);
                  const progressPct = Math.min(100, Math.round((enrolled / total) * 100));

                  return (
                    <tr
                      key={task.id}
                      className="hover:bg-[var(--surface-elevated)]/40 transition-colors group"
                    >
                      {/* App Icon + Name */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-[var(--radius-md)] bg-[var(--surface-elevated)] border border-[var(--border)] flex items-center justify-center overflow-hidden shrink-0">
                            {task.appIcon ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={task.appIcon}
                                alt={task.appName || task.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Smartphone className="w-4 h-4 text-[var(--primary)]" />
                            )}
                          </div>
                          <span className="font-bold text-[var(--text-primary)] truncate max-w-[120px]">
                            {task.appName || 'PlayPay Partner'}
                          </span>
                        </div>
                      </td>

                      {/* Task Title */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col min-w-0 max-w-[200px]">
                          <span className="font-bold text-[var(--text-primary)] truncate">
                            {task.title}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)] truncate">
                            ID: {task.id}
                          </span>
                        </div>
                      </td>

                      {/* Reward */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-extrabold text-emerald-500 font-mono text-sm">
                          ₹{task.rewardAmount}
                        </span>
                      </td>

                      {/* Comment Mode */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 uppercase">
                          {task.commentMode || 'fixed'}
                        </span>
                      </td>

                      {/* Slot Progress */}
                      <td className="py-3.5 px-4 whitespace-nowrap min-w-[140px]">
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-mono">
                            <span className="text-[var(--text-secondary)]">{enrolled}/{total}</span>
                            <span className="text-emerald-500 font-bold">{remaining} left</span>
                          </div>
                          <div className="w-28 h-1.5 bg-[var(--surface-elevated)] rounded-full overflow-hidden border border-[var(--border)]">
                            <div
                              className="h-full bg-amber-500 transition-all"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getStatusBadge(task.status, task.isExpired)}
                      </td>

                      {/* Expiry Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-[11px] text-[var(--text-muted)] font-mono">
                        {task.expiresAt
                          ? new Date(task.expiresAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                            })
                          : 'No Expiry'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPreviewTask(task)}
                            title="Preview Task Card"
                            aria-label="Preview task card"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-400" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            title="Edit Task"
                            aria-label="Edit task"
                          >
                            <Link href={`/admin/tasks/${task.id}/edit`}>
                              <Edit className="w-3.5 h-3.5 text-amber-500" />
                            </Link>
                          </Button>

                          {task.status === 'active' ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleStatus(task, 'paused')}
                              title="Pause Offer Task"
                              aria-label="Pause task"
                            >
                              <Pause className="w-3.5 h-3.5 text-amber-500" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleStatus(task, 'active')}
                              title="Publish / Activate Offer Task"
                              aria-label="Activate task"
                            >
                              <Play className="w-3.5 h-3.5 text-emerald-500" />
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDeleteModal(task)}
                            title="Delete Task"
                            aria-label="Delete task"
                            className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredTasks.map((task) => {
              const enrolled = task.enrolledCount ?? task.currentSubmissions ?? 0;
              const total = task.totalSlots ?? task.maxSubmissions ?? 1;
              const remaining = Math.max(0, total - enrolled);

              return (
                <Card key={task.id} variant="elevated" className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--surface-elevated)] border border-[var(--border)] flex items-center justify-center overflow-hidden shrink-0">
                        {task.appIcon ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={task.appIcon} alt={task.appName} className="w-full h-full object-cover" />
                        ) : (
                          <Smartphone className="w-5 h-5 text-[var(--primary)]" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[11px] font-medium text-[var(--text-secondary)] block truncate">
                          {task.appName}
                        </span>
                        <h4 className="text-sm font-bold text-[var(--text-primary)] truncate">
                          {task.title}
                        </h4>
                      </div>
                    </div>

                    {getStatusBadge(task.status, task.isExpired)}
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-[var(--radius-md)] bg-[var(--surface-elevated)]/50 border border-[var(--border)] text-xs">
                    <div>
                      <span className="text-[10px] text-[var(--text-muted)] uppercase block">Reward</span>
                      <span className="font-extrabold text-emerald-500 font-mono">₹{task.rewardAmount}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--text-muted)] uppercase block">Slots</span>
                      <span className="font-bold text-[var(--text-primary)] font-mono">{enrolled}/{total} ({remaining} left)</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[var(--text-muted)] uppercase block">Mode</span>
                      <span className="font-semibold text-amber-500 uppercase">{task.commentMode || 'fixed'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-[var(--border)]">
                    <Button variant="ghost" size="sm" onClick={() => setPreviewTask(task)}>
                      <Eye className="w-3.5 h-3.5 mr-1" /> Preview
                    </Button>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/tasks/${task.id}/edit`}>
                        <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDeleteModal(task)}
                      className="text-rose-500"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Task Preview Modal */}
      {previewTask && (
        <Modal
          isOpen={!!previewTask}
          onClose={() => setPreviewTask(null)}
          title={`Task Card Preview: ${previewTask.title}`}
          size="md"
        >
          <div className="p-4 space-y-4">
            <Card variant="elevated" className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] overflow-hidden shrink-0 flex items-center justify-center">
                  {previewTask.appIcon ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={previewTask.appIcon} alt={previewTask.appName} className="w-full h-full object-cover" />
                  ) : (
                    <Smartphone className="w-6 h-6 text-[var(--primary)]" />
                  )}
                </div>
                <div>
                  <span className="text-xs text-[var(--text-secondary)]">{previewTask.appName}</span>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">{previewTask.title}</h3>
                </div>
              </div>

              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {previewTask.description || 'No short description provided.'}
              </p>

              <div className="p-3 bg-[var(--surface-elevated)] rounded-xl border border-[var(--border)] flex justify-between items-center text-xs">
                <span className="font-bold text-[var(--text-primary)]">Reward: ₹{previewTask.rewardAmount}</span>
                <span className="font-mono text-emerald-500 font-bold">{previewTask.totalSlots} Total Slots</span>
              </div>

              {previewTask.instructions && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-[var(--text-primary)]">Instructions:</span>
                  <p className="text-xs text-[var(--text-secondary)] whitespace-pre-line leading-relaxed p-3 bg-[var(--surface-elevated)]/50 rounded-lg">
                    {previewTask.instructions}
                  </p>
                </div>
              )}
            </Card>

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setPreviewTask(null)}>
                Close Preview
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete / Soft Delete Safety Rule Confirmation Modal */}
      {deleteTargetTask && (
        <Modal
          isOpen={!!deleteTargetTask}
          onClose={() => setDeleteTargetTask(null)}
          title={hasEnrollmentsCheck ? "Cannot Hard Delete Task" : "Delete Task Offer"}
          size="sm"
        >
          <div className="p-5 space-y-4">
            {isCheckingEnrollments ? (
              <div className="p-6 text-center space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin text-amber-500 mx-auto" />
                <span className="text-xs font-bold text-[var(--text-primary)]">Verifying task enrollment records...</span>
              </div>
            ) : hasEnrollmentsCheck ? (
              /* Hard Delete Blocked Warning */
              <div className="space-y-4">
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-[var(--radius-lg)] flex items-start gap-3 text-xs text-amber-500">
                  <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold text-amber-400">Hard Delete Rule Triggered</span>
                    <p className="text-[11px] leading-relaxed opacity-90">
                      Task &quot;{deleteTargetTask.title}&quot; has active user enrollments logged in the system. Per safety rules, tasks with enrollments cannot be permanently hard-deleted to preserve proof audit trails and payout ledgers.
                    </p>
                  </div>
                </div>

                <p className="text-xs text-[var(--text-secondary)]">
                  You can perform a <span className="font-bold text-[var(--text-primary)]">Soft Delete</span> instead, which pauses the task and hides it from new users while preserving existing user submission history.
                </p>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setDeleteTargetTask(null)}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleExecuteSoftDelete}
                    disabled={isDeleting}
                    leftIcon={<Archive className="w-4 h-4" />}
                  >
                    {isDeleting ? 'Soft Deleting...' : 'Perform Soft Delete (Pause)'}
                  </Button>
                </div>
              </div>
            ) : (
              /* Hard Delete Confirmation (0 enrollments exist) */
              <div className="space-y-4">
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Are you sure you want to permanently delete task &quot;<span className="font-bold text-[var(--text-primary)]">{deleteTargetTask.title}</span>&quot;? This task has 0 enrollments and will be permanently removed from Firestore.
                </p>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => setDeleteTargetTask(null)}>
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleExecuteDelete}
                    disabled={isDeleting}
                    leftIcon={<Trash2 className="w-4 h-4" />}
                  >
                    {isDeleting ? 'Deleting...' : 'Permanently Delete Task'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </PageContainer>
  );
}
