'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  collection,
  onSnapshot,
  getDocs,
  startAfter,
  doc,
  updateDoc,
  setDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
  query,
  orderBy,
  limit,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import { getFirebaseDb } from '@/firebase/config';
import {
  UserDocument,
  FIRESTORE_COLLECTIONS,
} from '@/types/firestore';
import { logAdminActivity } from '@/lib/audit-logger';
import { useToast } from '@/hooks/use-toast';
import { getSafeTime } from '@/utils/formatters';

export type UserFilterStatus =
  | 'all'
  | 'active'
  | 'banned'
  | 'admin'
  | 'users'
  | 'recently_joined'
  | 'team_leaders'
  | 'direct_members'
  | 'pending'
  | 'team_members';
export type UserSortOption = 'newest' | 'oldest' | 'name' | 'tasks_completed';

export function useAdminUsers(adminUid?: string, adminName?: string, adminEmail?: string) {
  const [users, setUsers] = useState<UserDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<UserFilterStatus>('all');
  const [sortBy, setSortBy] = useState<UserSortOption>('newest');
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const PAGE_SIZE = 50;
  const page1UsersRef = useRef<UserDocument[]>([]);
  const extraUsersRef = useRef<UserDocument[]>([]);
  const lastDocRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !lastDocRef.current) return;

    setLoadingMore(true);
    try {
      const db = getFirebaseDb();
      const colRef = collection(db, FIRESTORE_COLLECTIONS.USERS);
      const q = query(
        colRef,
        orderBy('createdAt', 'desc'),
        startAfter(lastDocRef.current),
        limit(PAGE_SIZE)
      );

      const snapshot = await getDocs(q);
      const newDocs: UserDocument[] = snapshot.docs.map((d) => ({
        uid: d.id,
        ...(d.data() as Omit<UserDocument, 'uid'>),
      }));

      extraUsersRef.current = [...extraUsersRef.current, ...newDocs];
      if (snapshot.docs.length > 0) {
        lastDocRef.current = snapshot.docs[snapshot.docs.length - 1];
      }
      setHasMore(snapshot.docs.length >= PAGE_SIZE);
      setUsers([...page1UsersRef.current, ...extraUsersRef.current]);
    } catch (err) {
      console.error('[useAdminUsers loadMore error]', err);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore]);

  // Realtime subscription to initial page of users collection with cursor pagination support
  useEffect(() => {
    setLoading(true);
    setError(null);

    try {
      const db = getFirebaseDb();
      const colRef = collection(db, FIRESTORE_COLLECTIONS.USERS);
      const q = query(colRef, orderBy('createdAt', 'desc'), limit(PAGE_SIZE));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const docs: UserDocument[] = snapshot.docs.map((d) => ({
            uid: d.id,
            ...(d.data() as Omit<UserDocument, 'uid'>),
          }));
          page1UsersRef.current = docs;

          if (extraUsersRef.current.length === 0) {
            lastDocRef.current = snapshot.docs[snapshot.docs.length - 1] || null;
            setHasMore(snapshot.docs.length >= PAGE_SIZE);
          }

          setUsers([...page1UsersRef.current, ...extraUsersRef.current]);
          setLoading(false);
        },
        (err) => {
          console.error('[useAdminUsers snapshot error]', err);
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
  }, []);

  // Filter & Sort Users
  const filteredUsers = useMemo(() => {
    let result = [...users];

    // Search query matching Name, Email, Phone, UID
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (u) =>
          u.uid.toLowerCase().includes(q) ||
          (u.displayName && u.displayName.toLowerCase().includes(q)) ||
          (u.email && u.email.toLowerCase().includes(q)) ||
          (u.phoneNumber && u.phoneNumber.toLowerCase().includes(q))
      );
    }

    // Filter status
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    switch (filterStatus) {
      case 'active':
        result = result.filter((u) => u.isActive && !u.isBanned);
        break;
      case 'banned':
        result = result.filter((u) => u.isBanned);
        break;
      case 'admin':
        result = result.filter((u) => u.role === 'admin');
        break;
      case 'users':
        result = result.filter((u) => u.role === 'user');
        break;
      case 'team_leaders':
        result = result.filter((u) => u.memberType === 'team_leader');
        break;
      case 'direct_members':
        result = result.filter((u) => u.memberType === 'direct');
        break;
      case 'pending':
        result = result.filter((u) => u.memberType === 'pending');
        break;
      case 'team_members':
        result = result.filter((u) => u.memberType === 'team_member');
        break;
      case 'recently_joined':
        result = result.filter((u) => u.createdAt >= sevenDaysAgo);
        break;
      case 'all':
      default:
        break;
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'oldest') {
        return getSafeTime(a.createdAt) - getSafeTime(b.createdAt);
      }
      if (sortBy === 'name') {
        return (a.displayName || a.email || '').localeCompare(b.displayName || b.email || '');
      }
      if (sortBy === 'tasks_completed') {
        return (b.totalTasksCompleted || 0) - (a.totalTasksCompleted || 0);
      }
      // default: newest
      return getSafeTime(b.createdAt) - getSafeTime(a.createdAt);
    });

    return result;
  }, [users, searchQuery, filterStatus, sortBy]);

  // Ban User Action
  const banUser = useCallback(
    async (targetUserId: string, reason: string) => {
      if (!adminUid) {
        toast({ variant: 'error', message: 'Unauthorized action.' });
        return;
      }
      if (!reason.trim()) {
        toast({ variant: 'error', message: 'Ban reason is required.' });
        return;
      }

      try {
        const db = getFirebaseDb();
        const userRef = doc(db, FIRESTORE_COLLECTIONS.USERS, targetUserId);
        const targetUser = users.find((u) => u.uid === targetUserId);

        const updateData = {
          isBanned: true,
          banReason: reason.trim(),
          bannedBy: adminUid,
          bannedAt: serverTimestamp(),
        };

        await updateDoc(userRef, updateData);

        // Audit Log
        await logAdminActivity({
          action: 'User Banned',
          performedBy: adminUid,
          performedByName: adminName,
          performedByEmail: adminEmail,
          targetType: 'user',
          targetId: targetUserId,
          targetName: targetUser?.displayName || targetUser?.email || targetUserId,
          details: `Reason: ${reason.trim()}`,
          before: { isBanned: targetUser?.isBanned || false },
          after: updateData,
        });

        toast({
          variant: 'warning',
          title: 'User Banned',
          message: `User account has been banned. Reason logged.`,
        });
      } catch (err) {
        console.error('[banUser error]', err);
        const msg = err instanceof Error ? err.message : String(err);
        toast({
          variant: 'error',
          title: 'Ban Action Failed',
          message: msg,
        });
        throw err;
      }
    },
    [adminUid, adminName, adminEmail, users, toast]
  );

  // Unban User Action
  const unbanUser = useCallback(
    async (targetUserId: string) => {
      if (!adminUid) {
        toast({ variant: 'error', message: 'Unauthorized action.' });
        return;
      }

      try {
        const db = getFirebaseDb();
        const userRef = doc(db, FIRESTORE_COLLECTIONS.USERS, targetUserId);
        const targetUser = users.find((u) => u.uid === targetUserId);

        const now = new Date().toISOString();
        const updateData = {
          isBanned: false,
          unbannedBy: adminUid,
          unbannedAt: now,
        };

        await updateDoc(userRef, updateData);

        // Audit Log
        await logAdminActivity({
          action: 'User Unbanned',
          performedBy: adminUid,
          performedByName: adminName,
          performedByEmail: adminEmail,
          targetType: 'user',
          targetId: targetUserId,
          targetName: targetUser?.displayName || targetUser?.email || targetUserId,
          details: 'Account reinstated from ban',
          before: { isBanned: targetUser?.isBanned || true, banReason: targetUser?.banReason },
          after: updateData,
        });

        toast({
          variant: 'success',
          title: 'User Unbanned',
          message: 'User account has been restored to active status.',
        });
      } catch (err) {
        console.error('[unbanUser error]', err);
        const msg = err instanceof Error ? err.message : String(err);
        toast({
          variant: 'error',
          title: 'Unban Action Failed',
          message: msg,
        });
        throw err;
      }
    },
    [adminUid, adminName, adminEmail, users, toast]
  );

  // Toggle Activation Status (Deactivate / Reactivate)
  const toggleUserActive = useCallback(
    async (targetUserId: string, newActiveState: boolean) => {
      if (!adminUid) {
        toast({ variant: 'error', message: 'Unauthorized action.' });
        return;
      }

      try {
        const db = getFirebaseDb();
        const userRef = doc(db, FIRESTORE_COLLECTIONS.USERS, targetUserId);
        const targetUser = users.find((u) => u.uid === targetUserId);

        await updateDoc(userRef, { isActive: newActiveState });

        const actionType = newActiveState ? 'User Reactivated' : 'User Deactivated';

        // Audit Log
        await logAdminActivity({
          action: actionType,
          performedBy: adminUid,
          performedByName: adminName,
          performedByEmail: adminEmail,
          targetType: 'user',
          targetId: targetUserId,
          targetName: targetUser?.displayName || targetUser?.email || targetUserId,
          details: `Active status set to ${newActiveState}`,
          before: { isActive: targetUser?.isActive },
          after: { isActive: newActiveState },
        });

        toast({
          variant: newActiveState ? 'success' : 'info',
          title: actionType,
          message: `User account is now ${newActiveState ? 'active' : 'deactivated'}.`,
        });
      } catch (err) {
        console.error('[toggleUserActive error]', err);
        const msg = err instanceof Error ? err.message : String(err);
        toast({
          variant: 'error',
          title: 'Status Update Failed',
          message: msg,
        });
        throw err;
      }
    },
    [adminUid, adminName, adminEmail, users, toast]
  );

  // Promote or Edit Team Leader
  const saveTeamLeader = useCallback(
    async (
      targetUserId: string,
      leaderCode: string,
      isLeaderActive: boolean,
      targetMemberType: 'team_leader' | 'direct' | 'pending' | 'team_member' = 'team_leader'
    ) => {
      if (!adminUid) {
        toast({ variant: 'error', message: 'Unauthorized action.' });
        return;
      }

      try {
        const db = getFirebaseDb();
        const userRef = doc(db, FIRESTORE_COLLECTIONS.USERS, targetUserId);
        const targetUser = users.find((u) => u.uid === targetUserId);

        // Feature 1 Protection: Prevent Team Leader removal while members exist
        if (targetUser?.memberType === 'team_leader' && targetMemberType !== 'team_leader') {
          const teamSize = users.filter((u) => u.leaderId === targetUserId).length;
          if (teamSize > 0) {
            const errorMsg = `This Team Leader still has ${teamSize} active member(s). Transfer or remove all team members before changing this role.`;
            toast({
              variant: 'error',
              title: 'Role Change Rejected',
              message: errorMsg,
            });
            throw new Error(errorMsg);
          }
        }

        // Permanent Leader Code Rule:
        // Always preserve existing leaderCode if user already has one. Generate/use new code ONLY if leaderCode is null/empty.
        const existingCode = targetUser?.leaderCode?.trim().toUpperCase();
        const finalLeaderCode = (existingCode && existingCode.length > 0)
          ? existingCode
          : leaderCode.trim().toUpperCase();

        const oldCode = existingCode;

        const updateData = {
          memberType: targetMemberType,
          leaderCode: finalLeaderCode,
          isLeaderActive: isLeaderActive,
        };

        const batch = writeBatch(db);
        batch.update(userRef, updateData);

        // Keep leaderCodes lookup document synchronized atomically
        if (targetMemberType === 'team_leader') {
          if (oldCode && oldCode !== finalLeaderCode) {
            batch.delete(doc(db, FIRESTORE_COLLECTIONS.LEADER_CODES, oldCode));
          }
          const leaderCodeRef = doc(db, FIRESTORE_COLLECTIONS.LEADER_CODES, finalLeaderCode);
          batch.set(
            leaderCodeRef,
            {
              leaderId: targetUserId,
              leaderCode: finalLeaderCode,
              memberType: targetMemberType,
              isLeaderActive: isLeaderActive,
              updatedAt: new Date().toISOString(),
              createdAt: targetUser?.createdAt || new Date().toISOString(),
            },
            { merge: true }
          );
        } else if (oldCode) {
          batch.delete(doc(db, FIRESTORE_COLLECTIONS.LEADER_CODES, oldCode));
        }

        await batch.commit();

        await logAdminActivity({
          action: 'Team Leader Saved',
          performedBy: adminUid,
          performedByName: adminName,
          performedByEmail: adminEmail,
          targetType: 'user',
          targetId: targetUserId,
          targetName: targetUser?.displayName || targetUser?.email || targetUserId,
          details: `Leader Code: ${leaderCode}, Active: ${isLeaderActive}, MemberType: ${targetMemberType}`,
          before: {
            memberType: targetUser?.memberType,
            leaderCode: targetUser?.leaderCode,
            isLeaderActive: targetUser?.isLeaderActive,
          },
          after: updateData,
        });

        toast({
          variant: 'success',
          title: 'Team Leader Updated',
          message: `Team Leader settings saved successfully.`,
        });
      } catch (err) {
        console.error('[saveTeamLeader error]', err);
        const msg = err instanceof Error ? err.message : String(err);
        toast({
          variant: 'error',
          title: 'Failed to Save Team Leader',
          message: msg,
        });
        throw err;
      }
    },
    [adminUid, adminName, adminEmail, users, toast]
  );

  // Toggle Leader Active Status (Enable / Disable Leader)
  const toggleLeaderActiveStatus = useCallback(
    async (targetUserId: string, newActiveState: boolean) => {
      if (!adminUid) {
        toast({ variant: 'error', message: 'Unauthorized action.' });
        return;
      }

      try {
        const db = getFirebaseDb();
        const userRef = doc(db, FIRESTORE_COLLECTIONS.USERS, targetUserId);
        const targetUser = users.find((u) => u.uid === targetUserId);

        const batch = writeBatch(db);
        batch.update(userRef, { isLeaderActive: newActiveState });

        // Synchronize leaderCodes mapping document if user has a leaderCode atomically
        if (targetUser?.leaderCode) {
          const code = targetUser.leaderCode.trim().toUpperCase();
          const leaderCodeRef = doc(db, FIRESTORE_COLLECTIONS.LEADER_CODES, code);
          batch.set(
            leaderCodeRef,
            {
              memberType: targetUser.memberType || 'team_leader',
              isLeaderActive: newActiveState,
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        }

        await batch.commit();

        const actionText = newActiveState ? 'Team Leader Enabled' : 'Team Leader Disabled';

        await logAdminActivity({
          action: actionText,
          performedBy: adminUid,
          performedByName: adminName,
          performedByEmail: adminEmail,
          targetType: 'user',
          targetId: targetUserId,
          targetName: targetUser?.displayName || targetUser?.email || targetUserId,
          details: `isLeaderActive set to ${newActiveState}`,
          before: { isLeaderActive: targetUser?.isLeaderActive },
          after: { isLeaderActive: newActiveState },
        });

        toast({
          variant: newActiveState ? 'success' : 'warning',
          title: actionText,
          message: `Team Leader is now ${newActiveState ? 'enabled' : 'disabled'}.`,
        });
      } catch (err) {
        console.error('[toggleLeaderActiveStatus error]', err);
        const msg = err instanceof Error ? err.message : String(err);
        toast({
          variant: 'error',
          title: 'Failed to update Leader Status',
          message: msg,
        });
        throw err;
      }
    },
    [adminUid, adminName, adminEmail, users, toast]
  );

  // Update Member Custom Reward (Phase 4)
  const updateMemberReward = useCallback(
    async (targetUserId: string, reward: number | null) => {
      if (!adminUid) {
        toast({ variant: 'error', message: 'Unauthorized action.' });
        return;
      }

      try {
        const db = getFirebaseDb();
        const userRef = doc(db, FIRESTORE_COLLECTIONS.USERS, targetUserId);
        const targetUser = users.find((u) => u.uid === targetUserId);

        await updateDoc(userRef, {
          effectiveReward: reward,
        });

        await logAdminActivity({
          action: 'Member Reward Configured',
          performedBy: adminUid,
          performedByName: adminName,
          performedByEmail: adminEmail,
          targetType: 'user',
          targetId: targetUserId,
          targetName: targetUser?.displayName || targetUser?.email || targetUserId,
          details: reward === null ? 'Reset to Task Default' : `Effective Reward set to ₹${reward}`,
          before: { effectiveReward: targetUser?.effectiveReward ?? null },
          after: { effectiveReward: reward },
        });

        toast({
          variant: 'success',
          title: 'Member Reward Updated',
          message:
            reward === null
              ? 'Reset to original task default reward.'
              : `Member reward updated to ₹${reward}.`,
        });
      } catch (err) {
        console.error('[updateMemberReward error]', err);
        const msg = err instanceof Error ? err.message : String(err);
        toast({
          variant: 'error',
          title: 'Failed to update Member Reward',
          message: msg,
        });
        throw err;
      }
    },
    [adminUid, adminName, adminEmail, users, toast]
  );

  // Bulk Update Member Custom Rewards (Phase 4A)
  const bulkUpdateMemberRewards = useCallback(
    async (
      targetUserIds: string[],
      reward: number | null,
      onProgress?: (completed: number, total: number) => void
    ): Promise<{ updated: number; failed: number }> => {
      if (!adminUid) {
        toast({ variant: 'error', message: 'Unauthorized action.' });
        return { updated: 0, failed: targetUserIds.length };
      }

      let updatedCount = 0;
      let failedCount = 0;
      const total = targetUserIds.length;

      for (let i = 0; i < total; i++) {
        const uid = targetUserIds[i];
        try {
          const db = getFirebaseDb();
          const userRef = doc(db, FIRESTORE_COLLECTIONS.USERS, uid);
          await updateDoc(userRef, { effectiveReward: reward });
          updatedCount++;
        } catch (err) {
          console.error(`[bulkUpdateMemberRewards Error for ${uid}]`, err);
          failedCount++;
        }
        if (onProgress) {
          onProgress(updatedCount + failedCount, total);
        }
      }

      await logAdminActivity({
        action: 'Bulk Member Rewards Updated',
        performedBy: adminUid,
        performedByName: adminName,
        performedByEmail: adminEmail,
        targetType: 'user',
        targetId: 'bulk',
        targetName: `${updatedCount} member(s)`,
        details: `Bulk effectiveReward set to ${reward === null ? 'Task Default' : '₹' + reward} for ${updatedCount} user(s).`,
        before: {},
        after: { effectiveReward: reward, totalTargeted: total, updated: updatedCount, failed: failedCount },
      });

      toast({
        variant: failedCount === 0 ? 'success' : 'warning',
        title: 'Bulk Reward Update Completed',
        message: `Successfully updated ${updatedCount} member(s).${failedCount > 0 ? ` Failed: ${failedCount}.` : ''}`,
      });

      return { updated: updatedCount, failed: failedCount };
    },
    [adminUid, adminName, adminEmail, users, toast]
  );

  return {
    users,
    filteredUsers,
    loading,
    error,
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
  };
}
