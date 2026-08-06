'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Search, Users, ShieldAlert, RefreshCw, Ban, UserCheck, Edit3, IndianRupee, CheckSquare, Square, Layers } from 'lucide-react';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { Modal } from '@/components/ui/modal';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { UserDocument, FIRESTORE_COLLECTIONS } from '@/types/firestore';
import { getFirebaseDb } from '@/firebase/config';
import { formatDate } from '@/utils/formatters';
import { EditMemberRewardModal } from '@/components/admin/EditMemberRewardModal';
import { BulkRewardUpdateModal } from '@/components/admin/BulkRewardUpdateModal';

interface TeamMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  leader: UserDocument | null;
  allUsers?: UserDocument[];
  onUpdateMemberReward?: (targetUserId: string, reward: number | null) => Promise<void>;
  onApplyBulkReward?: (
    memberIds: string[],
    reward: number | null,
    onProgress: (completed: number, total: number) => void
  ) => Promise<{ updated: number; failed: number }>;
}

type SortOption = 'newest' | 'oldest' | 'a-z' | 'z-a';

export function TeamMembersModal({
  isOpen,
  onClose,
  leader,
  allUsers,
  onUpdateMemberReward,
  onApplyBulkReward,
}: TeamMembersModalProps) {
  const [members, setMembers] = useState<UserDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [editingMemberReward, setEditingMemberReward] = useState<UserDocument | null>(null);

  // Phase 4A Selection State
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  const fetchMembers = async () => {
    if (!leader?.uid) return;
    setLoading(true);
    setError(null);

    try {
      if (allUsers && allUsers.length > 0) {
        const matched = allUsers.filter((u) => u.leaderId === leader.uid);
        setMembers(matched);
        setLoading(false);
        return;
      }

      const db = getFirebaseDb();
      const usersRef = collection(db, FIRESTORE_COLLECTIONS.USERS);
      const q = query(usersRef, where('leaderId', '==', leader.uid));
      const querySnapshot = await getDocs(q);

      const loadedMembers: UserDocument[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data() as UserDocument;
        loadedMembers.push({
          ...data,
          uid: docSnap.id,
        });
      });

      setMembers(loadedMembers);
    } catch (err) {
      console.error('[Fetch Team Members Error]', err);
      setError('Unable to load team members. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && leader) {
      setSearchQuery('');
      setSortBy('newest');
      setSelectedMemberIds([]);
      fetchMembers();
    } else {
      setMembers([]);
      setSelectedMemberIds([]);
      setLoading(false);
      setError(null);
    }
  }, [isOpen, leader?.uid]);

  const handleSaveReward = async (memberId: string, reward: number | null) => {
    if (onUpdateMemberReward) {
      await onUpdateMemberReward(memberId, reward);
    } else {
      const db = getFirebaseDb();
      const userRef = doc(db, FIRESTORE_COLLECTIONS.USERS, memberId);
      await updateDoc(userRef, { effectiveReward: reward });
    }

    setMembers((prev) =>
      prev.map((m) => (m.uid === memberId ? { ...m, effectiveReward: reward } : m))
    );
  };

  const handleApplyBulkReward = async (
    memberIds: string[],
    reward: number | null,
    onProgress: (completed: number, total: number) => void
  ) => {
    let result = { updated: 0, failed: 0 };
    if (onApplyBulkReward) {
      result = await onApplyBulkReward(memberIds, reward, onProgress);
    } else {
      const db = getFirebaseDb();
      let updated = 0;
      let failed = 0;
      for (let i = 0; i < memberIds.length; i++) {
        const uid = memberIds[i];
        try {
          const userRef = doc(db, FIRESTORE_COLLECTIONS.USERS, uid);
          await updateDoc(userRef, { effectiveReward: reward });
          updated++;
        } catch (err) {
          console.error(`Bulk update error for ${uid}`, err);
          failed++;
        }
        onProgress(updated + failed, memberIds.length);
      }
      result = { updated, failed };
    }

    // Update local list state
    setMembers((prev) =>
      prev.map((m) => (memberIds.includes(m.uid) ? { ...m, effectiveReward: reward } : m))
    );

    setSelectedMemberIds([]);
    return result;
  };

  const filteredAndSortedMembers = useMemo(() => {
    let list = [...members];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((m) => {
        const nameMatch = m.displayName?.toLowerCase().includes(q);
        const emailMatch = m.email?.toLowerCase().includes(q);
        return nameMatch || emailMatch;
      });
    }

    list.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;

      if (sortBy === 'newest') return dateB - dateA;
      if (sortBy === 'oldest') return dateA - dateB;

      const nameA = (a.displayName || a.email || '').toLowerCase();
      const nameB = (b.displayName || b.email || '').toLowerCase();

      if (sortBy === 'a-z') return nameA.localeCompare(nameB);
      if (sortBy === 'z-a') return nameB.localeCompare(nameA);

      return 0;
    });

    return list;
  }, [members, searchQuery, sortBy]);

  // Selectable members strictly limited to memberType === 'team_member'
  const selectableMembers = useMemo(() => {
    return filteredAndSortedMembers.filter((m) => m.memberType === 'team_member');
  }, [filteredAndSortedMembers]);

  const selectedObjects = useMemo(() => {
    return members.filter((m) => selectedMemberIds.includes(m.uid));
  }, [members, selectedMemberIds]);

  const handleSelectAll = () => {
    const selectableIds = selectableMembers.map((m) => m.uid);
    setSelectedMemberIds(selectableIds);
  };

  const handleClearSelection = () => {
    setSelectedMemberIds([]);
  };

  if (!isOpen || !leader) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--border)] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[var(--primary)] shrink-0" />
              <h2 className="text-xl font-bold text-[var(--text-primary)]">
                Team Members
              </h2>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Leader:{' '}
              <span className="font-bold text-[var(--text-primary)]">
                {leader.displayName || leader.email || leader.uid}
              </span>{' '}
              {leader.leaderCode && (
                <span className="font-mono text-[var(--primary)] font-bold ml-1">
                  ({leader.leaderCode})
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Controls: Search & Sort */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
            <Input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <div className="w-full sm:w-44">
            <Select
              value={sortBy}
              onChange={(val) => setSortBy(val as SortOption)}
              className="text-xs bg-[var(--card)] py-1.5"
              options={[
                { value: 'newest', label: 'Newest First' },
                { value: 'oldest', label: 'Oldest First' },
                { value: 'a-z', label: 'Name A-Z' },
                { value: 'z-a', label: 'Name Z-A' },
              ]}
            />
          </div>
        </div>

        {/* Phase 4A Selection Bar */}
        {selectableMembers.length > 0 && (
          <div className="p-3 rounded-xl bg-[var(--bg-muted)] border border-[var(--border)] flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="text-[11px] h-7 px-2.5 gap-1"
              >
                <CheckSquare className="w-3.5 h-3.5 text-[var(--primary)]" />
                <span>Select All ({selectableMembers.length})</span>
              </Button>

              {selectedMemberIds.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearSelection}
                  className="text-[11px] h-7 px-2 text-[var(--text-secondary)]"
                >
                  <Square className="w-3.5 h-3.5 mr-1" />
                  <span>Clear Selection</span>
                </Button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="font-mono font-bold text-[var(--primary)]">
                {selectedMemberIds.length} Selected
              </span>
              <Button
                variant="primary"
                size="sm"
                disabled={selectedMemberIds.length === 0}
                onClick={() => setIsBulkModalOpen(true)}
                className="text-xs h-7 px-3 gap-1.5"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Bulk Update Reward</span>
              </Button>
            </div>
          </div>
        )}

        {/* Content Body */}
        {loading ? (
          /* Loading Skeleton */
          <div className="space-y-3 py-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-muted)]/50 animate-pulse flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--border)]" />
                  <div className="space-y-1.5">
                    <div className="w-32 h-3.5 rounded bg-[var(--border)]" />
                    <div className="w-44 h-3 rounded bg-[var(--border)]" />
                  </div>
                </div>
                <div className="w-20 h-6 rounded-full bg-[var(--border)]" />
              </div>
            ))}
          </div>
        ) : error ? (
          /* Error State */
          <div className="p-6 text-center space-y-3 rounded-2xl border border-[var(--danger)]/20 bg-[var(--danger)]/5">
            <ShieldAlert className="w-8 h-8 text-[var(--danger)] mx-auto" />
            <p className="text-xs text-[var(--danger)] font-medium">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchMembers}
              className="text-xs gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </Button>
          </div>
        ) : filteredAndSortedMembers.length === 0 ? (
          /* Empty State */
          <div className="py-12 text-center space-y-2 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-muted)]/30">
            <Users className="w-10 h-10 text-[var(--text-muted)] mx-auto" />
            <p className="text-sm font-semibold text-[var(--text-secondary)]">
              No members assigned.
            </p>
            {searchQuery && (
              <p className="text-xs text-[var(--text-muted)]">
                Try clearing your search criteria.
              </p>
            )}
          </div>
        ) : (
          /* Read-only Members List with Selection & Reward Config */
          <div className="max-h-[380px] overflow-y-auto space-y-2.5 pr-1">
            {filteredAndSortedMembers.map((member) => {
              const isTeamMember = member.memberType === 'team_member';
              const isSelected = selectedMemberIds.includes(member.uid);
              const hasCustomReward =
                member.effectiveReward !== undefined && member.effectiveReward !== null;

              return (
                <div
                  key={member.uid}
                  className={`p-3.5 rounded-xl border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isSelected
                      ? 'border-[var(--primary)] bg-[var(--primary)]/5'
                      : 'border-[var(--border)] bg-[var(--card)] hover:border-[var(--primary)]/30'
                  }`}
                >
                  {/* Member Info + Checkbox */}
                  <div className="flex items-center gap-3">
                    {isTeamMember ? (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMemberIds((prev) => [...prev, member.uid]);
                          } else {
                            setSelectedMemberIds((prev) =>
                              prev.filter((id) => id !== member.uid)
                            );
                          }
                        }}
                        className="w-4 h-4 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)] shrink-0 cursor-pointer"
                      />
                    ) : (
                      <div className="w-4 h-4 shrink-0" />
                    )}

                    <Avatar
                      src={member.photoURL || undefined}
                      name={member.displayName || member.email || 'Member'}
                      size="md"
                    />
                    <div>
                      <p className="font-bold text-sm text-[var(--text-primary)]">
                        {member.displayName || 'Unnamed Member'}
                      </p>
                      <p className="text-xs text-[var(--text-secondary)] font-mono">
                        {member.email}
                      </p>
                      <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">
                        Joined: <span className="font-mono">{formatDate(member.createdAt)}</span>
                      </p>
                    </div>
                  </div>

                  {/* Member Badges & Reward Column */}
                  <div className="flex flex-wrap items-center gap-2 self-start sm:self-center shrink-0">
                    {/* Reward Column */}
                    <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-[var(--bg-muted)] border border-[var(--border)] text-xs font-mono">
                      <IndianRupee className="w-3 h-3 text-[var(--text-secondary)]" />
                      {hasCustomReward ? (
                        <span className="font-bold text-[var(--primary)]">
                          ₹{member.effectiveReward}
                        </span>
                      ) : (
                        <span className="text-[var(--text-secondary)] text-[11px]">
                          Task Default
                        </span>
                      )}
                    </div>

                    {/* Member Type */}
                    {member.memberType === 'team_member' ? (
                      <Badge variant="outline" size="sm">
                        Team Member
                      </Badge>
                    ) : member.memberType === 'direct' ? (
                      <Badge variant="secondary" size="sm">
                        Direct Member
                      </Badge>
                    ) : member.memberType === 'pending' ? (
                      <Badge variant="warning" size="sm">
                        Pending
                      </Badge>
                    ) : (
                      <Badge variant="secondary" size="sm">
                        User
                      </Badge>
                    )}

                    {/* Account Status */}
                    {member.isBanned ? (
                      <Badge variant="danger" size="sm">
                        <Ban className="w-3 h-3 inline mr-1" /> Banned
                      </Badge>
                    ) : member.isActive ? (
                      <Badge variant="success" size="sm">
                        <UserCheck className="w-3 h-3 inline mr-1" /> Active
                      </Badge>
                    ) : (
                      <Badge variant="warning" size="sm">
                        Deactivated
                      </Badge>
                    )}

                    {/* Edit Reward Action - Strictly only for memberType === 'team_member' */}
                    {isTeamMember && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingMemberReward(member)}
                        title="Edit Custom Member Reward"
                        className="text-xs text-[var(--primary)] hover:bg-[var(--primary)]/10 px-2 h-7"
                      >
                        <Edit3 className="w-3 h-3 mr-1" /> Reward
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[var(--border)] pt-4 text-xs text-[var(--text-secondary)]">
          <span>
            Total:{' '}
            <strong className="text-[var(--text-primary)]">
              {filteredAndSortedMembers.length}
            </strong>{' '}
            member(s)
          </span>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      {/* Edit Member Reward Sub-Modal */}
      <EditMemberRewardModal
        isOpen={!!editingMemberReward}
        onClose={() => setEditingMemberReward(null)}
        member={editingMemberReward}
        onSaveReward={handleSaveReward}
      />

      {/* Bulk Reward Update Sub-Modal */}
      <BulkRewardUpdateModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        selectedMembers={selectedObjects}
        onApplyBulkReward={handleApplyBulkReward}
      />
    </Modal>
  );
}
