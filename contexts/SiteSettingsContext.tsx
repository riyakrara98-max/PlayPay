'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { getFirebaseDb } from '@/firebase/config';
import { SiteSettingsDocument, FIRESTORE_COLLECTIONS } from '@/types/firestore';
import { logFirestoreError, OperationType } from '@/lib/firebase-errors';

export const DEFAULT_AD_PLACEMENT = {
  enabled: false,
  code: '',
};

export const DEFAULT_ADS_CONFIG = {
  enabled: false,
  dashboard: { ...DEFAULT_AD_PLACEMENT },
  taskList: { ...DEFAULT_AD_PLACEMENT },
  taskDetails: { ...DEFAULT_AD_PLACEMENT },
  myTasks: { ...DEFAULT_AD_PLACEMENT },
  payment: { ...DEFAULT_AD_PLACEMENT },
  profile: { ...DEFAULT_AD_PLACEMENT },
  teamLeader: { ...DEFAULT_AD_PLACEMENT },
  mobile: { ...DEFAULT_AD_PLACEMENT },
  desktop: { ...DEFAULT_AD_PLACEMENT },
};

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
  heroEnabled: false,
  heroTitle: 'Earn Cash for Testing & Reviewing Apps',
  heroSubtitle: 'Download apps, submit review screenshots, and receive instant cash payouts directly to your UPI ID.',
  heroCtaText: 'START EARNING NOW',
  heroCtaLink: '#tasks-marketplace',
  heroBadgeText: 'Play Store App Review Platform',
  heroBgType: 'gradient',
  heroBgImageUrl: '',
  heroStartDate: '',
  heroEndDate: '',
  ads: DEFAULT_ADS_CONFIG,
  settingsVersion: 0,
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
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
              heroEnabled:
                typeof data.heroEnabled === 'boolean'
                  ? data.heroEnabled
                  : DEFAULT_SITE_SETTINGS.heroEnabled,
              heroTitle: data.heroTitle ?? DEFAULT_SITE_SETTINGS.heroTitle,
              heroSubtitle: data.heroSubtitle ?? DEFAULT_SITE_SETTINGS.heroSubtitle,
              heroCtaText: data.heroCtaText ?? DEFAULT_SITE_SETTINGS.heroCtaText,
              heroCtaLink: data.heroCtaLink ?? DEFAULT_SITE_SETTINGS.heroCtaLink,
              heroBadgeText: data.heroBadgeText ?? DEFAULT_SITE_SETTINGS.heroBadgeText,
              heroBgType: data.heroBgType === 'image' ? 'image' : 'gradient',
              heroBgImageUrl: data.heroBgImageUrl || '',
              heroStartDate: data.heroStartDate || '',
              heroEndDate: data.heroEndDate || '',
              ads: data.ads ? {
                enabled: typeof data.ads.enabled === 'boolean' ? data.ads.enabled : DEFAULT_ADS_CONFIG.enabled,
                dashboard: {
                  enabled: typeof data.ads.dashboard?.enabled === 'boolean' ? data.ads.dashboard.enabled : DEFAULT_AD_PLACEMENT.enabled,
                  code: data.ads.dashboard?.code || DEFAULT_AD_PLACEMENT.code,
                },
                taskList: {
                  enabled: typeof data.ads.taskList?.enabled === 'boolean' ? data.ads.taskList.enabled : DEFAULT_AD_PLACEMENT.enabled,
                  code: data.ads.taskList?.code || DEFAULT_AD_PLACEMENT.code,
                },
                taskDetails: {
                  enabled: typeof data.ads.taskDetails?.enabled === 'boolean' ? data.ads.taskDetails.enabled : DEFAULT_AD_PLACEMENT.enabled,
                  code: data.ads.taskDetails?.code || DEFAULT_AD_PLACEMENT.code,
                },
                myTasks: {
                  enabled: typeof data.ads.myTasks?.enabled === 'boolean' ? data.ads.myTasks.enabled : DEFAULT_AD_PLACEMENT.enabled,
                  code: data.ads.myTasks?.code || DEFAULT_AD_PLACEMENT.code,
                },
                payment: {
                  enabled: typeof data.ads.payment?.enabled === 'boolean' ? data.ads.payment.enabled : DEFAULT_AD_PLACEMENT.enabled,
                  code: data.ads.payment?.code || DEFAULT_AD_PLACEMENT.code,
                },
                profile: {
                  enabled: typeof data.ads.profile?.enabled === 'boolean' ? data.ads.profile.enabled : DEFAULT_AD_PLACEMENT.enabled,
                  code: data.ads.profile?.code || DEFAULT_AD_PLACEMENT.code,
                },
                teamLeader: {
                  enabled: typeof data.ads.teamLeader?.enabled === 'boolean' ? data.ads.teamLeader.enabled : DEFAULT_AD_PLACEMENT.enabled,
                  code: data.ads.teamLeader?.code || DEFAULT_AD_PLACEMENT.code,
                },
                mobile: {
                  enabled: typeof data.ads.mobile?.enabled === 'boolean' ? data.ads.mobile.enabled : DEFAULT_AD_PLACEMENT.enabled,
                  code: data.ads.mobile?.code || DEFAULT_AD_PLACEMENT.code,
                },
                desktop: {
                  enabled: typeof data.ads.desktop?.enabled === 'boolean' ? data.ads.desktop.enabled : DEFAULT_AD_PLACEMENT.enabled,
                  code: data.ads.desktop?.code || DEFAULT_AD_PLACEMENT.code,
                },
              } : DEFAULT_ADS_CONFIG,
              settingsVersion: data.settingsVersion ?? 0,
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
          logFirestoreError(err, OperationType.GET, docPath);
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

