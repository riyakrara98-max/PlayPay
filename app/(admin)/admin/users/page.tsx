'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  MoreVertical,
  Eye,
  Edit3,
  Award,
  UserCheck,
  UserX,
  Power,
  RotateCcw,
  Ban,
  Shield,
  X,
} from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Dropdown } from '@/components/ui/dropdown';
import { useAuth } from '@/hooks/useAuth';
import { useAdminUsers, UserFilterStatus } from '@/hooks/useAdminUsers';
import { BanUserModal } from '@/components/admin/BanUserModal';
import { EditTeamLeaderModal } from '@/components/admin/EditTeamLeaderModal';
import { EditUserModal } from '@/components/admin/EditUserModal';
import { BulkAssignLeaderModal } from '@/components/admin/BulkAssignLeaderModal';
import { UserDocument } from '@/types/firestore';
import { formatDate } from '@/utils/formatters';

export default function AdminUsersPage() {
  const { currentUser, userProfile } = useAuth();
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
    banUser,
    unbanUser,
    toggleUserActive,
    saveTeamLeader,
  } = useAdminUsers(
    currentUser?.uid,
    userProfile?.displayName || 'Admin',
    currentUser?.email || ''
  );

  // Modal states
  const [selectedUserForBan, setSelectedUserForBan] = useState<UserDocument | null>(null);
  const [selectedUserForLeaderModal, setSelectedUserForLeaderModal] = useState<UserDocument | null>(null);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<UserDocument | null>(null);
  const [selectedUserForAssignLeader, setSelectedUserForAssignLeader] = useState<UserDocument | null>(null);

  const getRoleLabel = (user: UserDocument) => {
    if (user.role === 'admin') return 'Admin';
    if (user.memberType === 'team_leader') return 'Team Leader';
    if (user.memberType === 'pending') return 'Pending';
    return 'Member';
  };

  const getRoleBadge = (user: UserDocument) => {
    if (user.role === 'admin') {
      return (
        <Badge variant="accent" size="sm" className="bg-purple-600 text-white font-bold text-[10px]">
          <Shield className="w-3 h-3 mr-1" /> Admin
        </Badge>
      );
    }
    if (user.memberType === 'team_leader') {
      return (
        <Badge variant="accent" size="sm" className="bg-amber-500 text-slate-950 font-bold text-[10px]">
          <Award className="w-3 h-3 mr-1" /> Team Leader
        </Badge>
      );
    }
    if (user.memberType === 'pending') {
      return (
        <Badge variant="warning" size="sm" className="text-[10px] font-bold">
          Pending
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" size="sm" className="text-[10px] font-bold">
        Member
      </Badge>
    );
  };

  const getStatusBadge = (user: UserDocument) => {
    if (user.isBanned) {
      return (
        <Badge variant="danger" className="text-[10px] font-bold px-2 py-0.5">
          <Ban className="w-3 h-3 mr-1" /> Banned
        </Badge>
      );
    }
    if (user.isActive) {
      return (
        <Badge variant="success" className="text-[10px] font-bold px-2 py-0.5">
          <UserCheck className="w-3 h-3 mr-1" /> Active
        </Badge>
      );
    }
    return (
      <Badge variant="warning" className="text-[10px] font-bold px-2 py-0.5">
        Deactivated
      </Badge>
    );
  };

  const filters: { id: UserFilterStatus; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'direct_members', label: 'Members' },
    { id: 'team_leaders', label: 'Team Leaders' },
    { id: 'admin', label: 'Admins' },
    { id: 'pending', label: 'Pending' },
  ];

  return (
    <PageContainer size="xl" className="py-4 space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] font-heading">
          Users
        </h1>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search users..."
          className="pl-9 pr-9 text-xs w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 h-10 rounded-xl"
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

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        {filters.map((f) => {
          const isActive = filterStatus === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilterStatus(f.id)}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all shrink-0 border ${
                isActive
                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                  : 'bg-white dark:bg-slate-900 text-[var(--text-secondary)] border-slate-200 dark:border-slate-800 hover:text-[var(--text-primary)]'
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* User Directory Table / List */}
      <Card className="p-0 overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between gap-3 animate-pulse">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center">
            <EmptyState
              title="No users found"
              action={
                (searchQuery || filterStatus !== 'all') && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('');
                      setFilterStatus('all');
                    }}
                    className="text-xs font-bold rounded-xl mt-2"
                  >
                    Clear filters
                  </Button>
                )
              }
            />
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {/* Desktop Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-3 px-4 py-2.5 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
              <div className="col-span-4">User</div>
              <div className="col-span-2">Role</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-3">Joined Date</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>

            {/* User Rows */}
            {filteredUsers.map((user) => {
              const menuSections = [
                {
                  items: [
                    {
                      id: 'view',
                      label: 'View User',
                      icon: <Eye className="w-3.5 h-3.5" />,
                      onClick: () => {
                        window.location.href = `/admin/users/${user.uid}`;
                      },
                    },
                    {
                      id: 'edit',
                      label: 'Edit User',
                      icon: <Edit3 className="w-3.5 h-3.5" />,
                      onClick: () => setSelectedUserForEdit(user),
                    },
                    {
                      id: 'role',
                      label: user.memberType === 'team_leader' ? 'Edit Leader Settings' : 'Change Role / Promote',
                      icon: <Award className="w-3.5 h-3.5" />,
                      onClick: () => setSelectedUserForLeaderModal(user),
                    },
                    {
                      id: 'assign_leader',
                      label: 'Assign Team Leader',
                      icon: <UserCheck className="w-3.5 h-3.5" />,
                      onClick: () => setSelectedUserForAssignLeader(user),
                    },
                    {
                      id: 'toggle_active',
                      label: user.isActive ? 'Deactivate' : 'Activate',
                      icon: <Power className="w-3.5 h-3.5" />,
                      onClick: () => toggleUserActive(user.uid, !user.isActive),
                    },
                    ...(user.isBanned
                      ? [
                          {
                            id: 'unban',
                            label: 'Unban User',
                            icon: <RotateCcw className="w-3.5 h-3.5" />,
                            onClick: () => unbanUser(user.uid),
                          },
                        ]
                      : [
                          {
                            id: 'ban',
                            label: 'Ban User',
                            icon: <UserX className="w-3.5 h-3.5" />,
                            danger: true,
                            onClick: () => setSelectedUserForBan(user),
                          },
                        ]),
                  ],
                },
              ];

              return (
                <div
                  key={user.uid}
                  className="p-3.5 md:px-4 md:py-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors flex flex-col md:grid md:grid-cols-12 md:gap-3 md:items-center justify-between"
                >
                  {/* Mobile Top Row / Desktop User Info */}
                  <div className="md:col-span-4 flex items-center justify-between md:justify-start gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar
                        src={user.photoURL || undefined}
                        fallback={user.displayName || user.email || 'US'}
                        className="w-10 h-10 rounded-full shrink-0"
                      />
                      <div className="min-w-0">
                        <Link
                          href={`/admin/users/${user.uid}`}
                          className="text-xs font-bold text-[var(--text-primary)] hover:text-amber-600 dark:hover:text-amber-400 truncate block font-heading"
                        >
                          {user.displayName || 'Unnamed User'}
                        </Link>
                        <p className="text-[11px] text-[var(--text-muted)] font-mono truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    {/* Mobile Only Menu Trigger */}
                    <div className="md:hidden">
                      <Dropdown
                        align="right"
                        trigger={
                          <button
                            type="button"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        }
                        sections={menuSections}
                      />
                    </div>
                  </div>

                  {/* Mobile Info Grid & Desktop Columns */}
                  <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/40 md:mt-0 md:pt-0 md:border-0 md:col-span-7 grid grid-cols-3 md:grid-cols-7 gap-2 items-center text-xs">
                    <div className="md:col-span-2">
                      <span className="text-[10px] text-[var(--text-muted)] block md:hidden uppercase font-semibold">
                        Role
                      </span>
                      {getRoleBadge(user)}
                    </div>

                    <div className="md:col-span-2">
                      <span className="text-[10px] text-[var(--text-muted)] block md:hidden uppercase font-semibold">
                        Status
                      </span>
                      {getStatusBadge(user)}
                    </div>

                    <div className="md:col-span-3 font-mono text-[11px] text-[var(--text-secondary)]">
                      <span className="text-[10px] text-[var(--text-muted)] block md:hidden uppercase font-semibold">
                        Joined
                      </span>
                      {formatDate(user.createdAt)}
                    </div>
                  </div>

                  {/* Desktop Only Actions Menu */}
                  <div className="hidden md:flex md:col-span-1 justify-end">
                    <Dropdown
                      align="right"
                      trigger={
                        <button
                          type="button"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      }
                      sections={menuSections}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Load More Button */}
        {hasMore && !loading && (
          <div className="p-4 flex justify-center border-t border-slate-100 dark:border-slate-800">
            <Button
              onClick={loadMore}
              variant="outline"
              size="sm"
              className="text-xs font-bold rounded-xl"
            >
              Load More Users
            </Button>
          </div>
        )}
      </Card>

      {/* Modals */}
      {selectedUserForBan && (
        <BanUserModal
          isOpen={Boolean(selectedUserForBan)}
          onClose={() => setSelectedUserForBan(null)}
          user={selectedUserForBan}
          onConfirm={banUser}
        />
      )}

      {selectedUserForLeaderModal && (
        <EditTeamLeaderModal
          isOpen={Boolean(selectedUserForLeaderModal)}
          onClose={() => setSelectedUserForLeaderModal(null)}
          user={selectedUserForLeaderModal}
          existingUsers={users}
          onSave={saveTeamLeader}
        />
      )}

      {selectedUserForEdit && (
        <EditUserModal
          isOpen={Boolean(selectedUserForEdit)}
          onClose={() => setSelectedUserForEdit(null)}
          user={selectedUserForEdit}
          allUsers={users}
          adminUid={currentUser?.uid}
          adminName={userProfile?.displayName || 'Admin'}
          adminEmail={currentUser?.email || ''}
        />
      )}

      {selectedUserForAssignLeader && (
        <BulkAssignLeaderModal
          isOpen={Boolean(selectedUserForAssignLeader)}
          onClose={() => setSelectedUserForAssignLeader(null)}
          selectedUserIds={[selectedUserForAssignLeader.uid]}
          users={users}
          adminUid={currentUser?.uid}
          adminName={userProfile?.displayName || 'Admin'}
          adminEmail={currentUser?.email || ''}
        />
      )}
    </PageContainer>
  );
}
