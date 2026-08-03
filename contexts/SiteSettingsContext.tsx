'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { getFirebaseDb, isFirebaseConfigured } from '@/firebase/config';
import { SiteSettingsDocument, FIRESTORE_COLLECTIONS } from '@/types/firestore';
import { handleFirestoreError, OperationType } from '@/lib/firebase-errors';

export const DEFAULT_SITE_SETTINGS: SiteSettingsDocument = {
  siteName: 'PlayPay',
  tagline: 'Earn Rewards with Simple Digital Tasks',
  logo: '',
  logoMetadata: null,
  announcement: 'Welcome to PlayPay Platform',
  announcementText: 'Welcome to PlayPay Platform! Complete simple tasks to earn instant daily rewards.',
  announcementEnabled: true,
  maintenanceMode: false,
  maintenanceMessage: 'System undergoes scheduled maintenance to optimize payment processing. Please check back shortly.',
  paymentEligibilityDays: 7,
  adminWhatsAppNumber: '',
  updatedAt: new Date().toISOString(),
};

export interface SiteSettingsContextType {
  settings: SiteSettingsDocument;
  loading: boolean;
  error: string | null;
}

export const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(undefined);

interface SiteSettingsProviderProps {
  children: React.ReactNode;
}

export function SiteSettingsProvider({ children }: SiteSettingsProviderProps) {
  const [settings, setSettings] = useState<SiteSettingsDocument>(DEFAULT_SITE_SETTINGS);
  const [loading, setLoading] = useState<boolean>(() => isFirebaseConfigured());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured()) return;

    const docPath = `${FIRESTORE_COLLECTIONS.SITE_SETTINGS}/global`;

    try {
      const db = getFirebaseDb();
      const settingsRef = doc(db, FIRESTORE_COLLECTIONS.SITE_SETTINGS, 'global');

      const unsubscribe = onSnapshot(
        settingsRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data() as Partial<SiteSettingsDocument>;
            setSettings({
              siteName: data.siteName || DEFAULT_SITE_SETTINGS.siteName,
              tagline: data.tagline || DEFAULT_SITE_SETTINGS.tagline,
              logo: data.logo || DEFAULT_SITE_SETTINGS.logo,
              logoMetadata: data.logoMetadata || null,
              announcement: data.announcement || data.announcementText || DEFAULT_SITE_SETTINGS.announcement,
              announcementText: data.announcementText || data.announcement || DEFAULT_SITE_SETTINGS.announcementText,
              announcementEnabled:
                typeof data.announcementEnabled === 'boolean'
                  ? data.announcementEnabled
                  : DEFAULT_SITE_SETTINGS.announcementEnabled,
              maintenanceMode:
                typeof data.maintenanceMode === 'boolean'
                  ? data.maintenanceMode
                  : DEFAULT_SITE_SETTINGS.maintenanceMode,
              maintenanceMessage:
                data.maintenanceMessage || DEFAULT_SITE_SETTINGS.maintenanceMessage,
              paymentEligibilityDays:
                data.paymentEligibilityDays ?? DEFAULT_SITE_SETTINGS.paymentEligibilityDays,
              adminWhatsAppNumber:
                data.adminWhatsAppNumber || DEFAULT_SITE_SETTINGS.adminWhatsAppNumber,
              updatedAt: data.updatedAt || DEFAULT_SITE_SETTINGS.updatedAt,
              updatedBy: data.updatedBy,
            });
          } else {
            setSettings(DEFAULT_SITE_SETTINGS);
          }
          setLoading(false);
          setError(null);
        },
        (err) => {
          setError(err.message);
          setLoading(false);
          handleFirestoreError(err, OperationType.GET, docPath);
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

  return (
    <SiteSettingsContext.Provider value={{ settings, loading, error }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettingsContext(): SiteSettingsContextType {
  const context = useContext(SiteSettingsContext);
  if (!context) {
    throw new Error('useSiteSettingsContext must be used within a SiteSettingsProvider');
  }
  return context;
}
