'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  User as UserIcon,
  CreditCard,
  Building2,
  Phone,
  Mail,
  Shield,
  Ban,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  History,
  FileText,
  DollarSign,
  UserX,
  RotateCcw,
  Power,
  ExternalLink,
  Award,
  Users as UsersIcon,
  ChevronRight,
  Edit3,
  X,
  Copy,
  Check,
  AlertTriangle,
  Lock,
  Sparkles,
  Zap,
  Tag,
  Share2,
  UserCheck,
} from 'lucide-react';
import { doc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import { getFirebaseDb } from '@/firebase/config';
import {
  UserDocument,
  EnrollmentDocument,
  FIRESTORE_COLLECTIONS,
} from '@/types/firestore';
import { PageContainer } from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/layout/SectionHeader';
import { ContentContainer } from '@/components/layout/ContentContainer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { BanUserModal } from '@/components/admin/BanUserModal';
import { EditTeamLeaderModal } from '@/components/admin/EditTeamLeaderModal';
import { useAuth } from '@/hooks/useAuth';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { formatDate, formatDateTime, getSafeTime } from '@/utils/formatters';
import { useToast } from '@/hooks/use-toast';

export type UserProfileTab = 'overview' | 'timeline' | 'submissions' | 'payments' | 'enrollments';

interface TimelineEvent {
  id: string;
  type: 'registration' | 'leader_assigned' | 'enrollment' | 'submission' | 'approval' | 'rejection' | 'payment_requested' | 'payment_completed' | 'banned' | 'unbanned';
  title: string;
  description: string;
  timestamp: string;
  badgeVariant: 'accent' | 'success' | 'danger' | 'warning' | 'secondary' | 'outline';
  icon: React.ReactNode;
}

export default function UserDetailPage() {
  const params = useParams();
  const userId = params?.userId as string;
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams?.get('tab') as UserProfileTab) || 'overview';

  const { currentUser, userProfile: adminProfile } = useAuth();
  const { toast } = useToast();
  const { banUser, unbanUser, toggleUserActive, saveTeamLeader, toggleLeaderActiveStatus, users } = useAdminUsers(
    currentUser?.uid,
    adminProfile?.displayName || 'Admin',
    currentUser?.email || ''
  );

  const [userDoc, setUserDoc] = useState<UserDocument | null>(null);
  const [assignedLeader, setAssignedLeader] = useState<UserDocument | null>(null);
  const [teamMembers, setTeamMembers] = useState<UserDocument[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isBanModalOpen, setIsBanModalOpen] = useState(false);
  const [isLeaderModalOpen, setIsLeaderModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<UserProfileTab>(initialTab);
  const [copiedCode, setCopiedCode] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Sync activeTab if query param changes
  useEffect(() => {
    const tabFromUrl = searchParams?.get('tab') as UserProfileTab;
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  // Realtime subscription to target user document and their enrollments
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

            // If user has a leaderId, fetch leader details
            if (data.leaderId) {
              const leaderRef = doc(db, FIRESTORE_COLLECTIONS.USERS, data.leaderId);
              const leaderSnap = await getDocs(query(collection(db, FIRESTORE_COLLECTIONS.USERS), where('__name__', '==', data.leaderId)));
              if (!leaderSnap.empty) {
                const lDoc = leaderSnap.docs[0];
                setAssignedLeader({ uid: lDoc.id, ...(lDoc.data() as Omit<UserDocument, 'uid'>) });
              }
            } else {
              setAssignedLeader(null);
            }

            // If user is a team leader, fetch team members
            if (data.memberType === 'team_leader') {
              const membersQ = query(collection(db, FIRESTORE_COLLECTIONS.USERS), where('leaderId', '==', snap.id));
              const membersSnap = await getDocs(membersQ);
              const membersList = membersSnap.docs.map((d) => ({
                uid: d.id,
                ...(d.data() as Omit<UserDocument, 'uid'>),
              }));
              setTeamMembers(membersList);
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

      // Fetch user's enrollments
      const enrollmentsRef = collection(db, FIRESTORE_COLLECTIONS.ENROLLMENTS);
      const q = query(enrollmentsRef, where('userId', '==', userId));

      const unsubEnrollments = onSnapshot(
        q,
        (snap) => {
          const list: EnrollmentDocument[] = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<EnrollmentDocument, 'id'>),
          }));
          list.sort((a, b) => getSafeTime(b.enrolledAt) - getSafeTime(a.enrolledAt));
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

  // Aggregate Metrics
  const approvedCount = enrollments.filter((e) => e.status === 'approved').length;
  const rejectedCount = enrollments.filter((e) => e.status === 'rejected').length;
  const pendingCount = enrollments.filter((e) => e.status === 'pending').length;
  
  const totalPaid = enrollments
    .filter((e) => e.paymentStatus === 'paid')
    .reduce((sum, e) => sum + (e.lockedReward || e.reward || e.rewardAmount || 0), 0);

  const totalPendingPayout = enrollments
    .filter((e) => e.status === 'approved' && e.paymentStatus !== 'paid')
    .reduce((sum, e) => sum + (e.lockedReward || e.reward || e.rewardAmount || 0), 0);

  // Construct Chronological Activity Timeline Events from existing data
  const activityTimelineEvents = useMemo(() => {
    if (!userDoc) return [];
    const events: TimelineEvent[] = [];

    // 1. Registration Event
    if (userDoc.createdAt) {
      events.push({
        id: `reg-${userDoc.uid}`,
        type: 'registration',
        title: 'Account Registered',
        description: `Member account registered as ${userDoc.memberType || 'direct'} user.`,
        timestamp: userDoc.createdAt,
        badgeVariant: 'accent',
        icon: <UserIcon className="w-3.5 h-3.5 text-amber-500" />,
      });
    }

    // 2. Leader Assignment Event
    if (assignedLeader) {
      events.push({
        id: `leader-${userDoc.uid}`,
        type: 'leader_assigned',
        title: 'Assigned to Team Leader',
        description: `Linked to ${assignedLeader.displayName || assignedLeader.email} (Leader Code: ${assignedLeader.leaderCode || 'N/A'}).`,
        timestamp: userDoc.createdAt, // Fallback to createdAt if assignment date unavailable
        badgeVariant: 'secondary',
        icon: <Award className="w-3.5 h-3.5 text-indigo-500" />,
      });
    }

    // 3. Ban / Restriction Event
    if (userDoc.isBanned && userDoc.bannedAt) {
      events.push({
        id: `ban-${userDoc.uid}`,
        type: 'banned',
        title: 'Account Banned',
        description: `Reason: ${userDoc.banReason || 'Administrative ban'}`,
        timestamp: userDoc.bannedAt,
        badgeVariant: 'danger',
        icon: <Ban className="w-3.5 h-3.5 text-rose-500" />,
      });
    }

    // 4. Enrollments Events
    enrollments.forEach((e) => {
      if (e.enrolledAt) {
        events.push({
          id: `enr-${e.id}`,
          type: 'enrollment',
          title: `Enrolled in Task: ${e.taskTitle || e.appName || 'Task'}`,
          description: `Locked reward: ₹${e.lockedReward || e.reward || e.rewardAmount || 0}`,
          timestamp: e.enrolledAt,
          badgeVariant: 'outline',
          icon: <Zap className="w-3.5 h-3.5 text-amber-500" />,
        });
      }

      if (e.submittedAt) {
        events.push({
          id: `sub-${e.id}`,
          type: 'submission',
          title: `Submitted Proof for: ${e.taskTitle || 'Task'}`,
          description: e.userComment ? `Note: "${e.userComment}"` : 'Screenshot proof submitted.',
          timestamp: e.submittedAt,
          badgeVariant: 'warning',
          icon: <FileText className="w-3.5 h-3.5 text-blue-500" />,
        });
      }

      if (e.reviewedAt) {
        if (e.status === 'approved') {
          events.push({
            id: `app-${e.id}`,
            type: 'approval',
            title: `Proof Approved: ${e.taskTitle || 'Task'}`,
            description: `Reward of ₹${e.lockedReward || e.reward || e.rewardAmount || 0} credited to balance.`,
            timestamp: e.reviewedAt,
            badgeVariant: 'success',
            icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
          });
        } else if (e.status === 'rejected') {
          events.push({
            id: `rej-${e.id}`,
            type: 'rejection',
            title: `Proof Rejected: ${e.taskTitle || 'Task'}`,
            description: `Feedback: ${e.rejectionReason || 'Proof rejected by admin'}`,
            timestamp: e.reviewedAt,
            badgeVariant: 'danger',
            icon: <XCircle className="w-3.5 h-3.5 text-rose-500" />,
          });
        }
      }

      if (e.paymentRequestedAt) {
        events.push({
          id: `payreq-${e.id}`,
          type: 'payment_requested',
          title: 'Payout Requested',
          description: `Payout request for ₹${e.lockedReward || e.reward || 0}`,
          timestamp: e.paymentRequestedAt,
          badgeVariant: 'warning',
          icon: <DollarSign className="w-3.5 h-3.5 text-amber-500" />,
        });
      }

      if (e.paymentProcessedAt) {
        events.push({
          id: `paycomp-${e.id}`,
          type: 'payment_completed',
          title: 'Payout Completed',
          description: `Paid ₹${e.lockedReward || e.reward || 0}${e.paymentReference ? ` (Ref: ${e.paymentReference})` : ''}`,
          timestamp: e.paymentProcessedAt,
          badgeVariant: 'success',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
        });
      }
    });

    // Sort newest timestamp first
    return events.sort((a, b) => getSafeTime(b.timestamp) - getSafeTime(a.timestamp));
  }, [userDoc, assignedLeader, enrollments]);

  const handleCopyLeaderCode = () => {
    if (!userDoc?.leaderCode) return;
    navigator.clipboard.writeText(userDoc.leaderCode);
    setCopiedCode(true);
    toast({ variant: 'success', message: 'Leader code copied!' });
    setTimeout(() => setCopiedCode(false), 2000);
  };

  if (loading) {
    return (
      <PageContainer size="xl">
        <div className="space-y-4">
          <Skeleton className="h-10 w-48 rounded-xl" />
          <Skeleton className="h-44 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </PageContainer>
    );
  }

  if (error || !userDoc) {
    return (
      <PageContainer size="xl">
        <ContentContainer variant="card" className="p-8 text-center space-y-4 max-w-lg mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
          <XCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-extrabold text-[var(--text-primary)] font-heading">User Account Unavailable</h2>
          <p className="text-xs text-[var(--text-secondary)]">{error || 'Requested user does not exist or was deleted.'}</p>
          <Button variant="outline" size="sm" onClick={() => router.push('/admin/users')} className="rounded-xl font-bold">
            <ArrowLeft className="w-4 h-4 mr-2" /> Return to User Directory
          </Button>
        </ContentContainer>
      </PageContainer>
    );
  }

  const isTeamLeader = userDoc.memberType === 'team_leader';
  const isLeaderActive = userDoc.isLeaderActive !== false;

  return (
    <PageContainer size="xl">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <Link href="/admin/users">
          <Button variant="ghost" size="sm" className="text-xs font-bold rounded-xl text-slate-600 dark:text-slate-400">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to User Directory
          </Button>
        </Link>

        {/* Desktop Header Action Toolbar */}
        <div className="hidden lg:flex items-center gap-2">
          {isTeamLeader ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsLeaderModalOpen(true)}
              className="text-xs font-bold border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20 rounded-xl"
            >
              <Edit3 className="w-3.5 h-3.5 mr-1.5" /> Edit Leader Code
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsLeaderModalOpen(true)}
              className="text-xs font-bold border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20 rounded-xl"
            >
              <Award className="w-3.5 h-3.5 mr-1.5" /> Promote to Team Leader
            </Button>
          )}

          {userDoc.isBanned ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => unbanUser(userDoc.uid)}
              className="text-xs font-bold text-emerald-600 border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-xl"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Restore Account
            </Button>
          ) : (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setIsBanModalOpen(true)}
              className="text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl"
            >
              <UserX className="w-3.5 h-3.5 mr-1.5" /> Ban Account
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleUserActive(userDoc.uid, !userDoc.isActive)}
            className="text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800"
          >
            <Power className={`w-3.5 h-3.5 mr-1.5 ${userDoc.isActive ? 'text-amber-500' : 'text-emerald-500'}`} />
            {userDoc.isActive ? 'Deactivate' : 'Reactivate'}
          </Button>
        </div>
      </div>

      {/* Main Enterprise Profile Card */}
      <Card className="p-5 sm:p-6 mb-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar
              src={userDoc.photoURL || undefined}
              fallback={userDoc.displayName || userDoc.email || 'US'}
              className="w-16 h-16 ring-4 ring-amber-500/20 rounded-full"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-[var(--text-primary)] font-heading">
                  {userDoc.displayName || 'Unnamed Member'}
                </h1>

                {/* Role Badges */}
                {userDoc.role === 'admin' && (
                  <Badge variant="accent" className="bg-purple-600 text-white text-xs font-bold">
                    <Shield className="w-3.5 h-3.5 inline mr-1" /> Admin
                  </Badge>
                )}

                {isTeamLeader ? (
                  <Badge variant="accent" className="bg-amber-500 text-slate-950 text-xs font-bold">
                    <Award className="w-3.5 h-3.5 inline mr-1" /> Team Leader
                  </Badge>
                ) : userDoc.memberType === 'direct' ? (
                  <Badge variant="secondary" className="text-xs font-bold">
                    Direct Member
                  </Badge>
                ) : userDoc.memberType === 'pending' ? (
                  <Badge variant="warning" className="text-xs font-bold">
                    Pending Member
                  </Badge>
                ) : userDoc.memberType === 'team_member' ? (
                  <Badge variant="outline" className="text-xs font-bold border-indigo-500/30 text-indigo-600 dark:text-indigo-400">
                    Team Member
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs font-bold">
                    User
                  </Badge>
                )}

                {/* Status Badges */}
                {userDoc.isBanned ? (
                  <Badge variant="danger" className="text-xs font-bold">
                    <Ban className="w-3.5 h-3.5 inline mr-1" /> Banned
                  </Badge>
                ) : userDoc.isActive ? (
                  <Badge variant="success" className="text-xs font-bold">
                    <UserCheck className="w-3.5 h-3.5 inline mr-1" /> Active
                  </Badge>
                ) : (
                  <Badge variant="warning" className="text-xs font-bold">
                    Deactivated
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)] font-mono flex-wrap">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> {userDoc.email}
                </span>
                {userDoc.phoneNumber && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /> {userDoc.phoneNumber}
                  </span>
                )}
                <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                  UID: {userDoc.uid}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-center min-w-[90px]">
              <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] block">Completed</span>
              <span className="text-base font-extrabold font-mono text-[var(--text-primary)]">{userDoc.totalTasksCompleted || 0}</span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center min-w-[90px]">
              <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 block">Total Paid</span>
              <span className="text-base font-extrabold font-mono text-emerald-600 dark:text-emerald-400">₹{totalPaid}</span>
            </div>
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center min-w-[90px]">
              <span className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400 block">Pending Payout</span>
              <span className="text-base font-extrabold font-mono text-amber-600 dark:text-amber-400">₹{totalPendingPayout}</span>
            </div>
          </div>
        </div>

        {/* Ban Warning Box if Banned */}
        {userDoc.isBanned && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300 space-y-1">
            <div className="flex items-center justify-between font-bold">
              <span className="flex items-center gap-1.5 text-sm">
                <AlertTriangle className="w-4 h-4 text-rose-500" /> Administrative Ban Log
              </span>
              <span className="font-mono text-[10px] opacity-75">Banned At: {formatDate(userDoc.bannedAt)}</span>
            </div>
            <p className="opacity-90"><strong>Reason:</strong> {userDoc.banReason || 'No reason logged'}</p>
          </div>
        )}
      </Card>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 mb-6 text-xs font-bold overflow-x-auto">
        {[
          { id: 'overview', label: 'Overview & Identity', icon: <UserIcon className="w-3.5 h-3.5" /> },
          { id: 'timeline', label: `Activity Timeline (${activityTimelineEvents.length})`, icon: <History className="w-3.5 h-3.5" /> },
          { id: 'submissions', label: `Proof Submissions (${enrollments.filter((e) => e.screenshotUrl || e.proofUrl).length})`, icon: <FileText className="w-3.5 h-3.5" /> },
          { id: 'payments', label: `Payment History (${enrollments.filter((e) => e.paymentStatus).length})`, icon: <DollarSign className="w-3.5 h-3.5" /> },
          { id: 'enrollments', label: `Task Enrollments (${enrollments.length})`, icon: <Zap className="w-3.5 h-3.5" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as UserProfileTab);
              router.replace(`/admin/users/${userId}?tab=${tab.id}`);
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 shrink-0 ${
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm font-black'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW & IDENTITY */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Identity & Account Specs */}
          <div className="space-y-6 lg:col-span-2">
            <Card className="p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl space-y-4">
              <h3 className="text-sm font-extrabold text-[var(--text-primary)] font-heading border-b border-slate-100 dark:border-slate-800 pb-2.5 flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-amber-500" /> Member Identity & Account Metadata
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] block">Full Name</span>
                  <span className="font-bold text-[var(--text-primary)] text-sm">{userDoc.displayName || 'N/A'}</span>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] block">Email Address</span>
                  <span className="font-mono text-[var(--text-primary)]">{userDoc.email}</span>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] block">Phone Number</span>
                  <span className="font-mono text-[var(--text-primary)]">{userDoc.phoneNumber || 'Not Linked'}</span>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] block">Member Role</span>
                  <span className="font-semibold text-[var(--text-primary)] uppercase">{userDoc.memberType || 'direct'}</span>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] block">Joined Date</span>
                  <span className="font-mono text-[var(--text-primary)]">{formatDate(userDoc.createdAt)}</span>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] block">Last Login</span>
                  <span className="font-mono text-[var(--text-primary)]">{formatDate(userDoc.lastLoginAt)}</span>
                </div>
              </div>
            </Card>

            {/* Team Leader / Team Relationship Card */}
            <Card className="p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl space-y-4">
              <h3 className="text-sm font-extrabold text-[var(--text-primary)] font-heading border-b border-slate-100 dark:border-slate-800 pb-2.5 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" /> Team Hierarchy & Leader Relationship
              </h3>

              {isTeamLeader ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold uppercase text-[10px] text-amber-800 dark:text-amber-300">Leader Code</span>
                      <div className="flex items-center gap-1.5 font-mono">
                        <span className="font-black text-amber-600 dark:text-amber-400 text-sm">{userDoc.leaderCode || 'N/A'}</span>
                        {userDoc.leaderCode && (
                          <button
                            type="button"
                            onClick={handleCopyLeaderCode}
                            className="p-1 hover:bg-amber-500/20 rounded text-amber-700 dark:text-amber-300"
                          >
                            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-amber-500/20">
                      <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300">Leader Status</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isLeaderActive ? 'bg-emerald-500/20 text-emerald-600' : 'bg-rose-500/20 text-rose-600'
                      }`}>
                        {isLeaderActive ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>

                  {/* Team Members List */}
                  <div>
                    <span className="text-xs font-bold text-[var(--text-primary)] block mb-2">
                      Subordinate Team Members ({teamMembers.length})
                    </span>
                    {teamMembers.length === 0 ? (
                      <p className="text-xs text-[var(--text-muted)] italic p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                        No team members currently registered under this leader code.
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {teamMembers.map((m) => (
                          <div
                            key={m.uid}
                            className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs bg-slate-50 dark:bg-slate-800/40"
                          >
                            <div className="flex items-center gap-2.5">
                              <Avatar src={m.photoURL || undefined} fallback={m.displayName || m.email || 'TM'} className="w-8 h-8 rounded-full" />
                              <div>
                                <p className="font-bold text-[var(--text-primary)]">{m.displayName || 'Unnamed'}</p>
                                <p className="text-[10px] text-[var(--text-muted)] font-mono">{m.email}</p>
                              </div>
                            </div>

                            <Link href={`/admin/users/${m.uid}`}>
                              <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] font-bold">
                                View Member <ChevronRight className="w-3 h-3 ml-1" />
                              </Button>
                            </Link>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : assignedLeader ? (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Assigned Leader</span>
                    <Badge variant="accent" size="sm" className="bg-indigo-600 text-white font-bold text-[10px]">
                      Team Member
                    </Badge>
                  </div>

                  <div className="flex items-center gap-3">
                    <Avatar src={assignedLeader.photoURL || undefined} fallback={assignedLeader.displayName || assignedLeader.email || 'TL'} className="w-10 h-10 rounded-full ring-2 ring-amber-500/20" />
                    <div>
                      <p className="font-bold text-sm text-[var(--text-primary)]">{assignedLeader.displayName || 'Unnamed Leader'}</p>
                      <p className="text-xs text-[var(--text-secondary)] font-mono">{assignedLeader.email}</p>
                      <p className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 mt-0.5">Leader Code: {assignedLeader.leaderCode}</p>
                    </div>
                  </div>

                  <Link href={`/admin/users/${assignedLeader.uid}`}>
                    <Button variant="outline" size="sm" className="w-full text-xs font-bold rounded-xl mt-2">
                      View Team Leader Profile
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs text-center space-y-2">
                  <p className="text-[var(--text-secondary)] font-medium">This user is currently a Direct Member (unassigned to any Team Leader).</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsLeaderModalOpen(true)}
                    className="text-xs font-bold border-amber-500/30 text-amber-600 dark:text-amber-400 rounded-xl"
                  >
                    Promote to Team Leader
                  </Button>
                </div>
              )}
            </Card>
          </div>

          {/* Payment & Payout Credentials Sidebar */}
          <div className="space-y-6 lg:col-span-1">
            <Card className="p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl space-y-4">
              <h3 className="text-sm font-extrabold text-[var(--text-primary)] font-heading border-b border-slate-100 dark:border-slate-800 pb-2.5 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-500" /> Payout & Bank Credentials
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] block">UPI ID / VPA</span>
                  <p className="font-mono font-bold text-sm text-[var(--text-primary)] bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 mt-1">
                    {userDoc.upiId || 'Not Linked'}
                  </p>
                </div>

                <div className="space-y-2 pt-1">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] block">Bank Name</span>
                    <p className="font-medium text-[var(--text-primary)]">{userDoc.bankName || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] block">Account Holder</span>
                    <p className="font-medium text-[var(--text-primary)]">{userDoc.accountHolder || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] block">Account Number</span>
                    <p className="font-mono font-medium text-[var(--text-primary)]">{userDoc.accountNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] block">IFSC Code</span>
                    <p className="font-mono font-medium text-[var(--text-primary)]">{userDoc.ifscCode || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl space-y-3">
              <h3 className="text-sm font-extrabold text-[var(--text-primary)] font-heading flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-500" /> Reward Rate Override
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                {userDoc.effectiveReward !== null && userDoc.effectiveReward !== undefined
                  ? `Custom effective reward of ₹${userDoc.effectiveReward} is configured for this member.`
                  : 'Currently using standard task default rewards.'}
              </p>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: CHRONOLOGICAL ACTIVITY TIMELINE */}
      {activeTab === 'timeline' && (
        <Card className="p-5 sm:p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl space-y-4">
          <h3 className="text-sm font-extrabold text-[var(--text-primary)] font-heading flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <History className="w-4 h-4 text-amber-500" /> Real-time Activity Stream ({activityTimelineEvents.length} Events)
          </h3>

          {activityTimelineEvents.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)] text-center py-8">No recorded user activity events found.</p>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
              {activityTimelineEvents.map((evt) => (
                <div key={evt.id} className="relative flex items-start gap-3 text-xs">
                  <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 flex items-center justify-center shrink-0 shadow-xs">
                    {evt.icon}
                  </div>

                  <div className="flex-1 bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/60 space-y-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-extrabold text-[var(--text-primary)]">{evt.title}</span>
                      <span className="font-mono text-[10px] text-[var(--text-muted)]">{formatDateTime(evt.timestamp)}</span>
                    </div>
                    <p className="text-[var(--text-secondary)]">{evt.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* TAB 3: PROOF SUBMISSIONS */}
      {activeTab === 'submissions' && (
        <div className="space-y-4">
          {enrollments.filter((e) => e.screenshotUrl || e.proofUrl).length === 0 ? (
            <Card className="p-8 text-center text-xs text-[var(--text-secondary)] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              No proof submissions recorded for this user account.
            </Card>
          ) : (
            enrollments
              .filter((e) => e.screenshotUrl || e.proofUrl)
              .map((item) => (
                <Card key={item.id} className="p-4 sm:p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-extrabold text-sm text-[var(--text-primary)]">
                      {item.taskTitle || item.appName || 'Task Submission'}
                    </span>
                    <Badge variant={item.status === 'approved' ? 'success' : item.status === 'rejected' ? 'danger' : 'warning'} size="sm">
                      {(item.status || 'pending').toUpperCase()}
                    </Badge>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 items-start pt-2">
                    {item.screenshotUrl || item.proofUrl ? (
                      <button
                        type="button"
                        onClick={() => setSelectedImage(item.screenshotUrl || item.proofUrl || null)}
                        className="shrink-0 group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer"
                      >
                        <img
                          src={item.screenshotUrl || item.proofUrl}
                          alt="Proof"
                          className="w-32 h-32 object-cover group-hover:scale-105 transition-transform"
                        />
                        <span className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition-opacity">
                          <ExternalLink className="w-4 h-4 mr-1" /> Zoom Image
                        </span>
                      </button>
                    ) : null}

                    <div className="flex-1 space-y-2 text-xs">
                      {item.assignedComment && (
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase block">Assigned Text:</span>
                          <p className="font-mono text-[var(--text-primary)] mt-0.5">&quot;{item.assignedComment}&quot;</p>
                        </div>
                      )}

                      {item.userComment && (
                        <div>
                          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase block">User Submission Note:</span>
                          <p className="text-[var(--text-primary)]">{item.userComment}</p>
                        </div>
                      )}

                      <div className="text-[10px] text-[var(--text-muted)] font-mono">
                        Submitted: {formatDateTime(item.submittedAt)}
                      </div>
                    </div>
                  </div>
                </Card>
              ))
          )}
        </div>
      )}

      {/* TAB 4: PAYMENT HISTORY */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          {enrollments.filter((e) => e.paymentStatus).length === 0 ? (
            <Card className="p-8 text-center text-xs text-[var(--text-secondary)] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              No payout transactions recorded for this user yet.
            </Card>
          ) : (
            enrollments
              .filter((e) => e.paymentStatus)
              .map((item) => (
                <Card key={item.id} className="p-4 sm:p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-[var(--text-primary)] block">{item.taskTitle || 'Reward Payout'}</span>
                      <span className="text-[10px] text-[var(--text-muted)] font-mono">Enrollment ID: {item.id}</span>
                    </div>

                    <div className="text-right">
                      <span className="font-bold font-mono text-sm text-emerald-600 dark:text-emerald-400 block">
                        ₹{item.lockedReward || item.reward || item.rewardAmount || 0}
                      </span>
                      <Badge variant={item.paymentStatus === 'paid' ? 'success' : item.paymentStatus === 'processing' ? 'accent' : 'warning'} size="sm">
                        {(item.paymentStatus || 'pending').toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs space-y-1 font-mono">
                    <div className="flex justify-between">
                      <span>Requested:</span>
                      <span>{formatDateTime(item.paymentRequestedAt)}</span>
                    </div>
                    {item.paymentProcessedAt && (
                      <div className="flex justify-between font-bold text-emerald-600 dark:text-emerald-400">
                        <span>Paid:</span>
                        <span>{formatDateTime(item.paymentProcessedAt)}</span>
                      </div>
                    )}
                    {item.paymentReference && (
                      <div className="flex justify-between text-[var(--text-primary)] font-bold pt-1 border-t border-slate-200 dark:border-slate-700">
                        <span>Transaction Ref / UTR:</span>
                        <span>{item.paymentReference}</span>
                      </div>
                    )}
                  </div>
                </Card>
              ))
          )}
        </div>
      )}

      {/* TAB 5: TASK ENROLLMENTS */}
      {activeTab === 'enrollments' && (
        <div className="space-y-4">
          {enrollments.length === 0 ? (
            <Card className="p-8 text-center text-xs text-[var(--text-secondary)] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              No task enrollments recorded for this user yet.
            </Card>
          ) : (
            enrollments.map((item) => (
              <Card key={item.id} className="p-4 sm:p-5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-sm text-[var(--text-primary)]">{item.taskTitle || item.appName || 'Task'}</h4>
                    <p className="text-xs text-[var(--text-muted)] font-mono">Task ID: {item.taskId}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-bold font-mono text-sm text-emerald-600 dark:text-emerald-400">
                      ₹{item.lockedReward || item.reward || item.rewardAmount || 0}
                    </span>
                    <Badge variant={item.status === 'approved' ? 'success' : item.status === 'rejected' ? 'danger' : 'warning'} size="sm">
                      {(item.status || 'pending').toUpperCase()}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-[var(--text-secondary)] font-mono p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <div>
                    <span className="block text-[10px] text-[var(--text-muted)] uppercase">Enrolled</span>
                    {formatDate(item.enrolledAt)}
                  </div>
                  <div>
                    <span className="block text-[10px] text-[var(--text-muted)] uppercase">Submitted</span>
                    {item.submittedAt ? formatDate(item.submittedAt) : 'Not Submitted'}
                  </div>
                  <div>
                    <span className="block text-[10px] text-[var(--text-muted)] uppercase">Reviewed</span>
                    {item.reviewedAt ? formatDate(item.reviewedAt) : 'Awaiting Review'}
                  </div>
                </div>

                {item.rejectionReason && (
                  <p className="text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/30 p-2.5 rounded-xl border border-rose-200 dark:border-rose-800">
                    <strong>Rejection Feedback:</strong> {item.rejectionReason}
                  </p>
                )}
              </Card>
            ))
          )}
        </div>
      )}

      {/* Sticky Bottom Bar for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 py-3 px-4 z-40 shadow-2xl flex items-center justify-between gap-2">
        {userDoc.isBanned ? (
          <Button
            variant="outline"
            size="md"
            onClick={() => unbanUser(userDoc.uid)}
            className="flex-1 text-emerald-600 border-emerald-500/30 h-11 rounded-xl text-xs font-bold"
          >
            <RotateCcw className="w-4 h-4 mr-1.5 inline" /> Unban Account
          </Button>
        ) : (
          <Button
            variant="danger"
            size="md"
            onClick={() => setIsBanModalOpen(true)}
            className="flex-1 bg-rose-600 hover:bg-rose-700 text-white h-11 rounded-xl text-xs font-bold"
          >
            <UserX className="w-4 h-4 mr-1.5 inline" /> Ban Account
          </Button>
        )}

        <Button
          variant="outline"
          size="md"
          onClick={() => toggleUserActive(userDoc.uid, !userDoc.isActive)}
          className="flex-1 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 h-11 rounded-xl text-xs font-bold"
        >
          <Power className={`w-4 h-4 mr-1.5 inline ${userDoc.isActive ? 'text-amber-500' : 'text-emerald-500'}`} />
          {userDoc.isActive ? 'Deactivate' : 'Reactivate'}
        </Button>
      </div>

      {/* Proof Screenshot Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl">
            <img src={selectedImage} alt="Full Proof" className="max-w-full max-h-[85vh] object-contain rounded-xl" />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-3 right-3 bg-slate-900/80 text-white p-2 rounded-full hover:bg-slate-900"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Ban User Modal */}
      <BanUserModal
        isOpen={isBanModalOpen}
        onClose={() => setIsBanModalOpen(false)}
        user={userDoc}
        onConfirmBan={banUser}
      />

      {/* Promote or Edit Team Leader Modal */}
      <EditTeamLeaderModal
        isOpen={isLeaderModalOpen}
        onClose={() => setIsLeaderModalOpen(false)}
        user={userDoc}
        existingUsers={users}
        onSave={saveTeamLeader}
      />
    </PageContainer>
  );
}
