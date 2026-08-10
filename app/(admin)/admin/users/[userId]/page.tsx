'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Edit3,
  UserX,
  RotateCcw,
  Power,
  XCircle,
  UserCheck,
  Ban,
  Shield,
  Award,
} from 'lucide-react';
import { doc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import { getFirebaseDb } from '@/firebase/config';
import {
  UserDocument,
  EnrollmentDocument,
  FIRESTORE_COLLECTIONS,
} from '@/types/firestore';
import { PageContainer } from '@/components/layout/PageContainer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { BanUserModal } from '@/components/admin/BanUserModal';
import { EditUserModal } from '@/components/admin/EditUserModal';
import { useAuth } from '@/hooks/useAuth';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { formatDate } from '@/utils/formatters';

export default function UserDetailPage() {
  const params = useParams();
  const userId = params?.userId as string;
  const router = useRouter();

  const { currentUser, userProfile: adminProfile } = useAuth();
  const { banUser, unbanUser, toggleUserActive, users } = useAdminUsers(
    currentUser?.uid,
    adminProfile?.displayName || 'Admin',
    currentUser?.email || ''
  );

  const [userDoc, setUserDoc] = useState<UserDocument | null>(null);
  const [assignedLeader, setAssignedLeader] = useState<UserDocument | null>(null);
  const [enrollments, setEnrollments] = useState<EnrollmentDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isBanModalOpen, setIsBanModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const db = getFirebaseDb();
      const userRef = doc(db, FIRESTORE_COLLECTIONS.USERS, userId);

      const unsubUser = onSnapshot(
        userRef,
        async (snap) => {
          if (snap.exists()) {
            const data = { uid: snap.id, ...(snap.data() as Omit<UserDocument, 'uid'>) };
            setUserDoc(data);

            if (data.leaderId) {
              const leaderSnap = await getDocs(
                query(collection(db, FIRESTORE_COLLECTIONS.USERS), where('__name__', '==', data.leaderId))
              );
              if (!leaderSnap.empty) {
                const lDoc = leaderSnap.docs[0];
                setAssignedLeader({ uid: lDoc.id, ...(lDoc.data() as Omit<UserDocument, 'uid'>) });
              }
            } else {
              setAssignedLeader(null);
            }
          } else {
            setError('User account not found.');
          }
          setLoading(false);
        },
        (err) => {
          console.error('[UserDetail user snapshot error]', err);
          setError(err.message);
          setLoading(false);
        }
      );

      const enrollmentsRef = collection(db, FIRESTORE_COLLECTIONS.ENROLLMENTS);
      const q = query(enrollmentsRef, where('userId', '==', userId));

      const unsubEnrollments = onSnapshot(
        q,
        (snap) => {
          const list: EnrollmentDocument[] = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<EnrollmentDocument, 'id'>),
          }));
          setEnrollments(list);
        },
        (err) => {
          console.error('[UserDetail enrollments error]', err);
        }
      );

      return () => {
        unsubUser();
        unsubEnrollments();
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      queueMicrotask(() => {
        setError(msg);
        setLoading(false);
      });
    }
  }, [userId]);

  // Aggregate stats
  const totalTasks = enrollments.length;
  const completedTasks = enrollments.filter((e) => e.status === 'approved').length;
  const pendingTasks = enrollments.filter((e) => e.status === 'pending').length;

  const totalEarned = enrollments
    .filter((e) => e.status === 'approved')
    .reduce((sum, e) => sum + (e.lockedReward || e.reward || e.rewardAmount || 0), 0);

  const totalPaid = enrollments
    .filter((e) => e.paymentStatus === 'paid')
    .reduce((sum, e) => sum + (e.lockedReward || e.reward || e.rewardAmount || 0), 0);

  const pendingPayout = enrollments
    .filter((e) => e.status === 'approved' && e.paymentStatus !== 'paid')
    .reduce((sum, e) => sum + (e.lockedReward || e.reward || e.rewardAmount || 0), 0);

  if (loading) {
    return (
      <PageContainer size="md" className="py-6 space-y-4">
        <Skeleton className="h-8 w-32 rounded-xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </PageContainer>
    );
  }

  if (error || !userDoc) {
    return (
      <PageContainer size="md" className="py-8">
        <Card className="p-6 text-center space-y-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <XCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-base font-bold text-[var(--text-primary)]">User Not Found</h2>
          <Button variant="outline" size="sm" onClick={() => router.push('/admin/users')} className="rounded-xl">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Users
          </Button>
        </Card>
      </PageContainer>
    );
  }

  const isTeamLeader = userDoc.memberType === 'team_leader';

  return (
    <PageContainer size="md" className="py-4 space-y-5">
      {/* Back link */}
      <div>
        <Link href="/admin/users">
          <Button variant="ghost" size="sm" className="text-xs font-bold rounded-xl text-slate-600 dark:text-slate-400">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Users
          </Button>
        </Link>
      </div>

      {/* Top Header Card */}
      <Card className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <Avatar
            src={userDoc.photoURL || undefined}
            fallback={userDoc.displayName || userDoc.email || 'US'}
            className="w-14 h-14 rounded-full ring-2 ring-slate-200 dark:ring-slate-700"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-[var(--text-primary)] font-heading">
                {userDoc.displayName || 'Unnamed User'}
              </h1>
              {userDoc.isBanned ? (
                <Badge variant="danger" size="sm" className="text-[10px] font-bold">
                  <Ban className="w-3 h-3 mr-1" /> Banned
                </Badge>
              ) : userDoc.isActive ? (
                <Badge variant="success" size="sm" className="text-[10px] font-bold">
                  <UserCheck className="w-3 h-3 mr-1" /> Active
                </Badge>
              ) : (
                <Badge variant="warning" size="sm" className="text-[10px] font-bold">
                  Deactivated
                </Badge>
              )}
            </div>
            <p className="text-xs text-[var(--text-secondary)] font-mono">{userDoc.email}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditModalOpen(true)}
            className="text-xs font-bold rounded-xl h-8"
          >
            <Edit3 className="w-3.5 h-3.5 mr-1" /> Edit
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleUserActive(userDoc.uid, !userDoc.isActive)}
            className="text-xs font-bold rounded-xl h-8 border border-slate-200 dark:border-slate-800"
          >
            <Power className={`w-3.5 h-3.5 mr-1 ${userDoc.isActive ? 'text-amber-500' : 'text-emerald-500'}`} />
            {userDoc.isActive ? 'Deactivate' : 'Activate'}
          </Button>

          {userDoc.isBanned ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => unbanUser(userDoc.uid)}
              className="text-xs font-bold text-emerald-600 border-emerald-500/30 rounded-xl h-8"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" /> Unban
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsBanModalOpen(true)}
              className="text-xs font-bold text-rose-600 rounded-xl h-8"
            >
              <UserX className="w-3.5 h-3.5 mr-1" /> Ban
            </Button>
          )}
        </div>
      </Card>

      {/* Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* ACCOUNT */}
        <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-muted)] border-b border-slate-100 dark:border-slate-800 pb-2">
            ACCOUNT
          </h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-secondary)] font-medium">Role</span>
              <span className="font-bold text-[var(--text-primary)]">
                {userDoc.role === 'admin' ? 'Admin' : 'User'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-secondary)] font-medium">Status</span>
              <span className="font-bold text-[var(--text-primary)]">
                {userDoc.isBanned ? 'Banned' : userDoc.isActive ? 'Active' : 'Deactivated'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-secondary)] font-medium">Joined</span>
              <span className="font-mono text-[var(--text-primary)]">{formatDate(userDoc.createdAt)}</span>
            </div>
          </div>
        </Card>

        {/* TEAM */}
        <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-muted)] border-b border-slate-100 dark:border-slate-800 pb-2">
            TEAM
          </h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-secondary)] font-medium">Team Leader</span>
              <span className="font-bold text-[var(--text-primary)]">
                {isTeamLeader
                  ? 'Self (Team Leader)'
                  : assignedLeader
                  ? assignedLeader.displayName || assignedLeader.email
                  : 'None (Direct Member)'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-secondary)] font-medium">Leader Code</span>
              <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                {isTeamLeader
                  ? userDoc.leaderCode || 'None'
                  : assignedLeader?.leaderCode || 'N/A'}
              </span>
            </div>
          </div>
        </Card>

        {/* ACTIVITY */}
        <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-muted)] border-b border-slate-100 dark:border-slate-800 pb-2">
            ACTIVITY
          </h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-secondary)] font-medium">Tasks</span>
              <span className="font-mono font-bold text-[var(--text-primary)]">{totalTasks}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-secondary)] font-medium">Completed</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{completedTasks}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-secondary)] font-medium">Pending</span>
              <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{pendingTasks}</span>
            </div>
          </div>
        </Card>

        {/* PAYMENTS */}
        <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-muted)] border-b border-slate-100 dark:border-slate-800 pb-2">
            PAYMENTS
          </h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-secondary)] font-medium">Earned</span>
              <span className="font-mono font-bold text-[var(--text-primary)]">₹{totalEarned}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-secondary)] font-medium">Paid</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">₹{totalPaid}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-secondary)] font-medium">Pending</span>
              <span className="font-mono font-bold text-amber-600 dark:text-amber-400">₹{pendingPayout}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Modals */}
      {isBanModalOpen && (
        <BanUserModal
          isOpen={isBanModalOpen}
          onClose={() => setIsBanModalOpen(false)}
          user={userDoc}
          onConfirm={banUser}
        />
      )}

      {isEditModalOpen && (
        <EditUserModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          user={userDoc}
          allUsers={users}
          adminUid={currentUser?.uid}
          adminName={adminProfile?.displayName || 'Admin'}
          adminEmail={currentUser?.email || ''}
        />
      )}
    </PageContainer>
  );
}
