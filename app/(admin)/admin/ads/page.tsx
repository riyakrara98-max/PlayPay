'use client';

import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Save,
  Loader2,
  RefreshCw,
  AlertTriangle,
  LayoutDashboard,
  CheckSquare,
  FileCheck,
  User,
  CreditCard,
  UserCheck,
  Smartphone,
  Monitor,
} from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getFirebaseDb } from '@/firebase/config';
import { SiteSettingsDocument, FIRESTORE_COLLECTIONS, AdsSettings } from '@/types/firestore';
import { PageContainer } from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/layout/SectionHeader';
import { ContentContainer } from '@/components/layout/ContentContainer';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { logAdminActivity } from '@/lib/audit-logger';

const DEFAULT_AD_PLACEMENT = {
  enabled: false,
  code: '',
};

const DEFAULT_ADS_CONFIG: AdsSettings = {
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

export default function AdminAdsPage() {
  const { settings, loading: settingsLoading } = useSiteSettings();
  const { currentUser, userProfile, isAdmin } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState<AdsSettings>(DEFAULT_ADS_CONFIG);
  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [concurrencyConflict, setConcurrencyConflict] = useState<boolean>(false);

  // Sync form state when Firestore settings snapshot loads or updates
  useEffect(() => {
    if (settings && settings.ads) {
      setFormData(settings.ads);
      setConcurrencyConflict(false);
    }
  }, [settings]);

  const handleReloadLatest = () => {
    if (settings && settings.ads) {
      setFormData(settings.ads);
    } else {
      setFormData(DEFAULT_ADS_CONFIG);
    }
    setConcurrencyConflict(false);
    setValidationError(null);
    toast({
      variant: 'info',
      title: 'Settings Reloaded',
      message: 'Latest ads configuration loaded from server.',
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setConcurrencyConflict(false);

    // Rule 12: Admin Role Validation Before Sensitive Operation
    if (!isAdmin && userProfile?.role !== 'admin') {
      setValidationError('Security Violation: You do not have permission to modify ads settings.');
      toast({
        variant: 'error',
        title: 'Access Denied',
        message: 'Admin privileges required.',
      });
      return;
    }

    setIsSaving(true);

    try {
      const db = getFirebaseDb();
      const settingsRef = doc(db, FIRESTORE_COLLECTIONS.SITE_SETTINGS, 'global');

      // Rule 4: Settings Concurrency Check - Fetch Latest Firestore Document First
      const latestSnap = await getDoc(settingsRef);
      let latestData: SiteSettingsDocument | null = null;
      if (latestSnap.exists()) {
        latestData = latestSnap.data() as SiteSettingsDocument;
        const currentServerVersion = latestData.settingsVersion || 0;
        const localLoadedVersion = settings?.settingsVersion || 0;

        // Reject save if server version is newer than the version loaded on client
        if (currentServerVersion > localLoadedVersion) {
          setConcurrencyConflict(true);
          setValidationError(
            `Concurrency Alert: Another administrator (${latestData.updatedBy || 'admin'}) updated the site settings to version v${currentServerVersion}. Your save was prevented to prevent data loss. Please reload the latest data.`
          );
          toast({
            variant: 'error',
            title: 'Stale Data Warning',
            message: 'Settings were modified by another admin. Please reload before saving.',
          });
          setIsSaving(false);
          return;
        }
      }

      const nextVersion = (settings?.settingsVersion || 0) + 1;
      const nowIso = new Date().toISOString();

      // We preserve all existing settings in settingsRef, while specifically updating `ads`, `settingsVersion`, `updatedAt`, `updatedBy`
      const payload = {
        ...latestData, // Keep all other global settings safe
        ads: {
          enabled: !!formData.enabled,
          dashboard: {
            enabled: !!formData.dashboard.enabled,
            code: formData.dashboard.code || '',
          },
          taskList: {
            enabled: !!formData.taskList.enabled,
            code: formData.taskList.code || '',
          },
          taskDetails: {
            enabled: !!formData.taskDetails.enabled,
            code: formData.taskDetails.code || '',
          },
          myTasks: {
            enabled: !!formData.myTasks.enabled,
            code: formData.myTasks.code || '',
          },
          payment: {
            enabled: !!formData.payment.enabled,
            code: formData.payment.code || '',
          },
          profile: {
            enabled: !!formData.profile.enabled,
            code: formData.profile.code || '',
          },
          teamLeader: {
            enabled: !!formData.teamLeader.enabled,
            code: formData.teamLeader.code || '',
          },
          mobile: {
            enabled: !!formData.mobile.enabled,
            code: formData.mobile.code || '',
          },
          desktop: {
            enabled: !!formData.desktop.enabled,
            code: formData.desktop.code || '',
          },
        },
        settingsVersion: nextVersion,
        updatedAt: nowIso,
        updatedBy: currentUser?.uid || 'admin',
      };

      await setDoc(settingsRef, payload, { merge: true });

      // Rule 9: Audit Log Entry with changedFields
      await logAdminActivity({
        action: 'Settings Updated',
        performedBy: currentUser?.uid || 'admin',
        performedByName: userProfile?.displayName || 'Admin',
        performedByEmail: currentUser?.email || '',
        targetType: 'settings',
        targetId: 'global',
        targetName: 'Global Site Configuration',
        details: `Updated Adsterra ads configuration to v${nextVersion}. Global Ads Enabled: ${payload.ads.enabled}`,
        before: (settings || {}) as unknown as Record<string, unknown>,
        after: payload as unknown as Record<string, unknown>,
      });

      toast({
        variant: 'success',
        title: `Settings Saved (v${nextVersion})`,
        message: 'Adsterra ads configurations updated in realtime.',
      });
    } catch (err) {
      console.error('[AdminAds Save Error]', err);
      const msg = err instanceof Error ? err.message : 'Failed to update ads settings.';
      setValidationError(msg);
      toast({
        variant: 'error',
        title: 'Save Failed',
        message: msg,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updatePlacementEnabled = (key: keyof AdsSettings, val: boolean) => {
    if (key === 'enabled') {
      setFormData((prev) => ({ ...prev, enabled: val }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [key]: {
          ...(prev[key] as typeof DEFAULT_AD_PLACEMENT),
          enabled: val,
        },
      }));
    }
  };

  const updatePlacementCode = (key: Exclude<keyof AdsSettings, 'enabled'>, val: string) => {
    setFormData((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] as typeof DEFAULT_AD_PLACEMENT),
        code: val,
      },
    }));
  };

  if (settingsLoading) {
    return (
      <PageContainer size="xl">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
          <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
          <p className="text-xs text-[var(--text-secondary)] font-medium">Loading ads configurations...</p>
        </div>
      </PageContainer>
    );
  }

  // Placements metadata for rendering inputs beautifully and simply
  const placements = [
    {
      key: 'dashboard' as const,
      name: 'Dashboard Banner',
      desc: 'Shown at the top of the user dashboard.',
      icon: <LayoutDashboard className="w-4 h-4 text-sky-500" />,
    },
    {
      key: 'taskList' as const,
      name: 'Task Listing',
      desc: 'Shown within the active tasks marketplace.',
      icon: <CheckSquare className="w-4 h-4 text-emerald-500" />,
    },
    {
      key: 'taskDetails' as const,
      name: 'Task Details',
      desc: 'Shown on the individual task instructions/proof submission screen.',
      icon: <FileCheck className="w-4 h-4 text-violet-500" />,
    },
    {
      key: 'myTasks' as const,
      name: 'My Tasks',
      desc: "Shown on the user's active and completed history screen.",
      icon: <User className="w-4 h-4 text-amber-500" />,
    },
    {
      key: 'payment' as const,
      name: 'Payment Controls',
      desc: 'Shown on the withdrawal/UPI configuration screen.',
      icon: <CreditCard className="w-4 h-4 text-pink-500" />,
    },
    {
      key: 'profile' as const,
      name: 'User Profile',
      desc: 'Shown on the account and details editing screen.',
      icon: <User className="w-4 h-4 text-teal-500" />,
    },
    {
      key: 'teamLeader' as const,
      name: 'Team Leader Portal',
      desc: 'Shown to leaders on the downline rewards dashboard.',
      icon: <UserCheck className="w-4 h-4 text-indigo-500" />,
    },
    {
      key: 'mobile' as const,
      name: 'Mobile Placements Only',
      desc: 'Targeted exclusively for mobile devices (screen width < 768px).',
      icon: <Smartphone className="w-4 h-4 text-amber-600" />,
    },
    {
      key: 'desktop' as const,
      name: 'Desktop Placements Only',
      desc: 'Targeted exclusively for desktop monitors (screen width >= 768px).',
      icon: <Monitor className="w-4 h-4 text-blue-600" />,
    },
  ];

  return (
    <PageContainer size="xl">
      <SectionHeader
        title="Ads Setup"
        subtitle="Manage Adsterra advertisements and script placements across PlayPay"
      />

      <ContentContainer variant="card" className="p-4 sm:p-6 space-y-8">
        {validationError && (
          <div className="p-4 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 flex gap-3 text-rose-800 dark:text-rose-200 text-xs font-semibold leading-relaxed">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            <div className="flex-1 space-y-1.5">
              <span>{validationError}</span>
              {concurrencyConflict && (
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleReloadLatest}
                    className="mt-1 flex items-center gap-1.5 text-xs font-bold border-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-rose-900 dark:text-rose-100"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Force Reload Latest
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-8 pb-20 md:pb-0">
          {/* Master Toggle */}
          <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-sm font-extrabold text-[var(--text-primary)]">Enable Advertisements Globally</h4>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Primary switch to toggle all placements on or off instantly across the entire website.
              </p>
            </div>
            <Switch
              checked={formData.enabled}
              onChange={(checked) => updatePlacementEnabled('enabled', checked)}
              size="lg"
            />
          </div>

          {/* Placements Cards Grid */}
          <div className="space-y-5">
            <h3 className="text-sm font-extrabold text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--border)] pb-2.5">
              <Megaphone className="w-4 h-4 text-[var(--brand)]" /> Ad Placements & Scripts
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {placements.map((p) => {
                const placementConfig = formData[p.key] || DEFAULT_AD_PLACEMENT;
                return (
                  <Card key={p.key} className="p-4 border border-[var(--border)] bg-[var(--surface)] hover:shadow-xs transition-all space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className="p-2 rounded-lg bg-[var(--surface-elevated)] shrink-0">
                          {p.icon}
                        </div>
                        <div className="flex flex-col overflow-hidden">
                          <span className="text-xs font-bold text-[var(--text-primary)] truncate">{p.name}</span>
                          <span className="text-[10px] text-[var(--text-muted)] truncate">{p.desc}</span>
                        </div>
                      </div>
                      <Switch
                        checked={placementConfig.enabled}
                        onChange={(checked) => updatePlacementEnabled(p.key, checked)}
                        size="sm"
                        disabled={!formData.enabled}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-[var(--text-secondary)] flex items-center gap-1">
                        HTML / Adsterra Embed Code
                      </label>
                      <Textarea
                        value={placementConfig.code}
                        onChange={(e) => updatePlacementCode(p.key, e.target.value)}
                        placeholder="Paste script tags, image links or HTML ad codes here..."
                        rows={3}
                        className="font-mono text-[11px] w-full"
                        disabled={!formData.enabled || !placementConfig.enabled}
                      />
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={handleReloadLatest}
              disabled={isSaving}
              className="text-xs font-semibold gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Discard & Reset
            </Button>
            <Button
              type="submit"
              size="md"
              disabled={isSaving}
              className="text-xs font-bold gap-1.5 min-w-[120px]"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" /> Save Changes
                </>
              )}
            </Button>
          </div>
        </form>
      </ContentContainer>
    </PageContainer>
  );
}
