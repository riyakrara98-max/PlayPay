'use client';

import React, { useState, useMemo } from 'react';
import { Users, UserCheck, Clock, Search, Filter, ArrowUpDown, AlertCircle, RefreshCw } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTeamLeaderMembers } from '@/hooks/useTeamLeaderMembers';
import { TeamMemberCard } from '@/components/team-leader/TeamMemberCard';
import { MemberSkeleton } from '@/components/team-leader/MemberSkeleton';

type FilterType = 'all' | 'active' | 'pending';
type SortType = 'newest' | 'oldest' | 'name_asc' | 'name_desc';

export default function TeamLeaderMembersPage() {
  const { members, stats, loading, error } = useTeamLeaderMembers();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortType, setSortType] = useState<SortType>('newest');

  // Filter and Sort Logic
  const filteredAndSortedMembers = useMemo(() => {
    return members
      .filter((m) => {
        // Search Filter (Display Name or Email)
        const q = searchQuery.trim().toLowerCase();
        if (q) {
          const name = (m.displayName || '').toLowerCase();
          const email = (m.email || '').toLowerCase();
          if (!name.includes(q) && !email.includes(q)) {
            return false;
          }
        }

        // Status / Type Filter
        if (filterType === 'active') {
          return m.isActive && !m.isBanned;
        }
        if (filterType === 'pending') {
          return m.memberType === 'pending';
        }

        return true;
      })
      .sort((a, b) => {
        if (sortType === 'newest') {
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        }
        if (sortType === 'oldest') {
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        }
        if (sortType === 'name_asc') {
          return (a.displayName || a.email || '').localeCompare(b.displayName || b.email || '');
        }
        if (sortType === 'name_desc') {
          return (b.displayName || b.email || '').localeCompare(a.displayName || a.email || '');
        }
        return 0;
      });
  }, [members, searchQuery, filterType, sortType]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">My Members</h1>
            <p className="text-xs text-slate-400">Members assigned to your team.</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-[var(--bg-card,#1e293b)] border-[var(--border-color,rgba(255,255,255,0.1))] flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Total Members</p>
            <h3 className="text-xl font-extrabold text-slate-100">{loading ? '...' : stats.total}</h3>
          </div>
        </Card>

        <Card className="p-4 bg-[var(--bg-card,#1e293b)] border-[var(--border-color,rgba(255,255,255,0.1))] flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Active Members</p>
            <h3 className="text-xl font-extrabold text-slate-100">{loading ? '...' : stats.active}</h3>
          </div>
        </Card>

        <Card className="p-4 bg-[var(--bg-card,#1e293b)] border-[var(--border-color,rgba(255,255,255,0.1))] flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-400">Pending Members</p>
            <h3 className="text-xl font-extrabold text-slate-100">{loading ? '...' : stats.pending}</h3>
          </div>
        </Card>
      </div>

      {/* Search, Filter & Sort Bar */}
      <Card className="p-4 bg-[var(--bg-card,#1e293b)] border-[var(--border-color,rgba(255,255,255,0.1))] space-y-3 sm:space-y-0 sm:flex sm:items-center sm:gap-4 justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900/60 border border-slate-700/60 rounded-xl text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-900/60 border border-slate-700/60 rounded-xl px-3 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as FilterType)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-slate-200">All Members</option>
              <option value="active" className="bg-slate-900 text-slate-200">Active</option>
              <option value="pending" className="bg-slate-900 text-slate-200">Pending</option>
            </select>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-900/60 border border-slate-700/60 rounded-xl px-3 py-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={sortType}
              onChange={(e) => setSortType(e.target.value as SortType)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="newest" className="bg-slate-900 text-slate-200">Newest First</option>
              <option value="oldest" className="bg-slate-900 text-slate-200">Oldest First</option>
              <option value="name_asc" className="bg-slate-900 text-slate-200">Name (A-Z)</option>
              <option value="name_desc" className="bg-slate-900 text-slate-200">Name (Z-A)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Member Cards Grid / States */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <MemberSkeleton />
          <MemberSkeleton />
          <MemberSkeleton />
          <MemberSkeleton />
        </div>
      ) : error ? (
        <Card className="p-8 text-center bg-red-500/5 border-red-500/20 text-red-400 space-y-3">
          <AlertCircle className="w-8 h-8 mx-auto" />
          <h3 className="font-bold text-sm">Unable to Load Members</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Retry
          </Button>
        </Card>
      ) : filteredAndSortedMembers.length === 0 ? (
        <Card className="p-12 text-center bg-[var(--bg-card,#1e293b)] border-[var(--border-color,rgba(255,255,255,0.1))]">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-200 text-base mb-1">
            {members.length === 0 ? 'No members assigned yet.' : 'No members found matching your search.'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {members.length === 0
              ? 'When members use your Leader Code during registration or enrollment, they will appear here.'
              : 'Try adjusting your search query or filter settings.'}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedMembers.map((member) => (
            <TeamMemberCard key={member.uid} member={member} />
          ))}
        </div>
      )}
    </div>
  );
}
