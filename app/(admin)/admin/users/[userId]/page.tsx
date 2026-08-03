'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
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
} from 'lucide-react';
import { doc, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import { getFirebaseDb, isFirebaseConfigured } from '@/firebase/config';
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
import { useAuth } from '@/hooks/useAuth';
import { useAdminUsers } from '@/hooks/useAdminUsers';

export default function UserDetailPage() {
  const params = useParams();
  const userId = params?.userId as string;
  const router = useRouter();

  const { currentUser, userProfile: adminProfile } = useAuth();
  const { banUser, unbanUser, toggleUserActive } = useAdminUsers(
    currentUser?.uid,
    adminProfile?.displayName || 'Admin',
    currentUser?.email || ''
  );

  const [userDoc, setUserDoc] = useState<UserDocument | null>(null);
  const [enrollments, setEnrollments] = useState<EnrollmentDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isBanModalOpen, setIsBanModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'enrollments' | 'payments' | 'submissions'>('enrollments');

  // Realtime subscription to target user document and their enrollments
  useEffect(() => {
    if (!userId || !isFirebaseConfigured()) {
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
        (snap) => {
          if (snap.exists()) {
            setUserDoc({ uid: snap.id, ...(snap.data() as Omit<UserDocument, 'uid'>) });
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
          // Sort newest enrolled first
          list.sort((a, b) => (b.enrolledAt || '').localeCompare(a.enrolledAt || ''));
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

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return 'N/A';
    try {
      return new Date(isoString).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  if (loading) {
    return (
      <PageContainer size="xl">
        <div className="space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </PageContainer>
    );
  }

  if (error || !userDoc) {
    return (
      <PageContainer size="xl">
        <ContentContainer variant="card" className="p-8 text-center space-y-4">
          <XCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-[var(--text-primary)]">User Account Unavailable</h2>
          <p className="text-sm text-[var(--text-secondary)]">{error || 'Requested user does not exist.'}</p>
          <Button variant="outline" size="sm" onClick={() => router.push('/admin/users')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to User Manager
          </Button>
        </ContentContainer>
      </PageContainer>
    );
  }

  const approvedCount = enrollments.filter((e) => e.status === 'approved').length;
  const rejectedCount = enrollments.filter((e) => e.status === 'rejected').length;
  const pendingCount = enrollments.filter((e) => e.status === 'pending').length;
  const totalPaid = enrollments
    .filter((e) => e.paymentStatus === 'paid')
    .reduce((sum, e) => sum + (e.lockedReward || e.reward || e.rewardAmount || 0), 0);

  return (
    <PageContainer size="xl">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <Link href="/admin/users">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Users
          </Button>
        </Link>

        {/* Quick Admin Actions */}
        <div className="flex items-center gap-2">
          {userDoc.isBanned ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => unbanUser(userDoc.uid)}
              className="text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Unban Account
            </Button>
          ) : (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setIsBanModalOpen(true)}
            >
              <UserX className="w-3.5 h-3.5 mr-1.5" /> Ban Account
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleUserActive(userDoc.uid, !userDoc.isActive)}
          >
            <Power className={`w-3.5 h-3.5 mr-1.5 ${userDoc.isActive ? 'text-amber-500' : 'text-emerald-500'}`} />
            {userDoc.isActive ? 'Deactivate' : 'Reactivate'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Card & Bank Details */}
        <div className="space-y-6 lg:col-span-1">
          {/* Main Profile Card */}
          <Card className="p-5 space-y-5 border-[var(--border)] bg-[var(--card)]">
            <div className="flex items-center gap-4">
              <Avatar
                src={userDoc.photoURL || undefined}
                name={userDoc.displayName || userDoc.email || 'User'}
                size="lg"
              />
              <div className="space-y-1">
                <h2 className="text-lg font-extrabold text-[var(--text-primary)] leading-tight">
                  {userDoc.displayName || 'Unnamed User'}
                </h2>
                <p className="text-xs text-[var(--text-secondary)] font-mono">
                  {userDoc.email}
                </p>

                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {userDoc.role === 'admin' ? (
                    <Badge variant="accent" size="sm">
                      <Shield className="w-3 h-3 inline mr-1" /> Admin
                    </Badge>
                  ) : (
                    <Badge variant="secondary" size="sm">
                      User
                    </Badge>
                  )}

                  {userDoc.isBanned ? (
                    <Badge variant="danger" size="sm">
                      <Ban className="w-3 h-3 inline mr-1" /> Banned
                    </Badge>
                  ) : userDoc.isActive ? (
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
            </div>

            {/* Ban Info Warning */}
            {userDoc.isBanned && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <UserX className="w-3.5 h-3.5 text-rose-500" /> Account Restriction Log
                </p>
                <p className="opacity-90"><strong>Reason:</strong> {userDoc.banReason || 'No reason specified'}</p>
                <p className="text-[10px] opacity-75 font-mono">Banned At: {formatDate(userDoc.bannedAt)}</p>
              </div>
            )}

            {/* Quick Metadata List */}
            <div className="space-y-2.5 pt-2 border-t border-[var(--border)] text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-secondary)] flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> Phone Number:
                </span>
                <span className="font-mono font-medium text-[var(--text-primary)]">
                  {userDoc.phoneNumber || 'Not Linked'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[var(--text-secondary)] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Joined Date:
                </span>
                <span className="font-mono font-medium text-[var(--text-primary)]">
                  {formatDate(userDoc.createdAt)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[var(--text-secondary)] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Last Login:
                </span>
                <span className="font-mono font-medium text-[var(--text-primary)]">
                  {formatDate(userDoc.lastLoginAt)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[var(--text-secondary)]">User ID:</span>
                <span className="font-mono text-[10px] text-[var(--text-secondary)] select-all bg-[var(--bg-muted)] px-1.5 py-0.5 rounded">
                  {userDoc.uid}
                </span>
              </div>
            </div>
          </Card>

          {/* Payment & Bank Details Card */}
          <Card className="p-5 space-y-4 border-[var(--border)] bg-[var(--card)]">
            <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--border)] pb-2.5">
              <CreditCard className="w-4 h-4 text-[var(--brand)]" /> Payment & Payout Credentials
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[var(--text-secondary)] text-[11px] font-medium block">
                  UPI ID / Virtual Address
                </span>
                <p className="font-mono font-bold text-sm text-[var(--text-primary)] bg-[var(--bg-muted)] p-2 rounded-lg border border-[var(--border)] mt-1">
                  {userDoc.upiId || 'Not Provided'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-[var(--text-secondary)] text-[10px] font-medium block">
                    Bank Name
                  </span>
                  <p className="font-medium text-[var(--text-primary)]">
                    {userDoc.bankName || 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-[var(--text-secondary)] text-[10px] font-medium block">
                    Account Holder
                  </span>
                  <p className="font-medium text-[var(--text-primary)]">
                    {userDoc.accountHolder || 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-[var(--text-secondary)] text-[10px] font-medium block">
                    Account Number
                  </span>
                  <p className="font-mono font-medium text-[var(--text-primary)]">
                    {userDoc.accountNumber || 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-[var(--text-secondary)] text-[10px] font-medium block">
                    IFSC Code
                  </span>
                  <p className="font-mono font-medium text-[var(--text-primary)]">
                    {userDoc.ifscCode || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Payout Summary Metrics */}
          <Card className="p-4 bg-[var(--bg-muted)] border-[var(--border)] space-y-2">
            <span className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider block">
              Payout Summary
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-[var(--text-primary)]">Total Earnings Paid:</span>
              <span className="text-xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                ₹{totalPaid}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-[10px] pt-2 border-t border-[var(--border)] font-mono">
              <div className="p-1.5 rounded bg-[var(--card)] border border-[var(--border)]">
                <span className="block text-[var(--text-secondary)]">Approved</span>
                <span className="font-bold text-emerald-500">{approvedCount}</span>
              </div>
              <div className="p-1.5 rounded bg-[var(--card)] border border-[var(--border)]">
                <span className="block text-[var(--text-secondary)]">Pending</span>
                <span className="font-bold text-amber-500">{pendingCount}</span>
              </div>
              <div className="p-1.5 rounded bg-[var(--card)] border border-[var(--border)]">
                <span className="block text-[var(--text-secondary)]">Rejected</span>
                <span className="font-bold text-rose-500">{rejectedCount}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Interactive Tabs for Enrollments, Payments, Submissions */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tab Selection */}
          <div className="flex items-center gap-2 p-1.5 rounded-xl bg-[var(--bg-muted)] border border-[var(--border)] text-xs font-semibold">
            <button
              onClick={() => setActiveTab('enrollments')}
              className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'enrollments'
                  ? 'bg-[var(--card)] text-[var(--brand)] shadow-sm font-bold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Enrollment History ({enrollments.length})
            </button>

            <button
              onClick={() => setActiveTab('payments')}
              className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'payments'
                  ? 'bg-[var(--card)] text-[var(--brand)] shadow-sm font-bold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              Payment Timeline
            </button>

            <button
              onClick={() => setActiveTab('submissions')}
              className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'submissions'
                  ? 'bg-[var(--card)] text-[var(--brand)] shadow-sm font-bold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Proof Submissions
            </button>
          </div>

          {/* TAB 1: ENROLLMENT HISTORY */}
          {activeTab === 'enrollments' && (
            <div className="space-y-3">
              {enrollments.length === 0 ? (
                <Card className="p-8 text-center text-xs text-[var(--text-secondary)]">
                  No task enrollments recorded for this user yet.
                </Card>
              ) : (
                enrollments.map((item) => (
                  <Card
                    key={item.id}
                    className="p-4 border-[var(--border)] bg-[var(--card)] space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-sm text-[var(--text-primary)]">
                          {item.taskTitle || item.appName || 'Task'}
                        </h4>
                        <p className="text-xs text-[var(--text-secondary)] font-mono">
                          Task ID: {item.taskId}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-bold font-mono text-sm text-emerald-600 dark:text-emerald-400">
                          ₹{item.lockedReward || item.reward || item.rewardAmount || 0}
                        </span>
                        {item.status === 'approved' ? (
                          <Badge variant="success" size="sm">Approved</Badge>
                        ) : item.status === 'rejected' ? (
                          <Badge variant="danger" size="sm">Rejected</Badge>
                        ) : (
                          <Badge variant="warning" size="sm">Pending Review</Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-[var(--text-secondary)] font-mono p-2.5 rounded-lg bg-[var(--bg-muted)]">
                      <div>
                        <span className="block text-[10px] text-[var(--text-secondary)] font-sans uppercase">Enrolled</span>
                        {formatDate(item.enrolledAt)}
                      </div>
                      <div>
                        <span className="block text-[10px] text-[var(--text-secondary)] font-sans uppercase">Submitted</span>
                        {item.submittedAt ? formatDate(item.submittedAt) : 'Not Submitted'}
                      </div>
                      <div>
                        <span className="block text-[10px] text-[var(--text-secondary)] font-sans uppercase">Reviewed</span>
                        {item.reviewedAt ? formatDate(item.reviewedAt) : 'Awaiting Review'}
                      </div>
                    </div>

                    {item.rejectionReason && (
                      <p className="text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/30 p-2 rounded-lg border border-rose-200 dark:border-rose-800">
                        <strong>Rejection Feedback:</strong> {item.rejectionReason}
                      </p>
                    )}
                  </Card>
                ))
              )}
            </div>
          )}

          {/* TAB 2: PAYMENT TIMELINE */}
          {activeTab === 'payments' && (
            <div className="space-y-3">
              {enrollments.filter((e) => e.paymentStatus).length === 0 ? (
                <Card className="p-8 text-center text-xs text-[var(--text-secondary)]">
                  No payout activities or requests found for this user.
                </Card>
              ) : (
                enrollments
                  .filter((e) => e.paymentStatus)
                  .map((item) => (
                    <Card
                      key={item.id}
                      className="p-4 border-[var(--border)] bg-[var(--card)] space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-[var(--text-primary)] block">
                            {item.taskTitle || 'Reward Payout'}
                          </span>
                          <span className="text-[11px] text-[var(--text-secondary)] font-mono">
                            Ref / Enroll ID: {item.id}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="font-bold font-mono text-sm text-emerald-600 dark:text-emerald-400 block">
                            ₹{item.lockedReward || item.reward || item.rewardAmount || 0}
                          </span>
                          <Badge
                            variant={
                              item.paymentStatus === 'paid'
                                ? 'success'
                                : item.paymentStatus === 'processing'
                                ? 'primary'
                                : 'accent'
                            }
                            size="sm"
                          >
                            {(item.paymentStatus || 'pending').toUpperCase()}
                          </Badge>
                        </div>
                      </div>

                      <div className="p-3 rounded-lg bg-[var(--bg-muted)] border border-[var(--border)] text-xs space-y-1 font-mono">
                        <div className="flex justify-between">
                          <span>Requested At:</span>
                          <span>{formatDate(item.paymentRequestedAt)}</span>
                        </div>
                        {item.processingStartedAt && (
                          <div className="flex justify-between">
                            <span>Processing Started:</span>
                            <span>{formatDate(item.processingStartedAt)}</span>
                          </div>
                        )}
                        {item.paymentProcessedAt && (
                          <div className="flex justify-between font-bold text-emerald-600 dark:text-emerald-400">
                            <span>Payment Completed:</span>
                            <span>{formatDate(item.paymentProcessedAt)}</span>
                          </div>
                        )}
                        {item.paymentReference && (
                          <div className="flex justify-between text-[var(--text-primary)] font-bold pt-1 border-t border-[var(--border)]">
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

          {/* TAB 3: PROOF SUBMISSIONS */}
          {activeTab === 'submissions' && (
            <div className="space-y-3">
              {enrollments.filter((e) => e.screenshotUrl || e.proofUrl).length === 0 ? (
                <Card className="p-8 text-center text-xs text-[var(--text-secondary)]">
                  No screenshot proof documents uploaded by this user yet.
                </Card>
              ) : (
                enrollments
                  .filter((e) => e.screenshotUrl || e.proofUrl)
                  .map((item) => (
                    <Card key={item.id} className="p-4 border-[var(--border)] bg-[var(--card)] space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[var(--text-primary)]">
                          {item.taskTitle || 'Task Proof'}
                        </span>
                        <span className="text-[10px] font-mono text-[var(--text-secondary)]">
                          v{item.submissionVersion || 1} Proof
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4 items-start">
                        {item.screenshotUrl || item.proofUrl ? (
                          <a
                            href={item.screenshotUrl || item.proofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 group relative overflow-hidden rounded-lg border border-[var(--border)]"
                          >
                            <img
                              src={item.screenshotUrl || item.proofUrl}
                              alt="Proof"
                              className="w-28 h-28 object-cover group-hover:scale-105 transition-transform"
                            />
                            <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition-opacity">
                              <ExternalLink className="w-3.5 h-3.5 mr-1" /> View Image
                            </span>
                          </a>
                        ) : null}

                        <div className="flex-1 space-y-2 text-xs">
                          {item.assignedComment && (
                            <div className="p-2 rounded bg-[var(--bg-muted)] border border-[var(--border)]">
                              <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase block">
                                Assigned Comment Text:
                              </span>
                              <p className="font-mono text-[var(--text-primary)] mt-0.5">
                                "{item.assignedComment}"
                              </p>
                            </div>
                          )}

                          {item.userComment && (
                            <div>
                              <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase block">
                                User Note:
                              </span>
                              <p className="text-[var(--text-primary)]">{item.userComment}</p>
                            </div>
                          )}

                          <div className="text-[10px] text-[var(--text-secondary)] font-mono">
                            Submitted: {formatDate(item.submittedAt)}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Ban User Modal */}
      <BanUserModal
        isOpen={isBanModalOpen}
        onClose={() => setIsBanModalOpen(false)}
        user={userDoc}
        onConfirmBan={banUser}
      />
    </PageContainer>
  );
}
