'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import {
  collection,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  limit,
} from 'firebase/firestore';
import {
  CheckSquare,
  PlusCircle,
  Search,
  Filter,
  Smartphone,
  Eye,
  Edit,
  Play,
  Pause,
  Trash2,
  Archive,
  ShieldAlert,
  AlertCircle,
  Clock,
  MessageSquare,
  RefreshCw,
  X,
  CheckCircle2,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  Copy,
  Plus,
  TrendingUp,
  Layers,
  DollarSign,
  Check,
  BarChart2,
  UserCheck
} from 'lucide-react';

import { getFirebaseDb } from '@/firebase/config';
import {
  TaskDocument,
  TaskStatus,
  FIRESTORE_COLLECTIONS,
} from '@/types/firestore';
import { useAuth } from '@/hooks/useAuth';
import { PageContainer } from '@/components/layout/PageContainer';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Modal } from '@/components/ui/modal';
import { getSafeTime, formatDate } from '@/utils/formatters';

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
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'reward' | 'slots' | 'lowest_reward' | 'recently_updated' | 'most_filled' | 'alphabetical'>('newest');

  // New UI-Only Filters
  const [assignmentTypeFilter, setAssignmentTypeFilter] = useState<string>('all');
  const [rewardRangeFilter, setRewardRangeFilter] = useState<string>('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Mobile & Menu UI States
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [activeMenuTaskId, setActiveMenuTaskId] = useState<string | null>(null);

  // Modal States
  const [previewTask, setPreviewTask] = useState<TaskDocument | null>(null);
  const [deleteTargetTask, setDeleteTargetTask] = useState<TaskDocument | null>(null);
  const [hasEnrollmentsCheck, setHasEnrollmentsCheck] = useState<boolean | null>(null);
  const [isCheckingEnrollments, setIsCheckingEnrollments] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [copiedTaskId, setCopiedTaskId] = useState<string | null>(null);

  // Load recent searches on client mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('playpay_admin_recent_searches');
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load recent searches', e);
    }
  }, []);

  // Save a search term to history
  const handleAddRecentSearch = (term: string) => {
    if (!term.trim()) return;
    const clean = term.trim();
    setRecentSearches((prev) => {
      const filtered = prev.filter((s) => s.toLowerCase() !== clean.toLowerCase());
      const updated = [clean, ...filtered].slice(0, 5);
      try {
        localStorage.setItem('playpay_admin_recent_searches', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleClearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem('playpay_admin_recent_searches');
    } catch (e) {}
  };

  // Realtime Firestore Listener for All Tasks
  useEffect(() => {
    if (!isAdmin) {
      queueMicrotask(() => setLoading(false));
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
          if (getSafeTime(t.expiresAt) < currentDate.getTime()) {
            isExpired = true;
          }
        } catch {}
      }
      let effectiveStatus = t.status;
      if (isExpired && t.status !== 'completed') {
        effectiveStatus = 'paused';
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
        // Status filter
        if (statusFilter === 'active' && (task.status !== 'active' || task.isExpired)) return false;
        if (statusFilter === 'paused' && task.status !== 'paused' && task.status !== 'draft') return false;
        if (statusFilter === 'completed' && task.status !== 'completed') return false;
        if (statusFilter === 'expired' && !task.isExpired) return false;
        if (statusFilter === 'draft' && task.status !== 'draft') return false;
        
        // Category filter
        if (categoryFilter !== 'all' && task.category !== categoryFilter) return false;

        // Assignment Type filter (UI expansion)
        if (assignmentTypeFilter !== 'all') {
          if (assignmentTypeFilter === 'global' && task.assignmentType === 'leaders') return false;
          if (assignmentTypeFilter === 'leaders' && task.assignmentType !== 'leaders') return false;
        }

        // Reward Range filter (UI expansion)
        if (rewardRangeFilter !== 'all') {
          const r = task.rewardAmount || 0;
          if (rewardRangeFilter === 'low' && r >= 20) return false;
          if (rewardRangeFilter === 'medium' && (r < 20 || r > 100)) return false;
          if (rewardRangeFilter === 'high' && r <= 100) return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = (task.title || '').toLowerCase().includes(q);
          const matchAppName = (task.appName || '').toLowerCase().includes(q);
          const matchPackage = (task.packageName || '').toLowerCase().includes(q);
          if (!matchTitle && !matchAppName && !matchPackage) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'oldest') return getSafeTime(a.createdAt) - getSafeTime(b.createdAt);
        if (sortBy === 'reward') return (b.rewardAmount || 0) - (a.rewardAmount || 0);
        if (sortBy === 'lowest_reward') return (a.rewardAmount || 0) - (b.rewardAmount || 0);
        if (sortBy === 'slots') return (b.totalSlots || 0) - (a.totalSlots || 0);
        if (sortBy === 'recently_updated') return getSafeTime(b.updatedAt || b.createdAt) - getSafeTime(a.updatedAt || a.createdAt);
        if (sortBy === 'most_filled') {
          const aEnrolled = a.enrolledCount ?? a.currentSubmissions ?? 0;
          const bEnrolled = b.enrolledCount ?? b.currentSubmissions ?? 0;
          return bEnrolled - aEnrolled;
        }
        if (sortBy === 'alphabetical') {
          return (a.title || '').localeCompare(b.title || '');
        }
        return getSafeTime(b.createdAt) - getSafeTime(a.createdAt); // newest default
      });
  }, [processedTasks, statusFilter, categoryFilter, assignmentTypeFilter, rewardRangeFilter, searchQuery, sortBy]);

  // Aggregate stats computed in-memory
  const statsSummary = useMemo(() => {
    const total = tasks.length;
    const active = tasks.filter((t) => t.status === 'active').length;
    const paused = tasks.filter((t) => t.status === 'paused').length;
    const drafts = tasks.filter((t) => t.status === 'draft').length;
    
    let totalSlots = 0;
    let totalEnrolled = 0;
    tasks.forEach((t) => {
      totalSlots += t.totalSlots ?? t.maxSubmissions ?? 0;
      totalEnrolled += t.enrolledCount ?? t.currentSubmissions ?? 0;
    });

    const percentSlotsFilled = totalSlots > 0 ? Math.round((totalEnrolled / totalSlots) * 100) : 0;

    return {
      total,
      active,
      paused,
      drafts,
      totalSlots,
      totalEnrolled,
      percentSlotsFilled,
    };
  }, [tasks]);

  // Quick Action: Toggle Status
  const handleToggleStatus = async (task: TaskDocument, newStatus: TaskStatus) => {
    try {
      const db = getFirebaseDb();
      const docRef = doc(db, FIRESTORE_COLLECTIONS.TASKS, task.id);
      await updateDoc(docRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
        updatedBy: userProfile?.uid || 'admin',
      });
      setActionSuccessMsg(`Task "${task.title}" status changed to ${newStatus}.`);
      setTimeout(() => setActionSuccessMsg(null), 3000);
    } catch (err) {
      setError('Failed to update task status.');
    } finally {
      setActiveMenuTaskId(null);
    }
  };

  // Quick Action: Duplicate (Real Database Implementation)
  const handleDuplicateTask = async (task: TaskDocument) => {
    setIsDeleting(true);
    try {
      const db = getFirebaseDb();
      const colRef = collection(db, FIRESTORE_COLLECTIONS.TASKS);
      
      const duplicatedData = {
        title: `${task.title} (Copy)`,
        description: task.description || '',
        category: task.category,
        rewardAmount: task.rewardAmount || 0,
        maxSubmissions: task.maxSubmissions || 1,
        currentSubmissions: 0,
        status: 'draft' as TaskStatus,
        instructions: task.instructions || '',
        proofType: task.proofType || 'screenshot',
        appName: task.appName || '',
        appIcon: task.appIcon || '',
        packageName: task.packageName || '',
        playStoreUrl: task.playStoreUrl || '',
        appUrl: task.appUrl || '',
        hint: task.hint || '',
        totalSlots: task.totalSlots || 1,
        enrolledCount: 0,
        isVerified: task.isVerified || false,
        commentMode: task.commentMode || 'none',
        comments: task.comments || [],
        reenrollmentPolicy: task.reenrollmentPolicy || 'none',
        cooldownDays: task.cooldownDays || 0,
        assignmentType: task.assignmentType || 'all',
        assignedLeaderIds: task.assignedLeaderIds || [],
        baseReward: task.baseReward || null,
        createdBy: userProfile?.uid || 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const docRef = await addDoc(colRef, duplicatedData);
      setActionSuccessMsg(`Duplicated "${task.title}" successfully as a Draft.`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('[Duplicate Error]', err);
      setError('Failed to duplicate task.');
    } finally {
      setIsDeleting(false);
      setActiveMenuTaskId(null);
    }
  };

  const handleOpenDeleteModal = async (task: TaskDocument) => {
    setActiveMenuTaskId(null);
    setDeleteTargetTask(task);
    setIsCheckingEnrollments(true);
    setHasEnrollmentsCheck(null);
    const enrolledCount = task.enrolledCount ?? task.currentSubmissions ?? 0;
    if (enrolledCount > 0) {
      setHasEnrollmentsCheck(true);
      setIsCheckingEnrollments(false);
      return;
    }
    try {
      const db = getFirebaseDb();
      const q = query(
        collection(db, FIRESTORE_COLLECTIONS.ENROLLMENTS),
        where('taskId', '==', task.id),
        limit(1)
      );
      const snap = await getDocs(q);
      setHasEnrollmentsCheck(!snap.empty);
    } catch {
      setHasEnrollmentsCheck(enrolledCount > 0);
    } finally {
      setIsCheckingEnrollments(false);
    }
  };

  const handleExecuteDelete = async () => {
    if (!deleteTargetTask || hasEnrollmentsCheck) return;
    setIsDeleting(true);
    try {
      const db = getFirebaseDb();
      await deleteDoc(doc(db, FIRESTORE_COLLECTIONS.TASKS, deleteTargetTask.id));
      setActionSuccessMsg(`Task "${deleteTargetTask.title}" permanently deleted.`);
      setTimeout(() => setActionSuccessMsg(null), 3000);
      setDeleteTargetTask(null);
    } catch (err) {
      setError('Failed to delete task.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExecuteSoftDelete = async () => {
    if (!deleteTargetTask) return;
    setIsDeleting(true);
    try {
      const db = getFirebaseDb();
      const docRef = doc(db, FIRESTORE_COLLECTIONS.TASKS, deleteTargetTask.id);
      await updateDoc(docRef, {
        status: 'paused',
        updatedAt: serverTimestamp(),
        updatedBy: userProfile?.uid || 'admin',
      });
      setActionSuccessMsg(`Task "${deleteTargetTask.title}" archived (status changed to Paused).`);
      setTimeout(() => setActionSuccessMsg(null), 3000);
      setDeleteTargetTask(null);
    } catch (err) {
      setError('Failed to soft delete task.');
    } finally {
      setIsDeleting(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTaskId(id);
    setTimeout(() => setCopiedTaskId(null), 2000);
  };

  const getStatusBadge = (status: string, isExpired?: boolean) => {
    if (isExpired) {
      return (
        <Badge variant="outline" className="text-xs bg-rose-50 border-rose-200 text-rose-600 font-semibold px-2.5 py-0.5 whitespace-nowrap">
          Expired
        </Badge>
      );
    }
    switch (status) {
      case 'active':
        return (
          <Badge variant="outline" className="text-xs bg-emerald-50 border-emerald-200 text-emerald-700 font-semibold px-2.5 py-0.5 whitespace-nowrap">
            Active
          </Badge>
        );
      case 'paused':
        return (
          <Badge variant="outline" className="text-xs bg-amber-50 border-amber-200 text-amber-700 font-semibold px-2.5 py-0.5 whitespace-nowrap">
            Paused
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700 font-semibold px-2.5 py-0.5 whitespace-nowrap">
            Completed
          </Badge>
        );
      case 'draft':
      default:
        return (
          <Badge variant="outline" className="text-xs bg-slate-50 border-slate-200 text-slate-600 font-semibold px-2.5 py-0.5 whitespace-nowrap">
            Draft
          </Badge>
        );
    }
  };

  return (
    <PageContainer size="xl" className="pb-24 space-y-6 bg-slate-50/50 min-h-screen">
      {/* Top Header & Overview Cards */}
      <div className="flex flex-col gap-6 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight font-heading">Operations Workspace</h1>
            
          </div>
          <Button
            variant="primary"
            size="lg"
            asChild
            leftIcon={<PlusCircle className="w-5 h-5" />}
            className="shadow-sm bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl px-5 py-2.5"
          >
            <Link href="/admin/tasks/create">New Task</Link>
          </Button>
        </div>

        {/* Dashboard Live Metrics Section */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Tasks</span>
              <span className="text-2xl font-black text-slate-800 font-mono">{statsSummary.total}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500">
              <Layers className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Active Offers</span>
              <span className="text-2xl font-black text-emerald-600 font-mono">{statsSummary.active}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
              <Check className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Pending Tasks</span>
              <span className="text-2xl font-black text-amber-600 font-mono">{statsSummary.paused + statsSummary.drafts}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Filled Ratio</span>
              <span className="text-2xl font-black text-slate-800 font-mono">{statsSummary.percentSlotsFilled}%</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-sm text-emerald-800 font-semibold shadow-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{actionSuccessMsg}</span>
          </div>
          <button onClick={() => setActionSuccessMsg(null)}>
            <X className="w-4 h-4 hover:bg-emerald-100 p-0.5 rounded-full transition-colors text-emerald-800" />
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-3 text-sm text-rose-800 font-semibold shadow-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)}>
            <X className="w-4 h-4 hover:bg-rose-100 p-0.5 rounded-full transition-colors text-rose-800" />
          </button>
        </div>
      )}

      {/* Sticky Search & Filtering Workspace */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-100 shadow-xs p-4 space-y-4">
        {/* Core Search & Actions */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          <div className="relative flex-1">
            <Input
              placeholder="Search by task title, app name, package name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddRecentSearch(searchQuery);
                }
              }}
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
              className="pl-10 h-11 bg-slate-50 border-slate-200 rounded-xl focus:bg-white transition-all text-sm pr-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              leftIcon={<Filter className={`w-4 h-4 ${showAdvancedFilters ? 'text-slate-900' : 'text-slate-500'}`} />}
              className={`h-11 px-4 rounded-xl border border-slate-200 font-semibold text-sm transition-all ${
                showAdvancedFilters ? 'bg-slate-100 border-slate-300 text-slate-900' : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              Filters
            </Button>

            <div className="w-48 shrink-0">
              <Select
                value={sortBy}
                onChange={(val) => setSortBy(val as any)}
                options={[
                  { value: 'newest', label: 'Newest First' },
                  { value: 'oldest', label: 'Oldest First' },
                  { value: 'reward', label: 'Highest Reward' },
                  { value: 'lowest_reward', label: 'Lowest Reward' },
                  { value: 'slots', label: 'Most Capacity' },
                  { value: 'recently_updated', label: 'Recently Updated' },
                  { value: 'most_filled', label: 'Most Filled' },
                  { value: 'alphabetical', label: 'Alphabetical' },
                ]}
                className="h-11 text-sm rounded-xl border-slate-200 focus:ring-slate-500"
              />
            </div>
          </div>
        </div>

        {/* Recent Searches Panel */}
        {recentSearches.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">Recent:</span>
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {recentSearches.map((search, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-semibold text-slate-600 transition-colors shrink-0 cursor-pointer"
                >
                  <span onClick={() => setSearchQuery(search)}>{search}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setRecentSearches(prev => prev.filter(s => s !== search));
                    }}
                    className="p-0.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={handleClearRecentSearches}
              className="text-[10px] font-bold text-rose-500 hover:text-rose-600 shrink-0 pl-1 uppercase tracking-wider"
            >
              Clear
            </button>
          </div>
        )}

        {/* Quick Filter Active Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mr-1">Status:</span>
          {['all', 'active', 'paused', 'completed', 'draft', 'expired'].map((status) => {
            const isActive = statusFilter === status;
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider transition-all border ${
                  isActive
                    ? 'bg-slate-900 border-slate-950 text-white shadow-xs'
                    : 'bg-slate-50/50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                {status}
              </button>
            );
          })}
        </div>

        {/* Collapsible Advanced Filters Row */}
        <AnimatePresence>
          {showAdvancedFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-slate-100 pt-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Category</label>
                  <Select
                    value={categoryFilter}
                    onChange={(val) => setCategoryFilter(val)}
                    options={[
                      { value: 'all', label: 'All Categories' },
                      { value: 'app_download', label: 'App Download' },
                      { value: 'survey', label: 'Survey' },
                      { value: 'video_watch', label: 'Video Watch' },
                      { value: 'social_follow', label: 'Social Follow' },
                      { value: 'referral', label: 'Referral' },
                      { value: 'other', label: 'Other' },
                    ]}
                    className="h-10 text-sm rounded-xl border-slate-200"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Assignment Type</label>
                  <Select
                    value={assignmentTypeFilter}
                    onChange={(val) => setAssignmentTypeFilter(val)}
                    options={[
                      { value: 'all', label: 'All (Global & Selected)' },
                      { value: 'global', label: 'Global (All Users)' },
                      { value: 'leaders', label: 'Team Leaders Only' },
                    ]}
                    className="h-10 text-sm rounded-xl border-slate-200"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Reward Range</label>
                  <Select
                    value={rewardRangeFilter}
                    onChange={(val) => setRewardRangeFilter(val)}
                    options={[
                      { value: 'all', label: 'All Rewards' },
                      { value: 'low', label: 'Under ₹20' },
                      { value: 'medium', label: '₹20 to ₹100' },
                      { value: 'high', label: 'Above ₹100' },
                    ]}
                    className="h-10 text-sm rounded-xl border-slate-200"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-50">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setStatusFilter('all');
                    setCategoryFilter('all');
                    setAssignmentTypeFilter('all');
                    setRewardRangeFilter('all');
                    setSearchQuery('');
                  }}
                  className="text-xs font-bold text-slate-600 rounded-lg"
                >
                  Reset Filters
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Task Operations Workspace */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between gap-6 shadow-xs animate-pulse">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 bg-slate-100 rounded-xl" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-100 rounded w-1/3" />
                  <div className="h-3 bg-slate-100 rounded w-1/4" />
                </div>
              </div>
              <div className="h-8 bg-slate-100 rounded w-24 hidden md:block" />
              <div className="h-8 bg-slate-100 rounded w-16" />
            </div>
          ))}
        </div>
      ) : filteredTasks.length === 0 ? (
        <Card variant="elevated" className="py-20 text-center flex flex-col items-center justify-center gap-5 bg-white border border-slate-100 rounded-2xl shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 text-slate-500 flex items-center justify-center">
            <CheckSquare className="w-8 h-8 text-slate-400" />
          </div>
          <div className="space-y-2 max-w-md">
            <h3 className="text-lg font-black text-slate-800">No Task Offerings Found</h3>
            <p className="text-sm text-slate-500 leading-relaxed px-4">
              {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all' || assignmentTypeFilter !== 'all' || rewardRangeFilter !== 'all'
                ? 'No offer tasks match your workspace filters. Try relaxing your filters or resetting search criteria.'
                : 'Your operational workspace is currently empty. Get started by publishing your first enterprise offer.'}
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            asChild
            leftIcon={<PlusCircle className="w-4 h-4" />}
            className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold px-4 py-2"
          >
            <Link href="/admin/tasks/create">Create Task</Link>
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Desktop Rows View (lg:block, hidden on mobile) */}
          <div className="hidden lg:block space-y-3.5">
            {filteredTasks.map((task) => {
              const enrolled = task.enrolledCount ?? task.currentSubmissions ?? 0;
              const total = task.totalSlots ?? task.maxSubmissions ?? 1;
              const remaining = Math.max(0, total - enrolled);
              const progressPct = Math.min(100, Math.round((enrolled / total) * 100));
              const isMenuOpen = activeMenuTaskId === task.id;

              return (
                <div
                  key={task.id}
                  className="bg-white border border-slate-100 hover:border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-sm transition-all flex items-center gap-6 group relative"
                >
                  {/* Column 1: App Identity */}
                  <div className="flex items-center gap-4 w-[28%] min-w-0">
                    <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                      {task.appIcon ? (
                        <img src={task.appIcon} alt={task.appName} className="w-full h-full object-cover" />
                      ) : (
                        <Smartphone className="w-6 h-6 text-slate-400" />
                      )}
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[120px]">
                          {task.appName || 'No App Name'}
                        </span>
                        <Badge variant="outline" className="text-[9px] bg-slate-50 border-slate-200 text-slate-500 font-bold px-1.5 py-0 uppercase">
                          {task.category.replace('_', ' ')}
                        </Badge>
                      </div>
                      <h4 className="font-bold text-slate-800 truncate text-base hover:text-slate-900 leading-tight">
                        {task.title}
                      </h4>
                      {task.packageName && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                          <span className="truncate max-w-[150px]">{task.packageName}</span>
                          <button
                            onClick={() => copyToClipboard(task.packageName!, task.id)}
                            className="p-0.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                            title="Copy Package Name"
                          >
                            {copiedTaskId === task.id ? <Check className="w-2.5 h-2.5 text-emerald-500" /> : <Copy className="w-2.5 h-2.5" />}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Column 2: Status */}
                  <div className="w-[12%] shrink-0">
                    <div className="flex flex-col gap-1 items-start">
                      {getStatusBadge(task.status, task.isExpired)}
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                        {task.expiresAt ? formatDate(task.expiresAt) : 'No Expiry'}
                      </span>
                    </div>
                  </div>

                  {/* Column 3: Rewards (Financials) */}
                  <div className="w-[12%] shrink-0">
                    <div className="space-y-0.5">
                      <span className="text-xl font-extrabold text-slate-900 font-mono block">₹{task.rewardAmount}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Base Reward</span>
                    </div>
                  </div>

                  {/* Column 4: Operational Progression (Slots / Review / Payment) */}
                  <div className="w-[23%] shrink-0 space-y-2">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-slate-500 font-mono">{enrolled} / {total} Filled</span>
                      <span className="text-slate-400 font-mono">{remaining} Slots Available</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          task.status === 'active' ? 'bg-slate-950' : 'bg-slate-300'
                        }`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3 text-slate-400" /> 0 Pending Review
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-slate-400" /> 0 Payouts
                      </span>
                    </div>
                  </div>

                  {/* Column 5: Assignment Details */}
                  <div className="w-[15%] shrink-0">
                    <div className="space-y-1">
                      <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 border-slate-200 bg-slate-50/50">
                        {task.assignmentType === 'leaders' ? 'Selected Leaders' : 'Global (All)'}
                      </Badge>
                      <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase block">
                        {task.assignedLeaderIds?.length || 0} Leaders Configured
                      </span>
                    </div>
                  </div>

                  {/* Column 6: Actions Toolbar */}
                  <div className="flex-1 flex items-center justify-end gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPreviewTask(task)}
                      title="Preview Offer"
                      className="h-9 w-9 p-0 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      title="Edit Offer"
                      className="h-9 w-9 p-0 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                    >
                      <Link href={`/admin/tasks/${task.id}/edit`}>
                        <Edit className="w-4 h-4" />
                      </Link>
                    </Button>

                    {/* Quick Menu Trigger */}
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveMenuTaskId(isMenuOpen ? null : task.id)}
                        className="h-9 w-9 p-0 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>

                      <AnimatePresence>
                        {isMenuOpen && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setActiveMenuTaskId(null)} />
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: 5 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: 5 }}
                              className="absolute right-0 mt-1 w-44 bg-white border border-slate-100 rounded-xl shadow-lg z-50 py-1.5 text-left text-xs font-semibold text-slate-600"
                            >
                              <button
                                onClick={() => handleToggleStatus(task, task.status === 'active' ? 'paused' : 'active')}
                                className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 hover:text-slate-900"
                              >
                                {task.status === 'active' ? (
                                  <>
                                    <Pause className="w-3.5 h-3.5" /> Pause Offer
                                  </>
                                ) : (
                                  <>
                                    <Play className="w-3.5 h-3.5 text-emerald-500" /> Activate Offer
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => handleDuplicateTask(task)}
                                className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 hover:text-slate-900"
                              >
                                <Copy className="w-3.5 h-3.5" /> Duplicate Offer
                              </button>
                              <button
                                onClick={() => {
                                  setActionSuccessMsg(`Analytics for "${task.title}": ${enrolled} enrollments, ${progressPct}% filled.`);
                                  setActiveMenuTaskId(null);
                                  setTimeout(() => setActionSuccessMsg(null), 4000);
                                }}
                                className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 hover:text-slate-900"
                              >
                                <BarChart2 className="w-3.5 h-3.5" /> View Analytics
                              </button>
                              <button
                                onClick={() => {
                                  setActionSuccessMsg(`Assignments configured for: ${task.assignmentType === 'leaders' ? 'Selected Leaders' : 'All Leaders'}`);
                                  setActiveMenuTaskId(null);
                                  setTimeout(() => setActionSuccessMsg(null), 4000);
                                }}
                                className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2 hover:text-slate-900"
                              >
                                <UserCheck className="w-3.5 h-3.5" /> Assignments
                              </button>
                              <hr className="my-1 border-slate-100" />
                              <button
                                onClick={() => handleOpenDeleteModal(task)}
                                className="w-full px-3 py-2 text-left hover:bg-rose-50 text-rose-600 flex items-center gap-2"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Archive / Delete
                              </button>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile Tactile Cards (lg:hidden) */}
          <div className="grid grid-cols-1 gap-4 lg:hidden">
            {filteredTasks.map((task) => {
              const enrolled = task.enrolledCount ?? task.currentSubmissions ?? 0;
              const total = task.totalSlots ?? task.maxSubmissions ?? 1;
              const remaining = Math.max(0, total - enrolled);
              const progressPct = Math.min(100, Math.round((enrolled / total) * 100));
              const isExpanded = expandedTaskId === task.id;

              return (
                <div
                  key={task.id}
                  className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden transition-all"
                >
                  {/* Card Main Block */}
                  <div
                    className="p-4 flex items-start gap-3.5 cursor-pointer active:bg-slate-50 transition-colors select-none"
                    onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                  >
                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                      {task.appIcon ? (
                        <img src={task.appIcon} alt={task.appName} className="w-full h-full object-cover" />
                      ) : (
                        <Smartphone className="w-6 h-6 text-slate-400" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block truncate max-w-[100px]">
                          {task.appName}
                        </span>
                        <Badge variant="outline" className="text-[8px] bg-slate-50 border-slate-200 text-slate-500 font-bold px-1 py-0 uppercase">
                          {task.category.replace('_', ' ')}
                        </Badge>
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 leading-tight block truncate">
                        {task.title}
                      </h4>
                      <div className="flex items-center gap-2 pt-0.5">
                        <span className="text-xs font-black text-slate-800 font-mono">₹{task.rewardAmount}</span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Base</span>
                      </div>
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-1.5">
                      {getStatusBadge(task.status, task.isExpired)}
                      <div className="p-1 rounded-full bg-slate-50 text-slate-400">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Collapsible Panel */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-slate-50 bg-slate-50/20"
                      >
                        <div className="p-4 space-y-4 text-xs">
                          {/* App Package */}
                          {task.packageName && (
                            <div className="bg-white p-2.5 rounded-xl border border-slate-100 flex items-center justify-between shadow-xxs">
                              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Package ID</span>
                              <div className="flex items-center gap-1.5 font-mono text-slate-600">
                                <span className="text-[11px] truncate max-w-[180px]">{task.packageName}</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyToClipboard(task.packageName!, task.id);
                                  }}
                                  className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                  {copiedTaskId === task.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Quick Dual Stats */}
                          <div className="grid grid-cols-2 gap-2.5">
                            <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-xxs space-y-0.5">
                              <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Created</span>
                              <span className="font-bold text-slate-700 block text-xs">
                                {task.createdAt ? formatDate(task.createdAt) : '-'}
                              </span>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-xxs space-y-0.5">
                              <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Updated</span>
                              <span className="font-bold text-slate-700 block text-xs">
                                {task.updatedAt ? formatDate(task.updatedAt) : '-'}
                              </span>
                            </div>
                          </div>

                          {/* Capacity Slots */}
                          <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-xxs space-y-2">
                            <div className="flex justify-between font-bold text-[10px] text-slate-500 uppercase">
                              <span>Capacity Progression</span>
                              <span className="text-slate-700 font-mono">{enrolled} / {total} Slots</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-slate-900 rounded-full"
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase tracking-wider pt-0.5">
                              <span>0 Pending Review</span>
                              <span>0 Paid Out</span>
                            </div>
                          </div>

                          {/* Assignment Mode */}
                          <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-xxs flex items-center justify-between">
                            <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Assignment Type</span>
                            <span className="font-bold text-slate-800 capitalize">
                              {task.assignmentType === 'leaders' ? 'Selected Leaders Only' : 'Global Access'}
                            </span>
                          </div>

                          {/* Quick Action Button Drawer */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setPreviewTask(task)}
                              className="flex-1 bg-white hover:bg-slate-50 text-slate-700 border-slate-200 h-10 rounded-xl font-bold"
                            >
                              <Eye className="w-3.5 h-3.5 mr-1.5" /> Preview
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                              className="flex-1 bg-white hover:bg-slate-50 text-slate-700 border-slate-200 h-10 rounded-xl font-bold"
                            >
                              <Link href={`/admin/tasks/${task.id}/edit`}>
                                <Edit className="w-3.5 h-3.5 mr-1.5" /> Edit
                              </Link>
                            </Button>

                            {task.status === 'active' ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleStatus(task, 'paused')}
                                className="flex-1 bg-white hover:bg-slate-50 text-slate-700 border-slate-200 h-10 rounded-xl font-bold"
                              >
                                <Pause className="w-3.5 h-3.5 mr-1.5 text-amber-500" /> Pause
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleStatus(task, 'active')}
                                className="flex-1 bg-white hover:bg-slate-50 text-slate-700 border-slate-200 h-10 rounded-xl font-bold"
                              >
                                <Play className="w-3.5 h-3.5 mr-1.5 text-emerald-500" /> Activate
                              </Button>
                            )}

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDuplicateTask(task)}
                              className="flex-1 bg-white hover:bg-slate-50 text-slate-700 border-slate-200 h-10 rounded-xl font-bold"
                            >
                              <Copy className="w-3.5 h-3.5 mr-1.5" /> Copy
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenDeleteModal(task)}
                              className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200 hover:border-rose-300 h-10 rounded-xl font-bold mt-1"
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Archive / Delete
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Floating Action Button (FAB) for Mobile Viewports */}
      <div className="lg:hidden fixed bottom-6 right-6 z-40">
        <Button
          variant="primary"
          asChild
          className="h-14 w-14 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-lg hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 p-0"
        >
          <Link href="/admin/tasks/create">
            <Plus className="w-6 h-6" />
          </Link>
        </Button>
      </div>

      {/* Task Preview Modal */}
      {previewTask && (
        <Modal isOpen={!!previewTask} onClose={() => setPreviewTask(null)} title={`Preview Offer: ${previewTask.title}`} size="md">
          <div className="p-5 space-y-5 bg-white rounded-2xl">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                {previewTask.appIcon ? (
                  <img src={previewTask.appIcon} alt={previewTask.appName} className="w-full h-full object-cover" />
                ) : (
                  <Smartphone className="w-8 h-8 text-slate-400" />
                )}
              </div>
              <div className="pt-0.5 space-y-1">
                <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">{previewTask.appName}</span>
                <h3 className="text-lg font-black text-slate-800 leading-tight">{previewTask.title}</h3>
                <div className="flex gap-2 flex-wrap pt-1">
                  <Badge variant="outline" className="text-[10px] border-emerald-200 text-emerald-700 bg-emerald-50 font-bold px-2 py-0.5">
                    Reward: ₹{previewTask.rewardAmount}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] border-slate-200 text-slate-600 bg-slate-50 font-bold px-2 py-0.5">
                    {previewTask.totalSlots} Slots Total
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Description</span>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100/50">
                  {previewTask.description || 'No description provided.'}
                </p>
              </div>

              {previewTask.packageName && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Package Name</span>
                  <div className="text-xs font-mono text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100/50 block select-all">
                    {previewTask.packageName}
                  </div>
                </div>
              )}

              {previewTask.instructions && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Submission Instructions</span>
                  <div className="text-xs text-slate-600 whitespace-pre-line leading-relaxed p-4 bg-slate-50 rounded-xl border border-slate-100">
                    {previewTask.instructions}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="md"
                onClick={() => setPreviewTask(null)}
                className="rounded-xl font-bold border-slate-200 hover:bg-slate-50 px-5"
              >
                Close Preview
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete / Archive Confirmation Modal */}
      {deleteTargetTask && (
        <Modal isOpen={!!deleteTargetTask} onClose={() => setDeleteTargetTask(null)} title={hasEnrollmentsCheck ? "Action Restricted" : "Archive Task"} size="sm">
          <div className="p-5 space-y-4 bg-white rounded-2xl">
            {isCheckingEnrollments ? (
              <div className="py-8 text-center space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin text-slate-400 mx-auto" />
                <span className="text-xs font-bold text-slate-500 block">Verifying audit ledgers...</span>
              </div>
            ) : hasEnrollmentsCheck ? (
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col gap-2 shadow-xxs">
                  <div className="flex items-center gap-2 text-amber-700">
                    <ShieldAlert className="w-5 h-5 text-amber-600" />
                    <span className="font-extrabold text-sm">Hard Delete Restricted</span>
                  </div>
                  <p className="text-xs text-amber-800/80 leading-relaxed font-semibold">
                    Task &ldquo;{deleteTargetTask.title}&rdquo; has existing enrollments or audit logs. To preserve historical ledger integrity, you can only Soft Delete (Archive) this task.
                  </p>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => setDeleteTargetTask(null)}
                    className="rounded-xl border-slate-200 hover:bg-slate-50 text-slate-600 font-bold px-4"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleExecuteSoftDelete}
                    disabled={isDeleting}
                    leftIcon={<Archive className="w-4 h-4" />}
                    className="rounded-xl bg-slate-900 hover:bg-slate-800 font-bold px-4 text-white"
                  >
                    {isDeleting ? 'Archiving...' : 'Archive Task'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl shadow-xxs">
                  <p className="text-xs text-rose-800 leading-relaxed font-bold">
                    Are you sure you want to permanently delete &ldquo;{deleteTargetTask.title}&rdquo;? All records will be wiped. This action is irreversible.
                  </p>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="md"
                    onClick={() => setDeleteTargetTask(null)}
                    className="rounded-xl border-slate-200 hover:bg-slate-50 text-slate-600 font-bold px-4"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    size="md"
                    onClick={handleExecuteDelete}
                    disabled={isDeleting}
                    leftIcon={<Trash2 className="w-4 h-4" />}
                    className="rounded-xl bg-rose-600 hover:bg-rose-500 font-bold px-4 text-white"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
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
