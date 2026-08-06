'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  UserCheck,
  Search,
  Filter,
  Eye,
  EyeOff,
  Copy,
  Check,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  UserPlus,
  RefreshCw,
  Power,
  RotateCcw,
  Sparkles,
  Layers,
  IndianRupee,
  ShieldCheck,
  AlertCircle,
  SlidersHorizontal,
  ChevronDown,
  X,
  Building2,
  Calendar,
  Briefcase,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/layout/SectionHeader';
import { ContentContainer } from '@/components/layout/ContentContainer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Modal } from '@/components/ui/modal';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { useAdminSubmissions } from '@/hooks/useAdminSubmissions';
import { EditTeamLeaderModal } from '@/components/admin/EditTeamLeaderModal';
import { TeamMembersModal } from '@/components/admin/TeamMembersModal';
import { UserDocument } from '@/types/firestore';
import { formatDate } from '@/utils/formatters';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'motion/react';

type FilterStatus = 'all' | 'active' | 'paused';
type FilterTeamSize = 'all' | 'small' | 'medium' | 'large';
type FilterRewardStatus = 'all' | 'configured' | 'pending';

export default function AdminTeamLeadersPage() {
  const { currentUser, userProfile } = useAuth();
  const { toast } = useToast();

  const {
    users,
    loading: usersLoading,
    saveTeamLeader,
    toggleLeaderActiveStatus,
    updateMemberReward,
    bulkUpdateMemberRewards,
  } = useAdminUsers(
    currentUser?.uid,
    userProfile?.displayName || 'Admin',
    currentUser?.email || ''
  );

  const { submissions, loading: submissionsLoading } = useAdminSubmissions(currentUser?.uid);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterTeamSize, setFilterTeamSize] = useState<FilterTeamSize>('all');
  const [filterRewardStatus, setFilterRewardStatus] = useState<FilterRewardStatus>('all');
  const [selectedSearchChip, setSelectedSearchChip] = useState<string | null>(null);

  // Mobile Bottom Sheet Filter state
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Privacy/Confidentiality Mask State for Reward Overrides
  const [maskedRewards, setMaskedRewards] = useState<Record<string, boolean>>({});

  // Modals state
  const [selectedLeaderForEditModal, setSelectedLeaderForEditModal] = useState<UserDocument | null>(null);
  const [selectedLeaderForMembersModal, setSelectedLeaderForMembersModal] = useState<UserDocument | null>(null);
  const [selectedLeaderForDetailModal, setSelectedLeaderForDetailModal] = useState<UserDocument | null>(null);
  const [detailModalTab, setDetailModalTab] = useState<'overview' | 'assignments' | 'members' | 'rewards' | 'code'>('overview');

  // Candidate promotion modal (to assign a new team leader)
  const [isCandidateModalOpen, setIsCandidateModalOpen] = useState(false);
  const [candidateSearch, setCandidateSearch] = useState('');

  // Copy feedback state
  const [copiedLeaderCode, setCopiedLeaderCode] = useState<string | null>(null);

  // Filter Team Leaders from users array
  const teamLeaders = useMemo(() => {
    return users.filter((u) => u.memberType === 'team_leader' || Boolean(u.leaderCode) || u.isLeaderActive !== undefined);
  }, [users]);

  // Map team members count per leader
  const leaderStatsMap = useMemo(() => {
    const stats: Record<string, { memberCount: number; activeMemberCount: number; pendingReviews: number; totalEarnings: number }> = {};
    
    teamLeaders.forEach((leader) => {
      const leaderMembers = users.filter((u) => u.leaderId === leader.uid);
      const activeMembers = leaderMembers.filter((u) => u.isActive && !u.isBanned);
      
      // Calculate pending reviews for members under this leader
      const memberUids = new Set(leaderMembers.map((m) => m.uid));
      const pendingReviews = submissions.filter((s) => memberUids.has(s.userId) && s.status === 'pending').length;
      const totalEarnings = leaderMembers.reduce((acc, m) => acc + (m.effectiveReward || 0), 0);

      stats[leader.uid] = {
        memberCount: leaderMembers.length,
        activeMemberCount: activeMembers.length,
        pendingReviews,
        totalEarnings,
      };
    });

    return stats;
  }, [teamLeaders, users, submissions]);

  // Executive Overview Summary Metrics
  const summaryMetrics = useMemo(() => {
    const totalLeaders = teamLeaders.length;
    const activeLeaders = teamLeaders.filter((l) => l.isLeaderActive !== false && l.isActive).length;
    const pausedLeaders = totalLeaders - activeLeaders;
    
    const totalTeamMembers = users.filter((u) => Boolean(u.leaderId)).length;
    const avgMembersPerLeader = totalLeaders > 0 ? (totalTeamMembers / totalLeaders).toFixed(1) : '0';

    const pendingRewardConfigs = teamLeaders.filter((l) => !l.effectiveReward && l.effectiveReward !== 0).length;
    const pendingReviewsCount = submissions.filter((s) => s.status === 'pending' && Boolean(s.leaderId)).length;
    const pendingPaymentsCount = submissions.filter((s) => s.paymentStatus === 'requested' || s.paymentStatus === 'processing').length;

    return {
      totalLeaders,
      activeLeaders,
      pausedLeaders,
      totalTeamMembers,
      avgMembersPerLeader,
      pendingRewardConfigs,
      pendingReviewsCount,
      pendingPaymentsCount,
    };
  }, [teamLeaders, users, submissions]);

  // Filtered Leaders List
  const filteredLeaders = useMemo(() => {
    return teamLeaders.filter((leader) => {
      // Text Search
      const query = searchQuery.trim().toLowerCase();
      if (query) {
        const nameMatch = leader.displayName?.toLowerCase().includes(query);
        const emailMatch = leader.email?.toLowerCase().includes(query);
        const phoneMatch = leader.phoneNumber?.includes(query);
        const codeMatch = leader.leaderCode?.toLowerCase().includes(query);
        if (!nameMatch && !emailMatch && !phoneMatch && !codeMatch) return false;
      }

      // Quick Chips Filter
      if (selectedSearchChip === 'active' && (leader.isLeaderActive === false || !leader.isActive)) return false;
      if (selectedSearchChip === 'attention' && leader.isLeaderActive !== false && leader.isActive) return false;
      if (selectedSearchChip === 'large_teams') {
        const count = leaderStatsMap[leader.uid]?.memberCount || 0;
        if (count < 10) return false;
      }

      // Status Filter
      if (filterStatus === 'active' && (leader.isLeaderActive === false || !leader.isActive)) return false;
      if (filterStatus === 'paused' && (leader.isLeaderActive !== false && leader.isActive)) return false;

      // Team Size Filter
      const mCount = leaderStatsMap[leader.uid]?.memberCount || 0;
      if (filterTeamSize === 'small' && (mCount > 5 || mCount === 0)) return false;
      if (filterTeamSize === 'medium' && (mCount <= 5 || mCount > 15)) return false;
      if (filterTeamSize === 'large' && mCount <= 15) return false;

      // Reward Status Filter
      const isConfigured = leader.effectiveReward !== undefined && leader.effectiveReward !== null;
      if (filterRewardStatus === 'configured' && !isConfigured) return false;
      if (filterRewardStatus === 'pending' && isConfigured) return false;

      return true;
    });
  }, [teamLeaders, searchQuery, selectedSearchChip, filterStatus, filterTeamSize, filterRewardStatus, leaderStatsMap]);

  const activeFilterCount = (filterStatus !== 'all' ? 1 : 0) + (filterTeamSize !== 'all' ? 1 : 0) + (filterRewardStatus !== 'all' ? 1 : 0);

  const handleCopyCode = (code?: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedLeaderCode(code);
    toast({ variant: 'success', message: `Leader Code ${code} copied to clipboard!` });
    setTimeout(() => setCopiedLeaderCode(null), 2000);
  };

  const toggleMask = (leaderUid: string) => {
    setMaskedRewards((prev) => ({ ...prev, [leaderUid]: !prev[leaderUid] }));
  };

  const candidateUsers = useMemo(() => {
    return users.filter((u) => {
      if (u.memberType === 'team_leader') return false;
      const query = candidateSearch.trim().toLowerCase();
      if (!query) return true;
      return (
        u.displayName?.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query) ||
        u.phoneNumber?.includes(query)
      );
    });
  }, [users, candidateSearch]);

  const loading = usersLoading || submissionsLoading;

  return (
    <PageContainer size="xl">
      {/* Page Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-bold text-[10px] uppercase tracking-wider border border-amber-500/20">
              Enterprise Operations
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] font-heading tracking-tight">
            Team Leader Management
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
            Monitor active team leaders, assign campaign overrides, manage leader codes & audit team growth
          </p>
        </div>

        <Button
          type="button"
          onClick={() => setIsCandidateModalOpen(true)}
          leftIcon={<UserPlus className="w-4 h-4" />}
          className="bg-slate-900 hover:bg-slate-800 text-white font-bold h-10 px-4 rounded-xl text-xs shrink-0 shadow-sm"
        >
          Promote Team Leader
        </Button>
      </div>

      {/* Summary Widgets Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
        {/* Total Leaders */}
        <Card className="p-3.5 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-xxs">
          <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-muted)] mb-1">
            <span>Total Leaders</span>
            <Building2 className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-lg font-black text-[var(--text-primary)] font-mono">
            {usersLoading ? <Skeleton className="h-6 w-12" /> : summaryMetrics.totalLeaders}
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Registered Team Leaders</p>
        </Card>

        {/* Active Leaders */}
        <Card className="p-3.5 border border-emerald-500/20 rounded-2xl bg-emerald-500/[0.02] dark:bg-emerald-500/[0.05] shadow-xxs">
          <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">
            <span>Active Leaders</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {usersLoading ? <Skeleton className="h-6 w-12" /> : summaryMetrics.activeLeaders}
          </div>
          <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5 font-medium">Operational & Recruiting</p>
        </Card>

        {/* Paused / Attention */}
        <Card className="p-3.5 border border-rose-500/20 rounded-2xl bg-rose-500/[0.02] dark:bg-rose-500/[0.05] shadow-xxs">
          <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-1">
            <span>Needs Attention</span>
            <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <div className="text-lg font-black text-rose-600 dark:text-rose-400 font-mono">
            {usersLoading ? <Skeleton className="h-6 w-12" /> : summaryMetrics.pausedLeaders}
          </div>
          <p className="text-[10px] text-rose-600/80 dark:text-rose-400/80 mt-0.5 font-medium">Paused or Inactive</p>
        </Card>

        {/* Total Members */}
        <Card className="p-3.5 border border-indigo-500/20 rounded-2xl bg-indigo-500/[0.02] dark:bg-indigo-500/[0.05] shadow-xxs">
          <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1">
            <span>Team Network</span>
            <Users className="w-3.5 h-3.5 text-indigo-500" />
          </div>
          <div className="text-lg font-black text-indigo-600 dark:text-indigo-400 font-mono">
            {usersLoading ? <Skeleton className="h-6 w-12" /> : summaryMetrics.totalTeamMembers}
          </div>
          <p className="text-[10px] text-indigo-600/80 dark:text-indigo-400/80 mt-0.5 font-medium">
            Avg {summaryMetrics.avgMembersPerLeader}/Leader
          </p>
        </Card>

        {/* Pending Reviews */}
        <Card className="p-3.5 border border-amber-500/20 rounded-2xl bg-amber-500/[0.02] dark:bg-amber-500/[0.05] shadow-xxs">
          <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">
            <span>Pending Reviews</span>
            <Clock className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-lg font-black text-amber-600 dark:text-amber-400 font-mono">
            {submissionsLoading ? <Skeleton className="h-6 w-12" /> : summaryMetrics.pendingReviewsCount}
          </div>
          <p className="text-[10px] text-amber-600/80 dark:text-amber-400/80 mt-0.5 font-medium">Task Proof Submissions</p>
        </Card>

        {/* Pending Payouts */}
        <Card className="p-3.5 border border-sky-500/20 rounded-2xl bg-sky-500/[0.02] dark:bg-sky-500/[0.05] shadow-xxs col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-sky-600 dark:text-sky-400 mb-1">
            <span>Pending Payouts</span>
            <IndianRupee className="w-3.5 h-3.5 text-sky-500" />
          </div>
          <div className="text-lg font-black text-sky-600 dark:text-sky-400 font-mono">
            {submissionsLoading ? <Skeleton className="h-6 w-12" /> : summaryMetrics.pendingPaymentsCount}
          </div>
          <p className="text-[10px] text-sky-600/80 dark:text-sky-400/80 mt-0.5 font-medium">Claim Requests</p>
        </Card>
      </div>

      {/* Toolbar & Filters Section */}
      <ContentContainer variant="card" className="p-4 space-y-3.5 rounded-2xl border shadow-xs mb-6">
        {/* Desktop Controls */}
        <div className="hidden md:grid md:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="col-span-5 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search leader by Name, Code, Email or Phone..."
              className="pl-9 text-xs h-10 w-full"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="col-span-2">
            <Select
              value={filterStatus}
              onChange={(val) => setFilterStatus(val as FilterStatus)}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'active', label: 'Active Leaders' },
                { value: 'paused', label: 'Paused / Inactive' },
              ]}
            />
          </div>

          {/* Team Size Filter */}
          <div className="col-span-2">
            <Select
              value={filterTeamSize}
              onChange={(val) => setFilterTeamSize(val as FilterTeamSize)}
              options={[
                { value: 'all', label: 'All Team Sizes' },
                { value: 'small', label: '1 - 5 Members' },
                { value: 'medium', label: '5 - 15 Members' },
                { value: 'large', label: '15+ Members' },
              ]}
            />
          </div>

          {/* Reward Config Status */}
          <div className="col-span-3">
            <Select
              value={filterRewardStatus}
              onChange={(val) => setFilterRewardStatus(val as FilterRewardStatus)}
              options={[
                { value: 'all', label: 'All Reward Configs' },
                { value: 'configured', label: 'Custom Reward Set' },
                { value: 'pending', label: 'Default / Pending' },
              ]}
            />
          </div>
        </div>

        {/* Mobile Search & Bottom Sheet Filter Trigger */}
        <div className="grid grid-cols-12 gap-2.5 md:hidden">
          <div className="col-span-12 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search leader name, code, email..."
              className="pl-9 text-xs h-10 w-full"
            />
          </div>

          <div className="col-span-12 flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsMobileFilterOpen(true)}
              leftIcon={<SlidersHorizontal className="w-3.5 h-3.5 text-amber-500" />}
              className="flex-1 text-xs font-bold h-10 border-slate-200"
            >
              Filter Options
              {activeFilterCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black font-mono">
                  {activeFilterCount}
                </span>
              )}
            </Button>

            {(searchQuery || activeFilterCount > 0 || selectedSearchChip) && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setFilterStatus('all');
                  setFilterTeamSize('all');
                  setFilterRewardStatus('all');
                  setSelectedSearchChip(null);
                }}
                className="text-xs font-bold h-10 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20"
              >
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Quick Search Chips */}
        <div className="flex items-center gap-2 pt-1 overflow-x-auto scrollbar-none text-xs">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-muted)] shrink-0 mr-1">
            Quick Filters:
          </span>
          <button
            onClick={() => setSelectedSearchChip(selectedSearchChip === 'active' ? null : 'active')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 ${
              selectedSearchChip === 'active'
                ? 'bg-emerald-500 text-slate-950'
                : 'bg-slate-100 dark:bg-slate-800 text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Active Leaders
          </button>
          <button
            onClick={() => setSelectedSearchChip(selectedSearchChip === 'attention' ? null : 'attention')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 ${
              selectedSearchChip === 'attention'
                ? 'bg-rose-500 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Needs Attention
          </button>
          <button
            onClick={() => setSelectedSearchChip(selectedSearchChip === 'large_teams' ? null : 'large_teams')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 ${
              selectedSearchChip === 'large_teams'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            Large Teams (&gt;10)
          </button>
        </div>
      </ContentContainer>

      {/* Leader Directory List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-5 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-4 animate-pulse bg-white dark:bg-slate-900">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800" />
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
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
      ) : filteredLeaders.length === 0 ? (
        <ContentContainer variant="card" className="p-8 sm:p-12 rounded-2xl border text-center max-w-xl mx-auto my-6 shadow-xs bg-white dark:bg-slate-900">
          <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-500/20 text-amber-500">
            <UserCheck className="w-8 h-8" />
          </div>
          <h3 className="text-base font-extrabold text-[var(--text-primary)]">
            {teamLeaders.length === 0 ? 'No Team Leaders Provisioned Yet' : 'No Team Leaders Match Search Criteria'}
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-2 mb-6 max-w-xs mx-auto leading-relaxed">
            {teamLeaders.length === 0
              ? 'Promote an existing user to a Team Leader role to assign leader codes and manage team structures.'
              : 'Try clearing your search terms or adjusting the status & team size filters.'}
          </p>
          <div className="flex justify-center gap-3">
            {teamLeaders.length === 0 ? (
              <Button
                type="button"
                onClick={() => setIsCandidateModalOpen(true)}
                leftIcon={<UserPlus className="w-4 h-4" />}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold h-10 px-4 rounded-xl text-xs"
              >
                Promote User Now
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setFilterStatus('all');
                  setFilterTeamSize('all');
                  setFilterRewardStatus('all');
                  setSelectedSearchChip(null);
                }}
                leftIcon={<RotateCcw className="w-4 h-4" />}
                className="h-10 text-xs font-bold rounded-xl"
              >
                Reset All Filters
              </Button>
            )}
          </div>
        </ContentContainer>
      ) : (
        <div className="space-y-4">
          {filteredLeaders.map((leader) => {
            const stats = leaderStatsMap[leader.uid] || { memberCount: 0, activeMemberCount: 0, pendingReviews: 0, totalEarnings: 0 };
            const isMasked = maskedRewards[leader.uid] ?? true;
            const isLeaderActive = leader.isLeaderActive !== false && leader.isActive;

            return (
              <Card
                key={leader.uid}
                className="p-4 sm:p-5 border border-slate-200 dark:border-slate-800 rounded-2xl transition-all duration-200 hover:shadow-md bg-white dark:bg-slate-900 relative overflow-hidden"
              >
                {/* Header: User Profile, Leader Code & Action Badge */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={leader.photoURL || undefined}
                      fallback={leader.displayName || leader.email || 'TL'}
                      className="w-11 h-11 ring-2 ring-amber-500/20 rounded-full"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm sm:text-base font-extrabold text-[var(--text-primary)] font-heading">
                          {leader.displayName || 'Unnamed Leader'}
                        </h3>
                        <Badge
                          variant={isLeaderActive ? 'success' : 'danger'}
                          className="text-[10px] font-bold px-2 py-0.5"
                        >
                          {isLeaderActive ? 'Active' : 'Paused'}
                        </Badge>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] font-mono">{leader.email}</p>
                    </div>
                  </div>

                  {/* Leader Code Pill & Quick Copy */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] tracking-wider">Code:</span>
                      <span className="text-xs font-mono font-black text-amber-600 dark:text-amber-400">
                        {leader.leaderCode || 'NO CODE'}
                      </span>
                      {leader.leaderCode && (
                        <button
                          type="button"
                          onClick={() => handleCopyCode(leader.leaderCode)}
                          className="ml-1 p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-500 transition-colors"
                          title="Copy Leader Code"
                        >
                          {copiedLeaderCode === leader.leaderCode ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Key Performance Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3.5 border-b border-slate-100 dark:border-slate-800 text-xs">
                  {/* Total Members */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-0.5">
                      Team Members
                    </span>
                    <span className="text-sm font-black font-mono text-[var(--text-primary)]">
                      {stats.memberCount}{' '}
                      <span className="text-[10px] font-normal text-emerald-600 dark:text-emerald-400">
                        ({stats.activeMemberCount} Active)
                      </span>
                    </span>
                  </div>

                  {/* Pending Reviews */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-0.5">
                      Pending Reviews
                    </span>
                    <span className={`text-sm font-black font-mono ${stats.pendingReviews > 0 ? 'text-amber-500' : 'text-slate-600'}`}>
                      {stats.pendingReviews} Submissions
                    </span>
                  </div>

                  {/* Effective Member Reward Override */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-0.5">
                      Member Payout Split
                    </span>
                    <span className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">
                      {leader.effectiveReward !== undefined && leader.effectiveReward !== null
                        ? `₹${leader.effectiveReward}`
                        : 'Default Task Rate'}
                    </span>
                  </div>

                  {/* Joining Date */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-0.5">
                      Assigned Date
                    </span>
                    <span className="text-xs font-medium text-[var(--text-secondary)]">
                      {formatDate(leader.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Reward Confidentiality Protection Banner */}
                <div className="py-2.5 px-3 rounded-xl bg-amber-500/[0.03] dark:bg-amber-500/[0.05] border border-amber-500/20 my-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium text-[11px]">
                      Confidential Reward Breakdown:
                    </span>
                    <span className="font-mono text-xs font-bold text-[var(--text-primary)]">
                      {isMasked ? '••••••••••' : `Leader Commission Cut + Member ₹${leader.effectiveReward ?? 'Default'}`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleMask(leader.uid)}
                    className="flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline shrink-0"
                  >
                    {isMasked ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span>{isMasked ? 'Reveal Confidential' : 'Hide'}</span>
                  </button>
                </div>

                {/* Quick Actions Footer Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* View Profile */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedLeaderForDetailModal(leader);
                        setDetailModalTab('overview');
                      }}
                      className="text-xs font-bold h-9 rounded-xl border-slate-200"
                    >
                      View Profile
                    </Button>

                    {/* Team Members List */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedLeaderForMembersModal(leader)}
                      leftIcon={<Users className="w-3.5 h-3.5 text-indigo-500" />}
                      className="text-xs font-bold h-9 rounded-xl border-slate-200"
                    >
                      Team ({stats.memberCount})
                    </Button>

                    {/* Edit Leader & Code */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedLeaderForEditModal(leader)}
                      leftIcon={<Award className="w-3.5 h-3.5 text-amber-500" />}
                      className="text-xs font-bold h-9 rounded-xl border-slate-200"
                    >
                      Configure Code
                    </Button>
                  </div>

                  {/* Active Toggle Action */}
                  <Button
                    type="button"
                    variant={isLeaderActive ? 'danger' : 'success'}
                    size="sm"
                    onClick={async () => {
                      try {
                        await toggleLeaderActiveStatus(leader.uid, isLeaderActive);
                        toast({
                          variant: 'success',
                          message: `Leader ${leader.displayName || 'Leader'} is now ${isLeaderActive ? 'Paused' : 'Active'}.`,
                        });
                      } catch {
                        toast({ variant: 'error', message: 'Failed to toggle leader status.' });
                      }
                    }}
                    leftIcon={<Power className="w-3.5 h-3.5" />}
                    className="text-xs font-bold h-9 rounded-xl"
                  >
                    {isLeaderActive ? 'Pause Leader' : 'Reactivate Leader'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Leader Code & Settings Modal */}
      <EditTeamLeaderModal
        isOpen={Boolean(selectedLeaderForEditModal)}
        onClose={() => setSelectedLeaderForEditModal(null)}
        user={selectedLeaderForEditModal}
        existingUsers={users}
        onSave={async (targetUserId, leaderCode, isLeaderActive, memberType) => {
          await saveTeamLeader(targetUserId, leaderCode, isLeaderActive, memberType);
          setSelectedLeaderForEditModal(null);
        }}
      />

      {/* Team Members Modal */}
      <TeamMembersModal
        isOpen={Boolean(selectedLeaderForMembersModal)}
        onClose={() => setSelectedLeaderForMembersModal(null)}
        leader={selectedLeaderForMembersModal}
        allUsers={users}
        onUpdateMemberReward={updateMemberReward}
        onApplyBulkReward={bulkUpdateMemberRewards}
      />

      {/* Promote User Candidate Modal */}
      <Modal
        isOpen={isCandidateModalOpen}
        onClose={() => setIsCandidateModalOpen(false)}
        title="Promote User to Team Leader"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-[var(--text-secondary)]">
            Select an existing user account from your directory to elevate into a Team Leader with a unique referral code.
          </p>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <Input
              value={candidateSearch}
              onChange={(e) => setCandidateSearch(e.target.value)}
              placeholder="Search user by name or email..."
              className="pl-9 text-xs h-10 w-full"
            />
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100 dark:divide-slate-800">
            {candidateUsers.slice(0, 15).map((u) => (
              <div key={u.uid} className="pt-2 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Avatar src={u.photoURL || undefined} fallback={u.displayName || 'U'} className="w-8 h-8" />
                  <div>
                    <h4 className="text-xs font-bold text-[var(--text-primary)]">{u.displayName || 'User'}</h4>
                    <span className="text-[10px] font-mono text-[var(--text-muted)] block">{u.email}</span>
                  </div>
                </div>

                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setIsCandidateModalOpen(false);
                    setSelectedLeaderForEditModal(u);
                  }}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold h-8 px-3 rounded-lg"
                >
                  Select Candidate
                </Button>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Detailed Team Leader Profile & Assignments Modal */}
      <Modal
        isOpen={Boolean(selectedLeaderForDetailModal)}
        onClose={() => setSelectedLeaderForDetailModal(null)}
        title={selectedLeaderForDetailModal?.displayName ? `${selectedLeaderForDetailModal.displayName} — Profile` : 'Leader Profile'}
        size="xl"
      >
        {selectedLeaderForDetailModal && (
          <div className="space-y-5">
            {/* Header Profile Banner */}
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <Avatar
                src={selectedLeaderForDetailModal.photoURL || undefined}
                fallback={selectedLeaderForDetailModal.displayName || 'TL'}
                className="w-14 h-14 ring-2 ring-amber-500/30 rounded-full shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-[var(--text-primary)] truncate">
                    {selectedLeaderForDetailModal.displayName || 'Team Leader'}
                  </h3>
                  <Badge variant={selectedLeaderForDetailModal.isLeaderActive !== false ? 'success' : 'danger'}>
                    {selectedLeaderForDetailModal.isLeaderActive !== false ? 'Active' : 'Paused'}
                  </Badge>
                </div>
                <p className="text-xs text-[var(--text-secondary)] font-mono">{selectedLeaderForDetailModal.email}</p>
                <div className="flex items-center gap-3 mt-1.5 text-[11px] text-[var(--text-muted)]">
                  <span>Code: <strong className="font-mono text-amber-500">{selectedLeaderForDetailModal.leaderCode || 'None'}</strong></span>
                  <span>Joined: {formatDate(selectedLeaderForDetailModal.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 text-xs font-bold overflow-x-auto scrollbar-none">
              <button
                onClick={() => setDetailModalTab('overview')}
                className={`px-3.5 py-2 border-b-2 transition-colors whitespace-nowrap ${
                  detailModalTab === 'overview'
                    ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-extrabold'
                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setDetailModalTab('assignments')}
                className={`px-3.5 py-2 border-b-2 transition-colors whitespace-nowrap ${
                  detailModalTab === 'assignments'
                    ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-extrabold'
                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                Assignments & Tasks
              </button>
              <button
                onClick={() => setDetailModalTab('rewards')}
                className={`px-3.5 py-2 border-b-2 transition-colors whitespace-nowrap ${
                  detailModalTab === 'rewards'
                    ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-extrabold'
                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                Reward Overrides
              </button>
              <button
                onClick={() => setDetailModalTab('code')}
                className={`px-3.5 py-2 border-b-2 transition-colors whitespace-nowrap ${
                  detailModalTab === 'code'
                    ? 'border-amber-500 text-amber-600 dark:text-amber-400 font-extrabold'
                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                Leader Code & Status
              </button>
            </div>

            {/* Tab Contents */}
            {detailModalTab === 'overview' && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border">
                    <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block">Phone</span>
                    <span className="font-mono text-xs text-[var(--text-primary)]">{selectedLeaderForDetailModal.phoneNumber || 'N/A'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border">
                    <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block">UPI ID</span>
                    <span className="font-mono text-xs text-[var(--text-primary)]">{selectedLeaderForDetailModal.upiId || 'Not Configured'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border col-span-2 sm:col-span-1">
                    <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] block">Account Holder</span>
                    <span className="text-xs text-[var(--text-primary)]">{selectedLeaderForDetailModal.accountHolder || 'N/A'}</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <h4 className="font-extrabold text-[var(--text-primary)] text-xs uppercase tracking-wider">Bank Details for Payouts</h4>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-[var(--text-secondary)]">
                    <div>Bank: <span className="font-semibold text-[var(--text-primary)]">{selectedLeaderForDetailModal.bankName || '—'}</span></div>
                    <div>A/C Number: <span className="font-mono font-semibold text-[var(--text-primary)]">{selectedLeaderForDetailModal.accountNumber || '—'}</span></div>
                    <div>IFSC: <span className="font-mono font-semibold text-[var(--text-primary)]">{selectedLeaderForDetailModal.ifscCode || '—'}</span></div>
                  </div>
                </div>
              </div>
            )}

            {detailModalTab === 'assignments' && (
              <div className="space-y-3 text-xs">
                <p className="text-[var(--text-secondary)]">
                  Campaign tasks assigned to team members under code <strong className="font-mono text-amber-500">{selectedLeaderForDetailModal.leaderCode}</strong>.
                </p>
                <div className="p-4 rounded-2xl border bg-slate-50 dark:bg-slate-800 text-center">
                  <Briefcase className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                  <h4 className="font-bold text-[var(--text-primary)]">All Live Tasks Accessible to Team</h4>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-1">
                    Team members earn commissions automatically upon task approval.
                  </p>
                </div>
              </div>
            )}

            {detailModalTab === 'rewards' && (
              <div className="space-y-3 text-xs">
                <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/[0.03] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[var(--text-primary)]">Leader Member Reward Rate</span>
                    <span className="font-mono text-sm font-black text-emerald-600 dark:text-emerald-400">
                      {selectedLeaderForDetailModal.effectiveReward ? `₹${selectedLeaderForDetailModal.effectiveReward}` : 'Default Rate'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    You can override member payouts across all tasks assigned under this leader from the Team Members view.
                  </p>
                </div>
              </div>
            )}

            {detailModalTab === 'code' && (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between p-4 rounded-2xl border bg-slate-50 dark:bg-slate-800">
                  <div>
                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">Leader Code</span>
                    <div className="text-base font-black font-mono text-amber-500">
                      {selectedLeaderForDetailModal.leaderCode || 'No Code Assigned'}
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleCopyCode(selectedLeaderForDetailModal.leaderCode)}
                    leftIcon={<Copy className="w-3.5 h-3.5" />}
                    className="bg-slate-900 text-white text-xs font-bold h-9 px-3 rounded-xl"
                  >
                    Copy Code
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Mobile Filter Options Bottom Sheet */}
      <AnimatePresence>
        {isMobileFilterOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileFilterOpen(false)}
              className="fixed inset-0 bg-slate-950/60 z-50 backdrop-blur-xs md:hidden"
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
                  <h3 className="text-sm font-extrabold text-[var(--text-primary)]">Filter Team Leaders</h3>
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
                    Operational Status
                  </label>
                  <Select
                    value={filterStatus}
                    onChange={(val) => setFilterStatus(val as FilterStatus)}
                    options={[
                      { value: 'all', label: 'All Statuses' },
                      { value: 'active', label: 'Active Leaders' },
                      { value: 'paused', label: 'Paused / Inactive' },
                    ]}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">
                    Team Size
                  </label>
                  <Select
                    value={filterTeamSize}
                    onChange={(val) => setFilterTeamSize(val as FilterTeamSize)}
                    options={[
                      { value: 'all', label: 'All Team Sizes' },
                      { value: 'small', label: '1 - 5 Members' },
                      { value: 'medium', label: '5 - 15 Members' },
                      { value: 'large', label: '15+ Members' },
                    ]}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">
                    Reward Override Status
                  </label>
                  <Select
                    value={filterRewardStatus}
                    onChange={(val) => setFilterRewardStatus(val as FilterRewardStatus)}
                    options={[
                      { value: 'all', label: 'All Reward Configs' },
                      { value: 'configured', label: 'Custom Reward Set' },
                      { value: 'pending', label: 'Default / Pending' },
                    ]}
                  />
                </div>

                {activeFilterCount > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setFilterStatus('all');
                      setFilterTeamSize('all');
                      setFilterRewardStatus('all');
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
    </PageContainer>
  );
}
