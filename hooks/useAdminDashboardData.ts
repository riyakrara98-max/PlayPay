'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { getFirebaseDb, isFirebaseConfigured } from '@/firebase/config';
import {
  UserDocument,
  TaskDocument,
  EnrollmentDocument,
  SiteSettingsDocument,
  FIRESTORE_COLLECTIONS,
} from '@/types/firestore';
import { useAuth } from '@/hooks/useAuth';

export interface AdminStats {
  totalUsers: number;
  activeTasks: number;
  pendingSubmissions: number;
  approvedTasks: number;
  todaysEnrollments: number;
  eligiblePaymentRequests: number;
}

export interface AdminDashboardData {
  stats: AdminStats;
  recentActivity: EnrollmentDocument[];
  siteSettings: Partial<SiteSettingsDocument> | null;
  loading: boolean;
  error: string | null;
  isOffline: boolean;
  refetch: () => void;
}

export function useAdminDashboardData(): AdminDashboardData {
  const { userProfile } = useAuth();
  const isAdmin = userProfile?.role === 'admin';

  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeTasks: 0,
    pendingSubmissions: 0,
    approvedTasks: 0,
    todaysEnrollments: 0,
    eligiblePaymentRequests: 0,
  });

  const [recentActivity, setRecentActivity] = useState<EnrollmentDocument[]>([]);
  const [siteSettings, setSiteSettings] = useState<Partial<SiteSettingsDocument> | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const refetch = useCallback(() => {
    setError(null);
    setLoading(true);
    setRefreshKey((prev) => prev + 1);
  }, []);

  // Online / Offline listener
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, []);

  useEffect(() => {
    if (!isAdmin || !isFirebaseConfigured()) {
      queueMicrotask(() => {
        setLoading(false);
      });
      return;
    }

    let unsubUsers: (() => void) | null = null;
    let unsubTasks: (() => void) | null = null;
    let unsubEnrollments: (() => void) | null = null;
    let unsubRecent: (() => void) | null = null;
    let unsubSettings: (() => void) | null = null;

    try {
      const db = getFirebaseDb();

      // 1. Listen to Users collection
      const usersCol = collection(db, FIRESTORE_COLLECTIONS.USERS);
      unsubUsers = onSnapshot(
        usersCol,
        (snap) => {
          const userCount = snap.size;
          setStats((prev) => ({ ...prev, totalUsers: userCount }));
        },
        (err) => {
          console.error('[Admin Dashboard] Users snapshot error:', err);
          setError('Failed to sync users count.');
        }
      );

      // 2. Listen to Tasks collection
      const tasksCol = collection(db, FIRESTORE_COLLECTIONS.TASKS);
      unsubTasks = onSnapshot(
        tasksCol,
        (snap) => {
          let activeCount = 0;
          snap.docs.forEach((docSnap) => {
            const data = docSnap.data() as TaskDocument;
            if (data.status === 'active') {
              activeCount++;
            }
          });
          setStats((prev) => ({ ...prev, activeTasks: activeCount }));
        },
        (err) => {
          console.error('[Admin Dashboard] Tasks snapshot error:', err);
          setError('Failed to sync active tasks.');
        }
      );

      // 3. Listen to Enrollments collection (for all enrollment stats)
      const enrollmentsCol = collection(db, FIRESTORE_COLLECTIONS.ENROLLMENTS);

      // Calculate start of today in ISO format (00:00:00.000 local time)
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

      unsubEnrollments = onSnapshot(
        enrollmentsCol,
        (snap) => {
          let pendingCount = 0;
          let approvedCount = 0;
          let todayCount = 0;
          let paymentReqCount = 0;

          snap.docs.forEach((docSnap) => {
            const data = docSnap.data() as EnrollmentDocument;

            // Pending Submissions
            if (data.status === 'pending') {
              pendingCount++;
            }

            // Approved Tasks
            if (data.status === 'approved') {
              approvedCount++;
            }

            // Today's Enrollments
            if (data.enrolledAt) {
              const enrolledTime = new Date(data.enrolledAt).getTime();
              if (!isNaN(enrolledTime) && enrolledTime >= startOfToday) {
                todayCount++;
              }
            }

            // Eligible Payment Requests
            if (data.paymentStatus === 'requested') {
              paymentReqCount++;
            }
          });

          setStats((prev) => ({
            ...prev,
            pendingSubmissions: pendingCount,
            approvedTasks: approvedCount,
            todaysEnrollments: todayCount,
            eligiblePaymentRequests: paymentReqCount,
          }));
          setLoading(false);
        },
        (err) => {
          console.error('[Admin Dashboard] Enrollments snapshot error:', err);
          setError('Failed to sync enrollment metrics.');
          setLoading(false);
        }
      );

      // 4. Listen to Recent 10 Activity items
      const recentQuery = query(
        enrollmentsCol,
        orderBy('enrolledAt', 'desc'),
        limit(10)
      );

      unsubRecent = onSnapshot(
        recentQuery,
        (snap) => {
          const activities: EnrollmentDocument[] = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<EnrollmentDocument, 'id'>),
          }));
          setRecentActivity(activities);
        },
        (err) => {
          console.error('[Admin Dashboard] Recent activity snapshot error:', err);
        }
      );

      // 5. Listen to Site Settings / global
      const settingsRef = doc(db, FIRESTORE_COLLECTIONS.SITE_SETTINGS, 'global');
      unsubSettings = onSnapshot(
        settingsRef,
        (snap) => {
          if (snap.exists()) {
            setSiteSettings(snap.data() as Partial<SiteSettingsDocument>);
          } else {
            setSiteSettings(null);
          }
        },
        (err) => {
          console.error('[Admin Dashboard] Site settings snapshot error:', err);
        }
      );
    } catch (err) {
      console.error('[Admin Dashboard] Listener initialization error:', err);
      const msg = err instanceof Error ? err.message : 'Error connecting to Firestore';
      queueMicrotask(() => {
        setError(msg);
        setLoading(false);
      });
    }

    return () => {
      if (unsubUsers) unsubUsers();
      if (unsubTasks) unsubTasks();
      if (unsubEnrollments) unsubEnrollments();
      if (unsubRecent) unsubRecent();
      if (unsubSettings) unsubSettings();
    };
  }, [isAdmin, refreshKey]);

  return useMemo(
    () => ({
      stats,
      recentActivity,
      siteSettings,
      loading,
      error,
      isOffline,
      refetch,
    }),
    [stats, recentActivity, siteSettings, loading, error, isOffline, refetch]
  );
}
