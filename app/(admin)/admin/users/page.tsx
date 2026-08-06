'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users as UsersIcon,
  Search,
  Filter,
  ArrowUpDown,
  UserCheck,
  UserX,
  Shield,
  Eye,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Ban,
  Power,
  RotateCcw,
  Award,
  Edit3,
  Copy,
  Check,
  ToggleLeft,
  ToggleRight,
  UserPlus,
  Download,
  X,
  SlidersHorizontal,
  FileText,
  DollarSign,
  History,
  CheckSquare,
  Square,
  Sparkles,
  ChevronRight,
  User,
  ShieldAlert,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/layout/SectionHeader';
import { ContentContainer } from '@/components/layout/ContentContainer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { useAuth } from '@/hooks/useAuth';
import { useAdminUsers, UserFilterStatus, UserSortOption } from '@/hooks/useAdminUsers';
import { BanUserModal } from '@/components/admin/BanUserModal';
import { EditTeamLeaderModal } from '@/components/admin/EditTeamLeaderModal';
import { TeamMembersModal } from '@/components/admin/TeamMembersModal';
import { BulkAssignLeaderModal } from '@/components/admin/BulkAssignLeaderModal';
import { BulkBanModal } from '@/components/admin/BulkBanModal';
import { UserDocument, FIRESTORE_COLLECTIONS } from '@/types/firestore';
import { formatDate } from '@/utils/formatters';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc, writeBatch } from 'firebase/firestore';
import { getFirebaseDb } from '@/firebase/config';
import { logAdminActivity } from '@/lib/audit-logger';

