'use client';

import React, { useState } from 'react';
import Link from 'next/link';
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
import { EmptyState } from '@/components/ui/empty-state';
import { useAuth } from '@/hooks/useAuth';
import { useAdminUsers, UserFilterStatus, UserSortOption } from '@/hooks/useAdminUsers';
import { BanUserModal } from '@/components/admin/BanUserModal';
import { UserDocument } from '@/types/firestore';

export default function AdminUsersPage() {
  const { currentUser, userProfile } = useAuth();
  const {
    filteredUsers,
    loading,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    sortBy,
    setSortBy,
    banUser,
    unbanUser,
    toggleUserActive,
  } = useAdminUsers(
    currentUser?.uid,
    userProfile?.displayName || 'Admin',
    currentUser?.email || ''
  );

  // Selected User for Ban Modal
  const [selectedUserForBan, setSelectedUserForBan] = useState<UserDocument | null>(null);

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return 'N/A';
    try {
      return new Date(isoString).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <PageContainer size="xl">
      <SectionHeader
        title="User Manager"
        subtitle="Manage user accounts, roles, security sanctions, and review completion records"
      />

      <ContentContainer variant="card" className="space-y-6 p-4 sm:p-6">
        {/* Search, Filters, and Sorting Toolbar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[var(--bg-muted)] p-3.5 rounded-xl border border-[var(--border)]">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Name, Email, Phone, or UID..."
              className="pl-9 text-xs w-full bg-[var(--card)]"
            />
          </div>

          {/* Filters & Sort Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 min-w-[130px]">
              <Filter className="w-3.5 h-3.5 text-[var(--text-secondary)] shrink-0" />
              <Select
                value={filterStatus}
                onChange={(val) => setFilterStatus(val as UserFilterStatus)}
                className="text-xs bg-[var(--card)] py-1"
                options={[
                  { value: 'all', label: 'All Accounts' },
                  { value: 'active', label: 'Active Only' },
                  { value: 'banned', label: 'Banned Only' },
                  { value: 'admin', label: 'Admins' },
                  { value: 'users', label: 'Standard Users' },
                  { value: 'recently_joined', label: 'Joined Recently' },
                ]}
              />
            </div>

            <div className="flex items-center gap-1.5 min-w-[130px]">
              <ArrowUpDown className="w-3.5 h-3.5 text-[var(--text-secondary)] shrink-0" />
              <Select
                value={sortBy}
                onChange={(val) => setSortBy(val as UserSortOption)}
                className="text-xs bg-[var(--card)] py-1"
                options={[
                  { value: 'newest', label: 'Sort: Newest First' },
                  { value: 'oldest', label: 'Sort: Oldest First' },
                  { value: 'name', label: 'Sort: Name (A-Z)' },
                  { value: 'tasks_completed', label: 'Sort: Tasks Completed' },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Loading Skeletons */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <EmptyState
            icon={<UsersIcon className="w-8 h-8" />}
            title="No Users Found"
            description={
              searchQuery || filterStatus !== 'all'
                ? 'No user accounts match your active search filters or status parameters.'
                : 'No user accounts recorded in the database yet.'
            }
          />
        ) : (
          <>
            {/* Desktop Data Grid (Hidden on Mobile) */}
            <div className="hidden lg:block overflow-x-auto rounded-xl border border-[var(--border)]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[var(--bg-muted)] border-b border-[var(--border)] text-[var(--text-secondary)] font-semibold uppercase tracking-wider text-[10px]">
                    <th className="p-3.5">User Profile</th>
                    <th className="p-3.5">Phone / Contact</th>
                    <th className="p-3.5">Role & Status</th>
                    <th className="p-3.5">Joined Date</th>
                    <th className="p-3.5 text-center">Tasks Done</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.uid}
                      className="hover:bg-[var(--bg-muted)]/50 transition-colors"
                    >
                      {/* User Profile */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={user.photoURL || undefined}
                            name={user.displayName || user.email || 'User'}
                            size="md"
                          />
                          <div>
                            <p className="font-bold text-[var(--text-primary)]">
                              {user.displayName || 'Unnamed User'}
                            </p>
                            <p className="text-[11px] text-[var(--text-secondary)] font-mono">
                              {user.email}
                            </p>
                            <p className="text-[10px] font-mono text-[var(--text-secondary)] opacity-70">
                              UID: {user.uid.slice(0, 10)}...
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="p-3.5 font-mono text-[var(--text-secondary)]">
                        {user.phoneNumber || 'Not Provided'}
                      </td>

                      {/* Role & Status */}
                      <td className="p-3.5 space-y-1">
                        <div className="flex items-center gap-1.5">
                          {user.role === 'admin' ? (
                            <Badge variant="accent" size="sm">
                              <Shield className="w-3 h-3 inline mr-1" /> Admin
                            </Badge>
                          ) : (
                            <Badge variant="secondary" size="sm">
                              User
                            </Badge>
                          )}

                          {user.isBanned ? (
                            <Badge variant="danger" size="sm">
                              <Ban className="w-3 h-3 inline mr-1" /> Banned
                            </Badge>
                          ) : user.isActive ? (
                            <Badge variant="success" size="sm">
                              <UserCheck className="w-3 h-3 inline mr-1" /> Active
                            </Badge>
                          ) : (
                            <Badge variant="warning" size="sm">
                              Deactivated
                            </Badge>
                          )}
                        </div>
                        {user.isBanned && user.banReason && (
                          <p className="text-[10px] text-rose-500 font-medium truncate max-w-[180px]" title={user.banReason}>
                            Reason: {user.banReason}
                          </p>
                        )}
                      </td>

                      {/* Joined Date */}
                      <td className="p-3.5 text-[var(--text-secondary)] font-mono text-[11px]">
                        {formatDate(user.createdAt)}
                      </td>

                      {/* Tasks Completed */}
                      <td className="p-3.5 text-center font-bold font-mono">
                        <div className="inline-flex items-center justify-center px-2 py-1 rounded-md bg-[var(--bg-muted)] border border-[var(--border)] text-xs">
                          {user.totalTasksCompleted || 0}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/admin/users/${user.uid}`}>
                            <Button variant="ghost" size="sm" title="View Full Profile">
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                          </Link>

                          {user.isBanned ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => unbanUser(user.uid)}
                              className="text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                              title="Unban Account"
                            >
                              <RotateCcw className="w-3.5 h-3.5 mr-1" /> Unban
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedUserForBan(user)}
                              className="text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                              title="Ban Account"
                            >
                              <UserX className="w-3.5 h-3.5 mr-1" /> Ban
                            </Button>
                          )}

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleUserActive(user.uid, !user.isActive)}
                            title={user.isActive ? 'Deactivate Account' : 'Reactivate Account'}
                          >
                            <Power className={`w-3.5 h-3.5 ${user.isActive ? 'text-amber-500' : 'text-emerald-500'}`} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards (Visible on Mobile & Tablet) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:hidden gap-3">
              {filteredUsers.map((user) => (
                <div
                  key={user.uid}
                  className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)] space-y-3 shadow-sm hover:border-[var(--brand)] transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={user.photoURL || undefined}
                        name={user.displayName || user.email || 'User'}
                        size="md"
                      />
                      <div>
                        <h3 className="font-bold text-sm text-[var(--text-primary)]">
                          {user.displayName || 'Unnamed User'}
                        </h3>
                        <p className="text-xs text-[var(--text-secondary)] font-mono">
                          {user.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      {user.isBanned ? (
                        <Badge variant="danger" size="sm">
                          Banned
                        </Badge>
                      ) : user.isActive ? (
                        <Badge variant="success" size="sm">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="warning" size="sm">
                          Deactivated
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs py-2 px-3 rounded-lg bg-[var(--bg-muted)] border border-[var(--border)]">
                    <div>
                      <span className="text-[var(--text-secondary)] block text-[10px] font-semibold uppercase">
                        Phone
                      </span>
                      <span className="font-mono text-[var(--text-primary)]">
                        {user.phoneNumber || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--text-secondary)] block text-[10px] font-semibold uppercase">
                        Joined
                      </span>
                      <span className="font-mono text-[var(--text-primary)]">
                        {formatDate(user.createdAt)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--text-secondary)] block text-[10px] font-semibold uppercase">
                        Role
                      </span>
                      <span className="font-semibold capitalize text-[var(--text-primary)]">
                        {user.role}
                      </span>
                    </div>
                    <div>
                      <span className="text-[var(--text-secondary)] block text-[10px] font-semibold uppercase">
                        Tasks Done
                      </span>
                      <span className="font-mono font-bold text-[var(--brand)]">
                        {user.totalTasksCompleted || 0}
                      </span>
                    </div>
                  </div>

                  {user.isBanned && user.banReason && (
                    <p className="text-xs text-rose-500 font-medium bg-rose-50 dark:bg-rose-950/30 p-2 rounded-lg border border-rose-200 dark:border-rose-800">
                      <strong>Ban Reason:</strong> {user.banReason}
                    </p>
                  )}

                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-[var(--border)]">
                    <Link href={`/admin/users/${user.uid}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full text-xs">
                        <Eye className="w-3.5 h-3.5 mr-1.5" /> Full Profile
                      </Button>
                    </Link>

                    {user.isBanned ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => unbanUser(user.uid)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                      >
                        <RotateCcw className="w-3.5 h-3.5 mr-1" /> Unban
                      </Button>
                    ) : (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setSelectedUserForBan(user)}
                        className="text-xs"
                      >
                        <UserX className="w-3.5 h-3.5 mr-1" /> Ban
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </ContentContainer>

      {/* Ban User Dialog */}
      <BanUserModal
        isOpen={!!selectedUserForBan}
        onClose={() => setSelectedUserForBan(null)}
        user={selectedUserForBan}
        onConfirmBan={banUser}
      />
    </PageContainer>
  );
}
