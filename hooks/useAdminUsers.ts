'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { getFirebaseDb, isFirebaseConfigured } from '@/firebase/config';
import {
  UserDocument,
  FIRESTORE_COLLECTIONS,
} from '@/types/firestore';
import { logAdminActivity } from '@/lib/audit-logger';
import { useToast } from '@/hooks/use-toast';

export type UserFilterStatus = 'all' | 'active' | 'banned' | 'admin' | 'users' | 'recently_joined';
export type UserSortOption = 'newest' | 'oldest' | 'name' | 'tasks_completed';

export function useAdminUsers(adminUid?: string, adminName?: string, adminEmail?: string) {
  const [users, setUsers] = useState<UserDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<UserFilterStatus>('all');
  const [sortBy, setSortBy] = useState<UserSortOption>('newest');

  // Realtime subscription to users collection
  useEffect(() => {
    if (!isFirebaseConfigured()) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const db = getFirebaseDb();
      const colRef = collection(db, FIRESTORE_COLLECTIONS.USERS);
      const q = query(colRef, orderBy('createdAt', 'desc'));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const docs: UserDocument[] = snapshot.docs.map((d) => ({
            uid: d.id,
            ...(d.data() as Omit<UserDocument, 'uid'>),
          }));
          setUsers(docs);
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
        return (a.createdAt || '').localeCompare(b.createdAt || '');
      }
      if (sortBy === 'name') {
        return (a.displayName || a.email || '').localeCompare(b.displayName || b.email || '');
      }
      if (sortBy === 'tasks_completed') {
        return (b.totalTasksCompleted || 0) - (a.totalTasksCompleted || 0);
      }
      // default: newest
      return (b.createdAt || '').localeCompare(a.createdAt || '');
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

        const now = new Date().toISOString();
        const updateData = {
          isBanned: true,
          banReason: reason.trim(),
          bannedBy: adminUid,
          bannedAt: now,
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

  return {
    users,
    filteredUsers,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    sortBy,
    setSortBy,
    banUser,
    unbanUser,
    toggleUserActive,
  };
}