export default function AdminUsersPage() {
  const { currentUser, userProfile } = useAuth();
  const { toast } = useToast();
  const {
    users,
    filteredUsers,
    loading,
    hasMore,
    loadMore,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    sortBy,
    setSortBy,
    banUser,
    unbanUser,
    toggleUserActive,
    saveTeamLeader,
    toggleLeaderActiveStatus,
    updateMemberReward,
    bulkUpdateMemberRewards,
  } = useAdminUsers(
    currentUser?.uid,
    userProfile?.displayName || 'Admin',
    currentUser?.email || ''
  );

  // Selected User State for Modals
  const [selectedUserForBan, setSelectedUserForBan] = useState<UserDocument | null>(null);
  const [selectedUserForLeaderModal, setSelectedUserForLeaderModal] = useState<UserDocument | null>(null);
  const [selectedLeaderForMembersModal, setSelectedLeaderForMembersModal] = useState<UserDocument | null>(null);
  const [copiedCodeUid, setCopiedCodeUid] = useState<string | null>(null);

  // Bulk Selection State
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isBulkAssignModalOpen, setIsBulkAssignModalOpen] = useState(false);
  const [isBulkBanModalOpen, setIsBulkBanModalOpen] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Quick Chip Selection State
  const [selectedChip, setSelectedChip] = useState<UserFilterStatus>('all');

  const getTeamSize = (leaderUid: string) => {
    return users.filter((u) => u.leaderId === leaderUid).length;
  };

  const getLeaderDetails = (leaderId?: string) => {
    if (!leaderId) return null;
    return users.find((u) => u.uid === leaderId);
  };

  const handleCopyCode = (code?: string, uid?: string) => {
    if (!code || !uid) return;
    navigator.clipboard.writeText(code);
    setCopiedCodeUid(uid);
    toast({ variant: 'success', message: `Leader Code ${code} copied!` });
    setTimeout(() => setCopiedCodeUid(null), 2000);
  };

  // KPI Metrics Summary
  const kpiStats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.isActive && !u.isBanned).length;
    const leaders = users.filter((u) => u.memberType === 'team_leader').length;
    const banned = users.filter((u) => u.isBanned).length;
    const pending = users.filter((u) => u.memberType === 'pending').length;
    return { total, active, leaders, banned, pending };
  }, [users]);

  // Bulk Selection Helpers
  const isAllSelected = filteredUsers.length > 0 && filteredUsers.every((u) => selectedUserIds.includes(u.uid));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filteredUsers.map((u) => u.uid));
    }
  };

  const toggleSelectUser = (uid: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const handleChipClick = (chip: UserFilterStatus) => {
    setSelectedChip(chip);
    setFilterStatus(chip);
  };

  // Bulk Activation / Deactivation Action
  const handleBulkToggleActive = async (newActiveState: boolean) => {
    if (selectedUserIds.length === 0) return;
    try {
      const db = getFirebaseDb();
      const batch = writeBatch(db);
      for (const uid of selectedUserIds) {
        const userRef = doc(db, FIRESTORE_COLLECTIONS.USERS, uid);
        batch.update(userRef, { isActive: newActiveState });
      }
      await batch.commit();

      if (currentUser?.uid) {
        await logAdminActivity({
          action: newActiveState ? 'Bulk Users Activated' : 'Bulk Users Deactivated',
          performedBy: currentUser.uid,
          performedByName: userProfile?.displayName || 'Admin',
          performedByEmail: currentUser.email || '',
          targetType: 'user',
          targetId: 'bulk',
          targetName: `${selectedUserIds.length} user(s)`,
          details: `Active status set to ${newActiveState} for ${selectedUserIds.length} users.`,
          before: {},
          after: { isActive: newActiveState, count: selectedUserIds.length },
        });
      }

      toast({
        variant: newActiveState ? 'success' : 'warning',
        title: 'Bulk Status Updated',
        message: `Set ${selectedUserIds.length} account(s) to ${newActiveState ? 'Active' : 'Deactivated'}.`,
      });
      setSelectedUserIds([]);
    } catch (err) {
      console.error('[handleBulkToggleActive error]', err);
      toast({ variant: 'error', message: 'Failed to update user active states.' });
    }
  };

  // Bulk Ban Action Callback
  const handleConfirmBulkBan = async (targetUserIds: string[], reason: string) => {
    for (const uid of targetUserIds) {
      await banUser(uid, reason);
    }
    setSelectedUserIds([]);
  };

  // Bulk Export CSV Generator
  const handleExportCSV = () => {
    const exportTargets = selectedUserIds.length > 0
      ? users.filter((u) => selectedUserIds.includes(u.uid))
      : filteredUsers;

    if (exportTargets.length === 0) {
      toast({ variant: 'warning', message: 'No users available for CSV export.' });
      return;
    }

    const headers = [
      'UID',
      'Display Name',
      'Email',
      'Phone Number',
      'Role',
      'Member Type',
      'Leader Code',
      'Assigned Leader ID',
      'Status',
      'Is Banned',
      'Ban Reason',
      'Total Tasks Completed',
      'Joined Date',
      'Last Login Date',
    ];

    const rows = exportTargets.map((u) => [
      `"${u.uid}"`,
      `"${u.displayName || ''}"`,
      `"${u.email || ''}"`,
      `"${u.phoneNumber || ''}"`,
      `"${u.role || 'user'}"`,
      `"${u.memberType || 'direct'}"`,
      `"${u.leaderCode || ''}"`,
      `"${u.leaderId || ''}"`,
      `"${u.isBanned ? 'Banned' : u.isActive ? 'Active' : 'Deactivated'}"`,
      `"${u.isBanned ? 'Yes' : 'No'}"`,
      `"${u.banReason || ''}"`,
      `"${u.totalTasksCompleted || 0}"`,
      `"${formatDate(u.createdAt)}"`,
      `"${formatDate(u.lastLoginAt)}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `enterprise_users_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      variant: 'success',
      title: 'CSV Export Complete',
      message: `Exported ${exportTargets.length} user record(s).`,
    });
  };

  const activeFilterCount =
    (filterStatus !== 'all' ? 1 : 0) + (searchQuery ? 1 : 0) + (sortBy !== 'newest' ? 1 : 0);

  return (
    <PageContainer size="xl">
      {/* Page Header */}
      <SectionHeader
        title="Workforce Operations Center"
        subtitle="Enterprise user directory, team assignments, security sanctions, and member financial performance"
      />

      {/* KPI Metric Overview Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <Card className="p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">Total Users</span>
            <span className="text-xl font-extrabold font-mono text-[var(--text-primary)]">{kpiStats.total}</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
            <UsersIcon className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">Active Accounts</span>
            <span className="text-xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">{kpiStats.active}</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <UserCheck className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">Team Leaders</span>
            <span className="text-xl font-extrabold font-mono text-amber-600 dark:text-amber-400">{kpiStats.leaders}</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
            <Award className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">Banned Accounts</span>
            <span className="text-xl font-extrabold font-mono text-rose-600 dark:text-rose-400">{kpiStats.banned}</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
            <Ban className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-between col-span-2 sm:col-span-1">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">Pending Members</span>
            <span className="text-xl font-extrabold font-mono text-indigo-600 dark:text-indigo-400">{kpiStats.pending}</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
            <Clock className="w-5 h-5" />
          </div>
        </Card>
      </div>

      <ContentContainer variant="card" className="space-y-6 p-4 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
        {/* Search, Filter Toolbar & Export Bar */}
        <div className="space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Name, Email, Phone, UID, or Leader Code..."
                className="pl-9 pr-9 text-xs w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 h-10 rounded-xl"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Controls & Filter Bottom Sheet Trigger */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="hidden sm:flex items-center gap-1.5 min-w-[140px]">
                <Filter className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                <Select
                  value={filterStatus}
                  onChange={(val) => {
                    setFilterStatus(val as UserFilterStatus);
                    setSelectedChip(val as UserFilterStatus);
                  }}
                  className="text-xs bg-white dark:bg-slate-900 py-1 h-10 rounded-xl border-slate-200 dark:border-slate-700"
                  options={[
                    { value: 'all', label: 'All Statuses' },
                    { value: 'active', label: 'Active Only' },
                    { value: 'banned', label: 'Banned Only' },
                    { value: 'team_leaders', label: 'Team Leaders' },
                    { value: 'direct_members', label: 'Direct Members' },
                    { value: 'team_members', label: 'Team Members' },
                    { value: 'pending', label: 'Pending Members' },
                    { value: 'admin', label: 'Admins Only' },
                    { value: 'recently_joined', label: 'Recently Joined' },
                  ]}
                />
              </div>

              <div className="hidden sm:flex items-center gap-1.5 min-w-[140px]">
                <ArrowUpDown className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                <Select
                  value={sortBy}
                  onChange={(val) => setSortBy(val as UserSortOption)}
                  className="text-xs bg-white dark:bg-slate-900 py-1 h-10 rounded-xl border-slate-200 dark:border-slate-700"
                  options={[
                    { value: 'newest', label: 'Newest First' },
                    { value: 'oldest', label: 'Oldest First' },
                    { value: 'name', label: 'Name (A-Z)' },
                    { value: 'tasks_completed', label: 'Tasks Completed' },
                  ]}
                />
              </div>

              {/* Mobile Filter Button */}
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(true)}
                className="sm:hidden flex items-center justify-center gap-1.5 px-3 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-[var(--text-primary)]"
              >
                <SlidersHorizontal className="w-4 h-4 text-amber-500" />
                <span>Filter</span>
                {activeFilterCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {/* CSV Export Button */}
              <Button
                type="button"
                variant="outline"
                onClick={handleExportCSV}
                leftIcon={<Download className="w-4 h-4" />}
                className="h-10 text-xs font-bold rounded-xl border-slate-200 dark:border-slate-700 shrink-0"
              >
                Export CSV
              </Button>
            </div>
          </div>

          {/* Quick Filter Search Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-muted)] shrink-0">
              Quick Filter:
            </span>
            {[
              { id: 'all', label: 'All Users' },
              { id: 'team_leaders', label: '👑 Team Leaders' },
              { id: 'direct_members', label: '⚡ Direct Members' },
              { id: 'team_members', label: '👥 Team Members' },
              { id: 'pending', label: '⏳ Pending' },
              { id: 'active', label: '✅ Active' },
              { id: 'banned', label: '⛔ Banned' },
              { id: 'recently_joined', label: '✨ New Joined' },
            ].map((chip) => {
              const isActive = filterStatus === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => handleChipClick(chip.id as UserFilterStatus)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 border ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800/80 text-[var(--text-secondary)] border-slate-200 dark:border-slate-700 hover:text-[var(--text-primary)]'
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bulk Action Header Control Bar */}
        <div className="flex items-center justify-between gap-3 pt-2 pb-1 border-b border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="flex items-center gap-1.5 font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            >
              {isAllSelected ? (
                <CheckSquare className="w-4 h-4 text-amber-500" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>Select All ({filteredUsers.length})</span>
            </button>
            {selectedUserIds.length > 0 && (
              <span className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                {selectedUserIds.length} Selected
              </span>
            )}
          </div>

          <div className="text-[11px] font-mono text-[var(--text-muted)]">
            Showing {filteredUsers.length} of {users.length} accounts
          </div>
        </div>

        {/* Loading Skeleton */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-5 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4 animate-pulse bg-white dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800" />
                    <div className="space-y-2">
                      <div className="h-4 w-36 bg-slate-200 dark:bg-slate-800 rounded" />
                      <div className="h-3 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
                    </div>
                  </div>
                  <div className="h-6 w-20 bg-slate-200 dark:bg-slate-800 rounded-full" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                  <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                  <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                  <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-xl" />
                </div>
              </Card>
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <EmptyState
            icon={<UsersIcon className="w-10 h-10 text-amber-500" />}
            title={users.length === 0 ? 'No User Accounts Provisioned' : 'No Users Match Search Criteria'}
            description={
              users.length === 0
                ? 'User accounts will automatically appear here once members complete registration.'
                : 'Try adjusting your search terms, member type filters, or status settings.'
            }
            action={
              users.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('');
                    setFilterStatus('all');
                    setSelectedChip('all');
                  }}
                  leftIcon={<RotateCcw className="w-4 h-4" />}
                  className="h-10 text-xs font-bold rounded-xl"
                >
                  Clear All Filters
                </Button>
              )
            }
          />
        ) : (
          <div className="space-y-4">
            {filteredUsers.map((user) => {
              const isSelected = selectedUserIds.includes(user.uid);
              const isTeamLeader = user.memberType === 'team_leader';
              const teamSize = getTeamSize(user.uid);
              const isLeaderActive = user.isLeaderActive !== false;
              const assignedLeader = getLeaderDetails(user.leaderId);

              return (
                <Card
                  key={user.uid}
                  className={`p-4 sm:p-5 border rounded-2xl transition-all duration-200 relative overflow-hidden bg-white dark:bg-slate-900 ${
                    isSelected
                      ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-md'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                  }`}
                >
                  {/* Top Bar: Checkbox, Avatar, Name, Role Badges & Status */}
                  <div className="flex flex-wrap items-start justify-between gap-3 pb-3.5 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      {/* Selection Checkbox */}
                      <button
                        type="button"
                        onClick={() => toggleSelectUser(user.uid)}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-amber-500 transition-colors cursor-pointer"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-amber-500" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-300 dark:text-slate-600" />
                        )}
                      </button>

                      <Avatar
                        src={user.photoURL || undefined}
                        fallback={user.displayName || user.email || 'US'}
                        className="w-11 h-11 ring-2 ring-slate-200 dark:ring-slate-700 rounded-full"
                      />

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={`/admin/users/${user.uid}`}
                            className="text-sm sm:text-base font-extrabold text-[var(--text-primary)] hover:text-amber-600 dark:hover:text-amber-400 font-heading transition-colors"
                          >
                            {user.displayName || 'Unnamed User'}
                          </Link>

                          {/* Role Badges */}
                          {user.role === 'admin' && (
                            <Badge variant="accent" size="sm" className="bg-purple-600 text-white font-bold text-[10px]">
                              <Shield className="w-3 h-3 inline mr-1" /> Admin
                            </Badge>
                          )}

                          {isTeamLeader ? (
                            <Badge variant="accent" size="sm" className="bg-amber-500 text-slate-950 font-bold text-[10px]">
                              <Award className="w-3 h-3 inline mr-1" /> Team Leader
                            </Badge>
                          ) : user.memberType === 'direct' ? (
                            <Badge variant="secondary" size="sm" className="text-[10px] font-bold">
                              Direct Member
                            </Badge>
                          ) : user.memberType === 'pending' ? (
                            <Badge variant="warning" size="sm" className="text-[10px] font-bold">
                              Pending Review
                            </Badge>
                          ) : user.memberType === 'team_member' ? (
                            <Badge variant="outline" size="sm" className="text-[10px] font-bold border-indigo-500/30 text-indigo-600 dark:text-indigo-400">
                              Team Member
                            </Badge>
                          ) : (
                            <Badge variant="secondary" size="sm" className="text-[10px] font-bold">
                              Member
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-0.5 text-xs text-[var(--text-secondary)] font-mono flex-wrap">
                          <span>{user.email}</span>
                          <span className="text-[10px] text-[var(--text-muted)] select-all bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                            UID: {user.uid.slice(0, 10)}...
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <div className="flex items-center gap-2">
                      {user.isBanned ? (
                        <Badge variant="danger" className="text-[10px] font-bold px-2.5 py-1">
                          <Ban className="w-3 h-3 inline mr-1" /> Banned
                        </Badge>
                      ) : user.isActive ? (
                        <Badge variant="success" className="text-[10px] font-bold px-2.5 py-1">
                          <UserCheck className="w-3 h-3 inline mr-1" /> Active
                        </Badge>
                      ) : (
                        <Badge variant="warning" className="text-[10px] font-bold px-2.5 py-1">
                          Deactivated
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Team Leader or Assigned Leader Context Box */}
                  {(isTeamLeader || user.leaderId) && (
                    <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                      {isTeamLeader ? (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-extrabold uppercase text-[var(--text-muted)] tracking-wider">
                              Leader Code:
                            </span>
                            <span className="font-mono font-black text-amber-600 dark:text-amber-400">
                              {user.leaderCode || 'NO CODE'}
                            </span>
                            {user.leaderCode && (
                              <button
                                type="button"
                                onClick={() => handleCopyCode(user.leaderCode, user.uid)}
                                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 transition-colors"
                                title="Copy Leader Code"
                              >
                                {copiedCodeUid === user.uid ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => setSelectedLeaderForMembersModal(user)}
                              className="font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer flex items-center gap-1"
                            >
                              <span>{teamSize} Members</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isLeaderActive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                            }`}>
                              {isLeaderActive ? 'Leader Enabled' : 'Leader Disabled'}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center justify-between w-full">
                          <span className="text-[10px] font-extrabold uppercase text-[var(--text-muted)] tracking-wider">
                            Assigned Leader:
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[var(--text-primary)]">
                              {assignedLeader?.displayName || assignedLeader?.email || user.leaderId}
                            </span>
                            {assignedLeader?.leaderCode && (
                              <span className="font-mono text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                                Code: {assignedLeader.leaderCode}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Operational Details Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-3">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] block">Joined Date</span>
                      <span className="font-mono font-medium text-[var(--text-primary)]">{formatDate(user.createdAt)}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] block">Tasks Done</span>
                      <span className="font-mono font-bold text-[var(--text-primary)]">{user.totalTasksCompleted || 0}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] block">Approved Tasks</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{user.approvedTasksCount || 0}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] block">Effective Rate</span>
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                        {user.effectiveReward !== null && user.effectiveReward !== undefined
                          ? `₹${user.effectiveReward}`
                          : 'Task Default'}
                      </span>
                    </div>
                  </div>

                  {user.isBanned && user.banReason && (
                    <div className="mt-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300">
                      <strong>Ban Reason:</strong> {user.banReason}
                    </div>
                  )}

                  {/* Card Actions Footer */}
                  <div className="flex items-center justify-between gap-2 pt-3.5 mt-3 border-t border-slate-100 dark:border-slate-800 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <Link href={`/admin/users/${user.uid}`}>
                        <Button variant="outline" size="sm" className="h-8 text-xs font-bold rounded-lg">
                          <Eye className="w-3.5 h-3.5 mr-1" /> View Profile
                        </Button>
                      </Link>

                      <Link href={`/admin/users/${user.uid}?tab=timeline`}>
                        <Button variant="ghost" size="sm" className="h-8 text-xs rounded-lg text-slate-600 dark:text-slate-400">
                          <History className="w-3.5 h-3.5 mr-1" /> Timeline
                        </Button>
                      </Link>

                      <Link href={`/admin/users/${user.uid}?tab=submissions`}>
                        <Button variant="ghost" size="sm" className="h-8 text-xs rounded-lg text-slate-600 dark:text-slate-400">
                          <FileText className="w-3.5 h-3.5 mr-1" /> Proofs
                        </Button>
                      </Link>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isTeamLeader ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedUserForLeaderModal(user)}
                            className="h-8 text-xs font-bold rounded-lg border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                          >
                            <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit Leader
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleLeaderActiveStatus(user.uid, !isLeaderActive)}
                            className={`h-8 text-xs ${isLeaderActive ? 'text-amber-600' : 'text-emerald-600'}`}
                          >
                            {isLeaderActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedUserForLeaderModal(user)}
                          className="h-8 text-xs font-bold text-amber-600 hover:bg-amber-500/10 rounded-lg"
                        >
                          <UserPlus className="w-3.5 h-3.5 mr-1" /> Promote
                        </Button>
                      )}

                      {user.isBanned ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => unbanUser(user.uid)}
                          className="h-8 text-xs font-bold text-emerald-600 border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-lg"
                        >
                          <RotateCcw className="w-3.5 h-3.5 mr-1" /> Unban
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedUserForBan(user)}
                          className="h-8 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg"
                        >
                          <UserX className="w-3.5 h-3.5 mr-1" /> Ban
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleUserActive(user.uid, !user.isActive)}
                        className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600 rounded-lg"
                        title={user.isActive ? 'Deactivate Account' : 'Reactivate Account'}
                      >
                        <Power className={`w-3.5 h-3.5 ${user.isActive ? 'text-amber-500' : 'text-emerald-500'}`} />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Load More Button */}
        {hasMore && !loading && (
          <div className="flex justify-center mt-6">
            <Button
              onClick={loadMore}
              variant="outline"
              className="px-6 py-2 rounded-xl text-xs font-bold border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-colors"
            >
              Load More Users
            </Button>
          </div>
        )}
      </ContentContainer>

      {/* Floating Sticky Bulk Action Toolbar */}
      <AnimatePresence>
        {selectedUserIds.length > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:w-[620px] bg-slate-900 text-white p-3.5 rounded-2xl shadow-2xl z-50 border border-slate-800 flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 text-xs font-black flex items-center justify-center">
                {selectedUserIds.length}
              </span>
              <span className="text-xs font-bold">Accounts Selected</span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <Button
                type="button"
                size="sm"
                onClick={() => setIsBulkAssignModalOpen(true)}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-bold h-8 px-2.5 rounded-xl"
              >
                <Award className="w-3.5 h-3.5 mr-1" /> Assign Leader
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={() => setIsBulkBanModalOpen(true)}
                className="bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold h-8 px-2.5 rounded-xl"
              >
                <UserX className="w-3.5 h-3.5 mr-1" /> Ban Selected
              </Button>

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleBulkToggleActive(true)}
                className="text-[11px] font-bold h-8 px-2 rounded-xl border-slate-700 text-slate-200 hover:bg-slate-800"
              >
                Activate
              </Button>

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleExportCSV}
                className="text-[11px] font-bold h-8 px-2 rounded-xl border-slate-700 text-slate-200 hover:bg-slate-800"
              >
                CSV
              </Button>

              <button
                type="button"
                onClick={() => setSelectedUserIds([])}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
                title="Clear selection"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Sheet Filters */}
      <AnimatePresence>
        {isMobileFilterOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileFilterOpen(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 md:hidden"
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-t-[28px] z-50 max-h-[85vh] overflow-y-auto shadow-2xl pb-8 md:hidden"
            >
              <div className="sticky top-0 bg-white dark:bg-slate-900 pt-3 pb-2 px-6 flex flex-col items-center border-b border-slate-100 dark:border-slate-800">
                <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mb-3" />
                <div className="w-full flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-[var(--text-primary)]">Filter Users Directory</h3>
                  <button
                    onClick={() => setIsMobileFilterOpen(false)}
                    className="text-xs font-bold text-amber-500 hover:text-amber-600"
                  >
                    Done
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">
                    Account Status
                  </label>
                  <Select
                    value={filterStatus}
                    onChange={(val) => setFilterStatus(val as UserFilterStatus)}
                    options={[
                      { value: 'all', label: 'All Statuses' },
                      { value: 'active', label: 'Active Only' },
                      { value: 'banned', label: 'Banned Only' },
                      { value: 'team_leaders', label: 'Team Leaders' },
                      { value: 'direct_members', label: 'Direct Members' },
                      { value: 'team_members', label: 'Team Members' },
                      { value: 'pending', label: 'Pending Review' },
                    ]}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">
                    Sort Directory By
                  </label>
                  <Select
                    value={sortBy}
                    onChange={(val) => setSortBy(val as UserSortOption)}
                    options={[
                      { value: 'newest', label: 'Newest First' },
                      { value: 'oldest', label: 'Oldest First' },
                      { value: 'name', label: 'Name (A-Z)' },
                      { value: 'tasks_completed', label: 'Tasks Completed' },
                    ]}
                  />
                </div>

                {activeFilterCount > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setFilterStatus('all');
                      setSearchQuery('');
                      setSortBy('newest');
                      setIsMobileFilterOpen(false);
                    }}
                    className="w-full text-xs font-bold border-rose-500/30 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 mt-2"
                  >
                    Reset All Filters
                  </Button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Single Ban User Modal */}
      <BanUserModal
        isOpen={!!selectedUserForBan}
        onClose={() => setSelectedUserForBan(null)}
        user={selectedUserForBan}
        onConfirmBan={banUser}
      />

      {/* Edit / Promote Team Leader Modal */}
      <EditTeamLeaderModal
        isOpen={!!selectedUserForLeaderModal}
        onClose={() => setSelectedUserForLeaderModal(null)}
        user={selectedUserForLeaderModal}
        existingUsers={users}
        onSave={saveTeamLeader}
      />

      {/* View Team Members Modal */}
      <TeamMembersModal
        isOpen={!!selectedLeaderForMembersModal}
        onClose={() => setSelectedLeaderForMembersModal(null)}
        leader={selectedLeaderForMembersModal}
        allUsers={users}
        onUpdateMemberReward={updateMemberReward}
        onApplyBulkReward={bulkUpdateMemberRewards}
      />

      {/* Bulk Assign Leader Modal */}
      <BulkAssignLeaderModal
        isOpen={isBulkAssignModalOpen}
        onClose={() => setIsBulkAssignModalOpen(false)}
        selectedUserIds={selectedUserIds}
        users={users}
        adminUid={currentUser?.uid}
        adminName={userProfile?.displayName || 'Admin'}
        adminEmail={currentUser?.email || ''}
        onSuccess={() => setSelectedUserIds([])}
      />

      {/* Bulk Ban Modal */}
      <BulkBanModal
        isOpen={isBulkBanModalOpen}
        onClose={() => setIsBulkBanModalOpen(false)}
        selectedUserIds={selectedUserIds}
        onConfirmBulkBan={handleConfirmBulkBan}
      />
    </PageContainer>
  );
}
