'use client';

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  QrCode,
  Search,
  Filter,
  Copy,
  Check,
  Share2,
  UserCheck,
  Users,
  ShieldCheck,
  ShieldAlert,
  Edit,
  Power,
  ChevronRight,
  Download,
  MoreVertical,
  ExternalLink,
  Plus,
  RefreshCw,
  Hash,
  Clock,
  Sparkles,
  ArrowUpDown,
  CheckSquare,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { UserDocument } from '@/types/firestore';
import { formatDate } from '@/utils/formatters';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Drawer } from '@/components/ui/drawer';
import { Modal } from '@/components/ui/modal';
import { Checkbox } from '@/components/ui/checkbox';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { EditTeamLeaderModal } from '@/components/admin/EditTeamLeaderModal';
import { motion, AnimatePresence } from 'motion/react';

type FilterStatus = 'all' | 'active' | 'inactive' | 'used' | 'unused';
type SortOption = 'newest' | 'oldest' | 'name' | 'members_desc' | 'members_asc';

export default function LeaderCodesPage() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const {
    users,
    loading,
    error,
    saveTeamLeader,
    toggleLeaderActiveStatus,
  } = useAdminUsers(userProfile?.uid, userProfile?.displayName || undefined, userProfile?.email || undefined);

  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [selectedUids, setSelectedUids] = useState<string[]>([]);
  
  // Modals & Drawers
  const [editingLeader, setEditingLeader] = useState<UserDocument | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedLeaderDetail, setSelectedLeaderDetail] = useState<UserDocument | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isPromoteUserModalOpen, setIsPromoteUserModalOpen] = useState(false);
  const [promoteSearch, setPromoteSearch] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [bulkProcessing, setBulkProcessing] = useState(false);

  // Derive Leader Records (Users with memberType === 'team_leader' or having a leaderCode)
  const leaderRecords = useMemo(() => {
    return users.filter((u) => u.memberType === 'team_leader' || Boolean(u.leaderCode));
  }, [users]);

  // Map of team members per leader UID
  const teamMembersMap = useMemo(() => {
    const map = new Map<string, UserDocument[]>();
    users.forEach((u) => {
      if (u.leaderId) {
        const existing = map.get(u.leaderId) || [];
        existing.push(u);
        map.set(u.leaderId, existing);
      }
    });
    return map;
  }, [users]);

  // KPI Metrics calculation
  const kpis = useMemo(() => {
    const total = leaderRecords.length;
    let active = 0;
    let inactive = 0;
    let used = 0;
    let unused = 0;
    let newThisMonth = 0;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    leaderRecords.forEach((leader) => {
      if (leader.isLeaderActive !== false) {
        active++;
      } else {
        inactive++;
      }

      const members = teamMembersMap.get(leader.uid) || [];
      if (members.length > 0) {
        used++;
      } else {
        unused++;
      }

      if (leader.createdAt) {
        const createdDate = new Date(leader.createdAt);
        if (
          !isNaN(createdDate.getTime()) &&
          createdDate.getFullYear() === currentYear &&
          createdDate.getMonth() === currentMonth
        ) {
          newThisMonth++;
        }
      }
    });

    return { total, active, inactive, used, unused, newThisMonth };
  }, [leaderRecords, teamMembersMap]);

  // Filtered & Sorted Leader Records
  const filteredLeaders = useMemo(() => {
    let result = [...leaderRecords];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (u) =>
          (u.displayName && u.displayName.toLowerCase().includes(q)) ||
          (u.email && u.email.toLowerCase().includes(q)) ||
          (u.phoneNumber && u.phoneNumber.toLowerCase().includes(q)) ||
          (u.leaderCode && u.leaderCode.toLowerCase().includes(q))
      );
    }

    // Filter status
    if (filterStatus === 'active') {
      result = result.filter((u) => u.isLeaderActive !== false);
    } else if (filterStatus === 'inactive') {
      result = result.filter((u) => u.isLeaderActive === false);
    } else if (filterStatus === 'used') {
      result = result.filter((u) => (teamMembersMap.get(u.uid)?.length || 0) > 0);
    } else if (filterStatus === 'unused') {
      result = result.filter((u) => (teamMembersMap.get(u.uid)?.length || 0) === 0);
    }

    // Sort
    result.sort((a, b) => {
      const membersA = teamMembersMap.get(a.uid)?.length || 0;
      const membersB = teamMembersMap.get(b.uid)?.length || 0;

      if (sortBy === 'newest') {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      }
      if (sortBy === 'name') {
        return (a.displayName || a.email || '').localeCompare(b.displayName || b.email || '');
      }
      if (sortBy === 'members_desc') {
        return membersB - membersA;
      }
      if (sortBy === 'members_asc') {
        return membersA - membersB;
      }
      return 0;
    });

    return result;
  }, [leaderRecords, searchQuery, filterStatus, sortBy, teamMembersMap]);

  // Copy helper
  const handleCopy = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    toast({
      variant: 'success',
      title: 'Copied to Clipboard',
      message: `${label} has been copied.`,
    });
    setTimeout(() => setCopiedCode(null), 2000);
  }, [toast]);

  // WhatsApp share helper
  const handleShareWhatsApp = useCallback((leaderCode: string, leaderName: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://playpay.app';
    const link = `${origin}/register?leaderCode=${encodeURIComponent(leaderCode)}`;
    const text = `Join PlayPay with Team Leader ${leaderName}! Use code: ${leaderCode} or click link: ${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  }, []);

  // Selection handlers
  const handleSelectAll = useCallback(() => {
    if (selectedUids.length === filteredLeaders.length) {
      setSelectedUids([]);
    } else {
      setSelectedUids(filteredLeaders.map((l) => l.uid));
    }
  }, [selectedUids, filteredLeaders]);

  const handleToggleSelect = useCallback((uid: string) => {
    setSelectedUids((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  }, []);

  // Bulk actions
  const handleBulkToggleActive = async (newActiveState: boolean) => {
    if (selectedUids.length === 0) return;
    setBulkProcessing(true);
    try {
      let count = 0;
      for (const uid of selectedUids) {
        await toggleLeaderActiveStatus(uid, newActiveState);
        count++;
      }
      toast({
        variant: newActiveState ? 'success' : 'warning',
        title: `Bulk Action Completed`,
        message: `${count} leader code(s) updated to ${newActiveState ? 'Active' : 'Inactive'}.`,
      });
      setSelectedUids([]);
    } catch (err) {
      toast({ variant: 'error', message: 'Failed to process bulk status update.' });
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleBulkExportCSV = () => {
    if (selectedUids.length === 0) return;
    const selectedLeaders = leaderRecords.filter((l) => selectedUids.includes(l.uid));
    
    const headers = ['Leader Name', 'Email', 'Phone', 'Leader Code', 'Status', 'Members Joined', 'Created Date'];
    const rows = selectedLeaders.map((l) => [
      `"${l.displayName || 'N/A'}"`,
      `"${l.email || 'N/A'}"`,
      `"${l.phoneNumber || 'N/A'}"`,
      `"${l.leaderCode || 'N/A'}"`,
      l.isLeaderActive !== false ? 'Active' : 'Inactive',
      teamMembersMap.get(l.uid)?.length || 0,
      `"${formatDate(l.createdAt)}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `leader_codes_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({ variant: 'success', message: `Exported ${selectedLeaders.length} leader code(s) to CSV.` });
  };

  const handleBulkCopyCodes = () => {
    const selectedCodes = leaderRecords
      .filter((l) => selectedUids.includes(l.uid) && l.leaderCode)
      .map((l) => l.leaderCode)
      .join(', ');

    if (selectedCodes) {
      navigator.clipboard.writeText(selectedCodes);
      toast({ variant: 'success', message: `Copied ${selectedUids.length} code(s) to clipboard.` });
    }
  };

  // Candidates for promotion (regular users not currently team leaders)
  const nonLeaderUsers = useMemo(() => {
    if (!promoteSearch.trim()) return [];
    const q = promoteSearch.toLowerCase().trim();
    return users.filter(
      (u) =>
        u.memberType !== 'team_leader' &&
        ((u.displayName && u.displayName.toLowerCase().includes(q)) ||
          (u.email && u.email.toLowerCase().includes(q)) ||
          (u.phoneNumber && u.phoneNumber.toLowerCase().includes(q)))
    ).slice(0, 10);
  }, [users, promoteSearch]);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header / Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[var(--border)]">
        <div>
          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-1">
            <Link href="/admin/dashboard" className="hover:text-[var(--primary)] transition-colors">Admin</Link>
            <span>/</span>
            <span className="text-[var(--text-primary)] font-medium">Leader Codes</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight flex items-center gap-2.5">
            <QrCode className="w-7 h-7 text-[var(--primary)]" />
            Leader Codes Workspace
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
            Manage, generate, track, and audit team leader referral codes and invite links across the organization.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setPromoteSearch('');
              setIsPromoteUserModalOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
            className="shadow-sm font-semibold min-h-[44px]"
          >
            Promote Team Leader
          </Button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-[var(--ruby)]/10 border border-[var(--ruby)]/20 rounded-[var(--radius-lg)] text-xs text-[var(--ruby)] flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Executive KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="p-3.5 space-y-1.5 border-[var(--border)] bg-[var(--surface)]">
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span className="font-medium">Total Codes</span>
            <Hash className="w-4 h-4 text-[var(--primary)]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[var(--text-primary)] font-tabular tracking-tight">
            {loading ? <Skeleton className="h-7 w-12" /> : kpis.total}
          </div>
          <span className="text-[11px] text-[var(--text-muted)]">Issued leader codes</span>
        </Card>

        <Card className="p-3.5 space-y-1.5 border-[var(--border)] bg-[var(--surface)]">
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span className="font-medium">Active Codes</span>
            <ShieldCheck className="w-4 h-4 text-[var(--success)]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[var(--success)] font-tabular tracking-tight">
            {loading ? <Skeleton className="h-7 w-12" /> : kpis.active}
          </div>
          <span className="text-[11px] text-[var(--text-muted)]">Active & ready</span>
        </Card>

        <Card className="p-3.5 space-y-1.5 border-[var(--border)] bg-[var(--surface)]">
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span className="font-medium">Inactive Codes</span>
            <Power className="w-4 h-4 text-[var(--ruby)]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[var(--ruby)] font-tabular tracking-tight">
            {loading ? <Skeleton className="h-7 w-12" /> : kpis.inactive}
          </div>
          <span className="text-[11px] text-[var(--text-muted)]">Disabled / Paused</span>
        </Card>

        <Card className="p-3.5 space-y-1.5 border-[var(--border)] bg-[var(--surface)]">
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span className="font-medium">Used Codes</span>
            <Users className="w-4 h-4 text-[var(--accent)]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[var(--text-primary)] font-tabular tracking-tight">
            {loading ? <Skeleton className="h-7 w-12" /> : kpis.used}
          </div>
          <span className="text-[11px] text-[var(--text-muted)]">≥1 team members</span>
        </Card>

        <Card className="p-3.5 space-y-1.5 border-[var(--border)] bg-[var(--surface)]">
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span className="font-medium">Unused Codes</span>
            <Clock className="w-4 h-4 text-[var(--warning)]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[var(--warning)] font-tabular tracking-tight">
            {loading ? <Skeleton className="h-7 w-12" /> : kpis.unused}
          </div>
          <span className="text-[11px] text-[var(--text-muted)]">0 members joined</span>
        </Card>

        <Card className="p-3.5 space-y-1.5 border-[var(--border)] bg-[var(--surface)]">
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span className="font-medium">New This Month</span>
            <Sparkles className="w-4 h-4 text-[var(--primary)]" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-[var(--text-primary)] font-tabular tracking-tight">
            {loading ? <Skeleton className="h-7 w-12" /> : kpis.newThisMonth}
          </div>
          <span className="text-[11px] text-[var(--text-muted)]">Created current month</span>
        </Card>
      </div>

      {/* Filter & Search Toolbar */}
      <Card className="p-4 space-y-4 border-[var(--border)] bg-[var(--surface)]">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Leader Name, Email, Phone or Leader Code..."
              className="pl-9 min-h-[44px]"
            />
          </div>

          {/* Filters & Sort */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-[var(--bg)] border border-[var(--border)] rounded-[var(--radius-lg)]">
              {(['all', 'active', 'inactive', 'used', 'unused'] as FilterStatus[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1.5 rounded-[var(--radius-md)] text-xs font-semibold capitalize transition-all min-h-[36px] ${
                    filterStatus === st
                      ? 'bg-[var(--surface)] text-[var(--primary)] shadow-xs border border-[var(--border)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Sort Select */}
            <div className="flex items-center gap-1.5 border border-[var(--border)] rounded-[var(--radius-lg)] px-3 py-1 bg-[var(--surface)] text-xs font-medium text-[var(--text-secondary)] min-h-[44px]">
              <ArrowUpDown className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-transparent text-[var(--text-primary)] focus:outline-none cursor-pointer font-medium py-1"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name">Leader Name (A-Z)</option>
                <option value="members_desc">Most Team Members</option>
                <option value="members_asc">Least Team Members</option>
              </select>
            </div>
          </div>
        </div>

        {/* Directory Meta Header Bar */}
        <div className="flex items-center justify-between pt-2 border-t border-[var(--hairline)] text-xs text-[var(--text-secondary)]">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={filteredLeaders.length > 0 && selectedUids.length === filteredLeaders.length}
              onCheckedChange={handleSelectAll}
              label={
                <span className="font-semibold text-[var(--text-primary)]">
                  Select All ({filteredLeaders.length})
                </span>
              }
            />
          </div>
          <div className="font-medium">
            Showing <span className="font-bold text-[var(--text-primary)] font-tabular">{filteredLeaders.length}</span> of{' '}
            <span className="font-bold text-[var(--text-primary)] font-tabular">{leaderRecords.length}</span> leader codes
          </div>
        </div>
      </Card>

      {/* Sticky Bulk Action Bar */}
      <AnimatePresence>
        {selectedUids.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="sticky top-4 z-20 p-3.5 bg-[var(--primary)] text-white rounded-[var(--radius-xl)] shadow-lg flex flex-wrap items-center justify-between gap-3 border border-white/20"
          >
            <div className="flex items-center gap-3">
              <Badge variant="accent" size="md" className="bg-white/20 text-white font-bold font-tabular">
                {selectedUids.length} Selected
              </Badge>
              <span className="text-xs font-medium text-white/90 hidden sm:inline">
                Bulk controls for selected leader codes
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={bulkProcessing}
                onClick={() => handleBulkToggleActive(true)}
                leftIcon={<ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />}
                className="bg-white/10 hover:bg-white/20 border-white/30 text-white font-semibold"
              >
                Enable
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={bulkProcessing}
                onClick={() => handleBulkToggleActive(false)}
                leftIcon={<Power className="w-3.5 h-3.5 text-rose-300" />}
                className="bg-white/10 hover:bg-white/20 border-white/30 text-white font-semibold"
              >
                Disable
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkCopyCodes}
                leftIcon={<Copy className="w-3.5 h-3.5" />}
                className="bg-white/10 hover:bg-white/20 border-white/30 text-white font-semibold"
              >
                Copy Codes
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkExportCSV}
                leftIcon={<Download className="w-3.5 h-3.5" />}
                className="bg-white/10 hover:bg-white/20 border-white/30 text-white font-semibold"
              >
                Export CSV
              </Button>
              <button
                type="button"
                onClick={() => setSelectedUids([])}
                className="text-xs text-white/80 hover:text-white underline px-2 font-medium"
              >
                Deselect All
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Directory Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-5 space-y-4 border-[var(--border)] bg-[var(--surface)]">
              <div className="flex items-center gap-3">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-14 w-full rounded-[var(--radius-lg)]" />
              <div className="flex justify-between">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            </Card>
          ))}
        </div>
      ) : filteredLeaders.length === 0 ? (
        <Card className="p-8 border-[var(--border)] bg-[var(--surface)]">
          <EmptyState
            icon={<QrCode className="w-12 h-12 text-[var(--text-muted)]" />}
            title="No Leader Codes Found"
            description={
              searchQuery || filterStatus !== 'all'
                ? "No leader codes match your current search criteria or active filters."
                : "No team leaders have been assigned a leader code yet."
            }
            action={
              searchQuery || filterStatus !== 'all' ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setFilterStatus('all');
                  }}
                  leftIcon={<RefreshCw className="w-4 h-4" />}
                >
                  Reset Filters
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => {
                    setPromoteSearch('');
                    setIsPromoteUserModalOpen(true);
                  }}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Promote Team Leader
                </Button>
              )
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredLeaders.map((leader) => {
            const isSelected = selectedUids.includes(leader.uid);
            const teamMembers = teamMembersMap.get(leader.uid) || [];
            const code = leader.leaderCode || 'NO_CODE';
            const isActive = leader.isLeaderActive !== false;
            const inviteLink = `${typeof window !== 'undefined' ? window.location.origin : 'https://playpay.app'}/register?leaderCode=${encodeURIComponent(code)}`;

            return (
              <Card
                key={leader.uid}
                className={`p-4 space-y-4 border transition-all duration-200 bg-[var(--surface)] relative ${
                  isSelected
                    ? 'border-[var(--primary)] ring-2 ring-[var(--primary)]/20 shadow-md'
                    : 'border-[var(--border)] hover:border-[var(--border-strong)]'
                }`}
              >
                {/* Header Row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleToggleSelect(leader.uid)}
                    />
                    <Avatar
                      name={leader.displayName || 'Leader'}
                      src={leader.photoURL || undefined}
                      size="md"
                      className="ring-1 ring-[var(--border)] shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-[var(--text-primary)] truncate leading-snug">
                        {leader.displayName || 'Unnamed Leader'}
                      </h3>
                      <p className="text-xs text-[var(--text-secondary)] truncate">
                        {leader.email || 'No email'}
                      </p>
                    </div>
                  </div>

                  <Badge
                    variant={isActive ? 'success' : 'danger'}
                    size="sm"
                    className="shrink-0 font-semibold"
                  >
                    {isActive ? 'Active' : 'Disabled'}
                  </Badge>
                </div>

                {/* Prominent Code Display Box */}
                <div className="p-3 bg-[var(--bg)] border border-[var(--border)] rounded-[var(--radius-lg)] flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider block mb-0.5">
                      Leader Referral Code
                    </span>
                    <span className="text-lg font-black text-[var(--primary)] font-tabular tracking-wider block truncate">
                      {code}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(code, 'Leader Code')}
                      leftIcon={copiedCode === code ? <Check className="w-3.5 h-3.5 text-[var(--success)]" /> : <Copy className="w-3.5 h-3.5" />}
                      className="min-h-[36px] px-2.5 text-xs font-semibold"
                      title="Copy Code"
                    >
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(inviteLink, 'Invite Link')}
                      leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
                      className="min-h-[36px] px-2 text-xs"
                      title="Copy Registration Link"
                    >
                      Link
                    </Button>
                  </div>
                </div>

                {/* Usage Stats Row */}
                <div className="grid grid-cols-2 gap-2 pt-1 text-xs border-t border-[var(--hairline)]">
                  <div>
                    <span className="text-[var(--text-muted)] block">Members Joined</span>
                    <span className="font-extrabold text-[var(--text-primary)] font-tabular text-sm">
                      {teamMembers.length} Users
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)] block">Created Date</span>
                    <span className="font-bold text-[var(--text-secondary)] font-tabular">
                      {formatDate(leader.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Quick Action Footer */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--hairline)]">
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShareWhatsApp(code, leader.displayName || 'Leader')}
                      leftIcon={<MessageSquare className="w-3.5 h-3.5 text-emerald-500" />}
                      className="border-[var(--border)] hover:bg-[var(--bg)] text-xs font-semibold min-h-[36px]"
                    >
                      WhatsApp
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingLeader(leader);
                        setIsEditModalOpen(true);
                      }}
                      leftIcon={<Edit className="w-3.5 h-3.5 text-[var(--text-secondary)]" />}
                      className="border-[var(--border)] hover:bg-[var(--bg)] text-xs font-semibold min-h-[36px]"
                    >
                      Edit
                    </Button>
                  </div>

                  <Button
                    variant="accent"
                    size="sm"
                    onClick={() => {
                      setSelectedLeaderDetail(leader);
                      setIsDrawerOpen(true);
                    }}
                    rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                    className="min-h-[36px] font-bold text-xs"
                  >
                    Details
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail Side Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-[var(--primary)]" />
            <span>Leader Code Audit & Details</span>
          </div>
        }
        size="lg"
      >
        {selectedLeaderDetail && (
          <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-120px)]">
            {/* Leader Identity Card */}
            <div className="p-4 bg-[var(--bg)] border border-[var(--border)] rounded-[var(--radius-xl)] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Avatar
                  name={selectedLeaderDetail.displayName || 'Leader'}
                  src={selectedLeaderDetail.photoURL || undefined}
                  size="lg"
                  className="ring-2 ring-[var(--primary)]/20"
                />
                <div>
                  <h3 className="text-base font-extrabold text-[var(--text-primary)]">
                    {selectedLeaderDetail.displayName || 'Unnamed Leader'}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {selectedLeaderDetail.email || 'No Email'}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] font-mono mt-0.5">
                    UID: {selectedLeaderDetail.uid}
                  </p>
                </div>
              </div>

              <Badge
                variant={selectedLeaderDetail.isLeaderActive !== false ? 'success' : 'danger'}
                size="md"
                className="font-bold"
              >
                {selectedLeaderDetail.isLeaderActive !== false ? 'Active Leader' : 'Disabled'}
              </Badge>
            </div>

            {/* Prominent Code & Invite Box */}
            <div className="p-5 bg-[var(--surface)] border border-[var(--primary)]/30 rounded-[var(--radius-xl)] space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[var(--primary)] uppercase tracking-wider block">
                    Active Leader Code
                  </span>
                  <span className="text-2xl font-black text-[var(--text-primary)] font-tabular tracking-widest">
                    {selectedLeaderDetail.leaderCode || 'NO_CODE'}
                  </span>
                </div>

                {/* QR Code Visual Illustration */}
                <div className="w-16 h-16 bg-white p-1.5 border rounded-lg shadow-2xs flex items-center justify-center">
                  <QrCode className="w-full h-full text-slate-900" />
                </div>
              </div>

              <div className="pt-2 border-t border-[var(--border)] flex flex-wrap items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() =>
                    handleCopy(selectedLeaderDetail.leaderCode || '', 'Leader Code')
                  }
                  leftIcon={<Copy className="w-3.5 h-3.5" />}
                  className="font-bold text-xs"
                >
                  Copy Code
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleCopy(
                      `${typeof window !== 'undefined' ? window.location.origin : 'https://playpay.app'}/register?leaderCode=${encodeURIComponent(selectedLeaderDetail.leaderCode || '')}`,
                      'Invite Link'
                    )
                  }
                  leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
                  className="font-semibold text-xs"
                >
                  Copy Registration Link
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleShareWhatsApp(
                      selectedLeaderDetail.leaderCode || '',
                      selectedLeaderDetail.displayName || 'Leader'
                    )
                  }
                  leftIcon={<MessageSquare className="w-3.5 h-3.5 text-emerald-500" />}
                  className="font-semibold text-xs"
                >
                  WhatsApp
                </Button>
              </div>
            </div>

            {/* Performance Statistics Grid */}
            <div className="space-y-2">
              <h4 className="text-xs font-extrabold uppercase text-[var(--text-muted)] tracking-wider">
                Usage Statistics & Metrics
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Card className="p-3 bg-[var(--bg)] border-[var(--border)]">
                  <span className="text-[11px] text-[var(--text-muted)] block">Team Members</span>
                  <span className="text-lg font-black text-[var(--text-primary)] font-tabular">
                    {teamMembersMap.get(selectedLeaderDetail.uid)?.length || 0} Users
                  </span>
                </Card>

                <Card className="p-3 bg-[var(--bg)] border-[var(--border)]">
                  <span className="text-[11px] text-[var(--text-muted)] block">Leader Active</span>
                  <span className="text-lg font-black text-[var(--success)]">
                    {selectedLeaderDetail.isLeaderActive !== false ? 'YES' : 'NO'}
                  </span>
                </Card>

                <Card className="p-3 bg-[var(--bg)] border-[var(--border)]">
                  <span className="text-[11px] text-[var(--text-muted)] block">Created Date</span>
                  <span className="text-xs font-bold text-[var(--text-secondary)] font-tabular mt-1 block">
                    {formatDate(selectedLeaderDetail.createdAt)}
                  </span>
                </Card>
              </div>
            </div>

            {/* Team Members List */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold uppercase text-[var(--text-muted)] tracking-wider">
                  Enrolled Team Members ({teamMembersMap.get(selectedLeaderDetail.uid)?.length || 0})
                </h4>
              </div>

              {(teamMembersMap.get(selectedLeaderDetail.uid)?.length || 0) === 0 ? (
                <div className="p-6 text-center border border-dashed border-[var(--border)] rounded-[var(--radius-lg)] text-xs text-[var(--text-muted)]">
                  No members have registered using this leader code yet.
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {teamMembersMap.get(selectedLeaderDetail.uid)?.map((member) => (
                    <div
                      key={member.uid}
                      className="p-3 bg-[var(--bg)] border border-[var(--border)] rounded-[var(--radius-md)] flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar
                          name={member.displayName || 'Member'}
                          src={member.photoURL || undefined}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <span className="font-bold text-[var(--text-primary)] truncate block">
                            {member.displayName || 'Member'}
                          </span>
                          <span className="text-[11px] text-[var(--text-secondary)] truncate block">
                            {member.email}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-[var(--text-muted)] block">Joined</span>
                        <span className="font-medium text-[var(--text-secondary)] font-tabular">
                          {formatDate(member.createdAt)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Danger Zone Actions */}
            <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between">
              <Button
                variant={selectedLeaderDetail.isLeaderActive !== false ? 'danger' : 'success'}
                size="sm"
                onClick={async () => {
                  const newState = selectedLeaderDetail.isLeaderActive === false;
                  await toggleLeaderActiveStatus(selectedLeaderDetail.uid, newState);
                  setSelectedLeaderDetail({
                    ...selectedLeaderDetail,
                    isLeaderActive: newState,
                  });
                }}
                leftIcon={<Power className="w-4 h-4" />}
                className="font-bold"
              >
                {selectedLeaderDetail.isLeaderActive !== false ? 'Disable Leader Code' : 'Enable Leader Code'}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingLeader(selectedLeaderDetail);
                  setIsEditModalOpen(true);
                }}
                leftIcon={<Edit className="w-4 h-4" />}
              >
                Edit Leader Code
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Modal 1: Edit Team Leader Modal */}
      {isEditModalOpen && (
        <EditTeamLeaderModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingLeader(null);
          }}
          user={editingLeader}
          existingUsers={users}
          onSave={async (uid, code, active, memberType) => {
            await saveTeamLeader(uid, code, active, memberType);
            setIsEditModalOpen(false);
            setEditingLeader(null);
          }}
        />
      )}

      {/* Modal 2: Promote User to Team Leader Modal */}
      <Modal
        isOpen={isPromoteUserModalOpen}
        onClose={() => setIsPromoteUserModalOpen(false)}
        size="md"
      >
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-[var(--primary)]" />
            <div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Promote User to Team Leader</h3>
              <p className="text-xs text-[var(--text-secondary)]">Search and select a user to issue a new Leader Code.</p>
            </div>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <Input
              value={promoteSearch}
              onChange={(e) => setPromoteSearch(e.target.value)}
              placeholder="Search user by name, email, or phone..."
              className="pl-9 min-h-[44px]"
            />
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pt-2">
            {!promoteSearch.trim() ? (
              <p className="text-xs text-[var(--text-muted)] text-center py-6">
                Type user name or email to search candidates for promotion.
              </p>
            ) : nonLeaderUsers.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] text-center py-6">
                No matching eligible users found.
              </p>
            ) : (
              nonLeaderUsers.map((u) => (
                <div
                  key={u.uid}
                  className="p-3 bg-[var(--bg)] border border-[var(--border)] rounded-[var(--radius-md)] flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={u.displayName || 'User'} src={u.photoURL || undefined} size="sm" />
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-[var(--text-primary)] truncate block">
                        {u.displayName || 'User'}
                      </span>
                      <span className="text-[11px] text-[var(--text-secondary)] truncate block">
                        {u.email}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      setIsPromoteUserModalOpen(false);
                      setEditingLeader(u);
                      setIsEditModalOpen(true);
                    }}
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                    className="font-semibold text-xs min-h-[36px]"
                  >
                    Select & Promote
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
