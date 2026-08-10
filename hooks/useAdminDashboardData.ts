'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  getCountFromServer,
  Timestamp,
} from 'firebase/firestore';
import { getFirebaseDb } from '@/firebase/config';
import {
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

  const fetchCounts = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const db = getFirebaseDb();
      const usersCol = collection(db, FIRESTORE_COLLECTIONS.USERS);
      const tasksCol = collection(db, FIRESTORE_COLLECTIONS.TASKS);
      const enrollmentsCol = collection(db, FIRESTORE_COLLECTIONS.ENROLLMENTS);

      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const [
        totalUsersSnap,
        activeTasksSnap,
        pendingSnap,
        approvedSnap,
        todaySnap,
        paymentReqSnap,
      ] = await Promise.all([
        getCountFromServer(usersCol),
        getCountFromServer(query(tasksCol, where('status', '==', 'active'))),
        getCountFromServer(query(enrollmentsCol, where('status', '==', 'pending'))),
        getCountFromServer(query(enrollmentsCol, where('status', '==', 'approved'))),
        getCountFromServer(query(enrollmentsCol, where('enrolledAt', '>=', Timestamp.fromDate(startOfToday)))),
        getCountFromServer(query(enrollmentsCol, where('paymentStatus', '==', 'requested'))),
      ]);

      setStats({
        totalUsers: totalUsersSnap.data().count,
        activeTasks: activeTasksSnap.data().count,
        pendingSubmissions: pendingSnap.data().count,
        approvedTasks: approvedSnap.data().count,
        todaysEnrollments: todaySnap.data().count,
        eligiblePaymentRequests: paymentReqSnap.data().count,
      });
      setError(null);
      setLoading(false);
    } catch (err) {
      console.error('[Admin Dashboard] Aggregation fetch error:', err);
      setError('Failed to sync dashboard metrics.');
      setLoading(false);
    }
  }, [isAdmin]);

  const refetch = useCallback(() => {
    setError(null);
    setLoading(true);
    fetchCounts();
    setRefreshKey((prev) => prev + 1);
  }, [fetchCounts]);

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

  // Fetch counts on mount and refreshKey change
  useEffect(() => {
    if (isAdmin) {
      fetchCounts();
    }
  }, [isAdmin, refreshKey, fetchCounts]);

  // Realtime listeners for bounded recent activity and site settings
  useEffect(() => {
    if (!isAdmin) {
      queueMicrotask(() => {
        setLoading(false);
      });
      return;
    }

    let unsubRecent: (() => void) | null = null;
    let unsubSettings: (() => void) | null = null;

    try {
      const db = getFirebaseDb();
      const enrollmentsCol = collection(db, FIRESTORE_COLLECTIONS.ENROLLMENTS);

      // Bounded Query: Listen to top 10 Recent Activity items only
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
          // Refresh counts when activity changes
          fetchCounts();
        },
        (err) => {
          console.error('[Admin Dashboard] Recent activity snapshot error:', err);
        }
      );

      // Single Document Query: Listen to global Site Settings
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
      if (unsubRecent) unsubRecent();
      if (unsubSettings) unsubSettings();
    };
  }, [isAdmin, fetchCounts]);

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
