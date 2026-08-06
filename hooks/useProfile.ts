'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserDocument } from '@/types/firestore';

export interface UseProfileReturn {
  profile: UserDocument | null;
  loading: boolean;
  error: string | null;
  isOffline: boolean;
}

export function useProfile(): UseProfileReturn {
  const { userProfile, loading: authLoading } = useAuth();
  const [isOffline, setIsOffline] = useState<boolean>(() =>
    typeof window !== 'undefined' ? !navigator.onLine : false
  );

  // Monitor network status
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    profile: userProfile,
    loading: authLoading,
    error: null,
    isOffline,
  };
}

