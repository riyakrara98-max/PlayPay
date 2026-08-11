'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  Loader2,
  Megaphone,
  Wrench,
  Smartphone,
  Calendar,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Globe,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getFirebaseDb } from '@/firebase/config';
import {
  SiteSettingsDocument,
  CloudinaryMetadata,
  FIRESTORE_COLLECTIONS,
} from '@/types/firestore';
import { PageContainer } from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/layout/SectionHeader';
import { ContentContainer } from '@/components/layout/ContentContainer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { CloudinaryIconUpload } from '@/components/admin/CloudinaryIconUpload';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { logAdminActivity } from '@/lib/audit-logger';

export default function AdminSettingsPage() {
  const { settings, loading: settingsLoading } = useSiteSettings();
  const { currentUser, userProfile, isAdmin } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState<SiteSettingsDocument>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [concurrencyConflict, setConcurrencyConflict] = useState<boolean>(false);

  // Sync form state when Firestore settings snapshot loads or updates
  useEffect(() => {
    if (settings) {
      setFormData(settings);
      setConcurrencyConflict(false);
    }
  }, [settings]);

  const handleLogoChange = (url: string, metadata?: CloudinaryMetadata | null) => {
    setFormData((prev) => ({
      ...prev,
      logo: url,
      logoMetadata: metadata || null,
    }));
  };

  const handleReloadLatest = () => {
    setFormData(settings);
    setConcurrencyConflict(false);
    setValidationError(null);
    toast({
      variant: 'info',
      title: 'Settings Reloaded',
      message: 'Latest configuration loaded from server.',
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setConcurrencyConflict(false);

    // Rule 12: Admin Role Validation Before Sensitive Operation
    if (!isAdmin && userProfile?.role !== 'admin') {
      setValidationError('Security Violation: You do not have permission to modify site settings.');
      toast({
        variant: 'error',
        title: 'Access Denied',
        message: 'Admin privileges required.',
      });
      return;
    }

    // Form Validations
    if (!formData.siteName.trim()) {
      setValidationError('Site Name cannot be empty.');
      return;
    }

    if (formData.paymentEligibilityDays < 1 || formData.paymentEligibilityDays > 365) {
      setValidationError('Payment Eligibility Days must be between 1 and 365.');
      return;
    }

    if (formData.adminWhatsAppNumber.trim()) {
      const cleanPhone = formData.adminWhatsAppNumber.replace(/[\s\-\+\(\)]/g, '');
      if (!/^\d{10,15}$/.test(cleanPhone)) {
        setValidationError('Please enter a valid WhatsApp phone number (10 to 15 digits).');
        return;
      }
    }

    setIsSaving(true);

    const oldPublicId = settings.logoMetadata?.public_id || '';
    const newPublicId = formData.logoMetadata?.public_id || '';
    const isLogoChanged = newPublicId !== oldPublicId && !!newPublicId;

    try {
      const db = getFirebaseDb();
      const settingsRef = doc(db, FIRESTORE_COLLECTIONS.SITE_SETTINGS, 'global');

      // Rule 4: Settings Concurrency Check - Fetch Latest Firestore Document First
      const latestSnap = await getDoc(settingsRef);
      if (latestSnap.exists()) {
        const latestData = latestSnap.data() as SiteSettingsDocument;
        const currentServerVersion = latestData.settingsVersion || 0;
        const localLoadedVersion = settings.settingsVersion || 0;

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

          // Rollback newly uploaded logo if any was uploaded during this edit session
          if (isLogoChanged && newPublicId) {
            fetch('/api/upload/rollback', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ publicId: newPublicId }),
            }).catch((err) => console.error('[Logo Rollback Error]', err));
          }

          setIsSaving(false);
          return;
        }
      }

      const nextVersion = (settings.settingsVersion || 0) + 1;
      const nowIso = new Date().toISOString();

      const payload: SiteSettingsDocument = {
        siteName: formData.siteName.trim(),
        tagline: formData.tagline?.trim() || '',
        logo: formData.logo || '',
        logoMetadata: formData.logoMetadata || null,
        announcement: formData.announcementText?.trim() || formData.announcement?.trim() || '',
        announcementText: formData.announcementText?.trim() || formData.announcement?.trim() || '',
        announcementEnabled: !!formData.announcementEnabled,
        maintenanceMode: !!formData.maintenanceMode,
        maintenanceMessage: formData.maintenanceMessage?.trim() || '',
        paymentEligibilityDays: Number(formData.paymentEligibilityDays),
        adminWhatsAppNumber: formData.adminWhatsAppNumber.trim(),
        heroEnabled: !!formData.heroEnabled,
        heroTitle: formData.heroTitle?.trim() || '',
        heroSubtitle: formData.heroSubtitle?.trim() || '',
        heroCtaText: formData.heroCtaText?.trim() || '',
        heroCtaLink: formData.heroCtaLink?.trim() || '',
        heroBadgeText: formData.heroBadgeText?.trim() || '',
        heroBgType: formData.heroBgType === 'image' ? 'image' : 'gradient',
        heroBgImageUrl: formData.heroBgImageUrl?.trim() || '',
        heroStartDate: formData.heroStartDate?.trim() || '',
        heroEndDate: formData.heroEndDate?.trim() || '',
        ads: settings?.ads || formData.ads,
        settingsVersion: nextVersion,
        updatedAt: nowIso,
        updatedBy: currentUser?.uid || 'admin',
      };

      await setDoc(settingsRef, payload, { merge: true });

      // Rule 6: Delete old Cloudinary asset ONLY after Firestore update succeeds
      if (isLogoChanged && oldPublicId) {
        try {
          await fetch('/api/upload/rollback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ publicId: oldPublicId }),
          });
        } catch (delErr) {
          console.warn('[Old Logo Delete Warning]', delErr);
        }
      }

      // Rule 9: Audit Log Entry with changedFields
      await logAdminActivity({
        action: 'Settings Updated',
        performedBy: currentUser?.uid || 'admin',
        performedByName: userProfile?.displayName || 'Admin',
        performedByEmail: currentUser?.email || '',
        targetType: 'settings',
        targetId: 'global',
        targetName: 'Global Site Configuration',
        details: `Updated site settings to v${nextVersion}. Maintenance: ${payload.maintenanceMode}, Announcement: ${payload.announcementEnabled}`,
        before: settings as unknown as Record<string, unknown>,
        after: payload as unknown as Record<string, unknown>,
      });

      toast({
        variant: 'success',
        title: 'Settings Saved (v' + nextVersion + ')',
        message: 'Global site configuration updated in realtime.',
      });
    } catch (err) {
      console.error('[AdminSettings Save Error]', err);
      const msg = err instanceof Error ? err.message : 'Failed to update site settings.';
      setValidationError(msg);

      // Rollback newly uploaded logo on Firestore write failure
      if (isLogoChanged && newPublicId) {
        fetch('/api/upload/rollback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ publicId: newPublicId }),
        }).catch((rbErr) => console.error('[Logo Rollback Failure]', rbErr));
      }

      toast({
        variant: 'error',
        title: 'Save Failed',
        message: msg,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PageContainer size="xl">
      <SectionHeader
        title="Site Settings & System Configuration"
        subtitle="Manage global site branding, announcement banners, maintenance controls, and payout rules"
      />

      <ContentContainer variant="card" className="p-4 sm:p-6 space-y-8">
        <form onSubmit={handleSave} className="space-y-8 pb-20 md:pb-0">
          {/* Section 1: General Branding */}
          <div className="space-y-4">
            <h3 className="text-base font-extrabold text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--border)] pb-2.5">
              <Globe className="w-4 h-4 text-[var(--brand)]" /> Platform Branding & Identity
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-primary)]">
                  Site Name <span className="text-rose-500">*</span>
                </label>
                <Input
                  value={formData.siteName || ''}
                  onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
                  placeholder="e.g. PlayPay"
                  className="text-xs w-full"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-primary)]">
                  Tagline / Subtitle
                </label>
                <Input
                  value={formData.tagline || ''}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  placeholder="e.g. Earn Instant Daily Rewards"
                  className="text-xs w-full"
                />
              </div>
            </div>

            {/* Logo Upload */}
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-[var(--brand)]" /> Site Logo (Cloudinary Upload)
              </label>
              <CloudinaryIconUpload
                value={formData.logo}
                metadata={formData.logoMetadata}
                onChange={handleLogoChange}
                disabled={isSaving}
              />
            </div>
          </div>

          {/* Section 2: Announcement Manager & Live Preview */}
          <div className="space-y-4 pt-2 border-t border-[var(--border)]">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
              <h3 className="text-base font-extrabold text-[var(--text-primary)] flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-[var(--brand)]" /> Announcement Banner Manager
              </h3>

              {/* Enable Switch */}
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!formData.announcementEnabled}
                  onChange={(e) =>
                    setFormData({ ...formData, announcementEnabled: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--brand)]"></div>
                <span className="ml-2 text-xs font-semibold text-[var(--text-primary)]">
                  {formData.announcementEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </label>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[var(--text-primary)]">
                Announcement Message
              </label>
              <Input
                value={formData.announcementText || formData.announcement || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    announcementText: e.target.value,
                    announcement: e.target.value,
                  })
                }
                placeholder="Enter announcement text broadcasted to all users..."
                className="text-xs w-full"
              />
            </div>

            {/* Live Banner Preview */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" /> Announcement Live Preview
              </span>
              {formData.announcementEnabled && (formData.announcementText || formData.announcement) ? (
                <div className="p-3 rounded-xl bg-[var(--brand)]/10 border border-[var(--brand)]/30 text-[var(--brand)] text-xs font-medium flex items-center gap-2">
                  <Megaphone className="w-4 h-4 shrink-0 animate-bounce" />
                  <span>{formData.announcementText || formData.announcement}</span>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-[var(--bg-muted)] border border-[var(--border)] text-xs text-[var(--text-secondary)] italic">
                  Announcement banner is currently disabled or empty.
                </div>
              )}
            </div>
          </div>

          {/* Section 2.5: Homepage Hero CMS Manager */}
          <div className="space-y-4 pt-2 border-t border-[var(--border)]">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
              <h3 className="text-base font-extrabold text-[var(--text-primary)] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" /> Homepage Hero Banner CMS
              </h3>

              {/* Enable Hero Switch */}
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!formData.heroEnabled}
                  onChange={(e) =>
                    setFormData({ ...formData, heroEnabled: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--brand)]"></div>
                <span className="ml-2 text-xs font-semibold text-[var(--text-primary)]">
                  {formData.heroEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-primary)]">
                  Hero Title
                </label>
                <Input
                  value={formData.heroTitle || ''}
                  onChange={(e) => setFormData({ ...formData, heroTitle: e.target.value })}
                  placeholder="e.g. Earn Cash for Testing & Reviewing Apps"
                  className="text-xs w-full"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-primary)]">
                  Badge Text (Top Pill)
                </label>
                <Input
                  value={formData.heroBadgeText || ''}
                  onChange={(e) => setFormData({ ...formData, heroBadgeText: e.target.value })}
                  placeholder="e.g. Play Store App Review Platform"
                  className="text-xs w-full"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-[var(--text-primary)]">
                  Hero Subtitle / Description
                </label>
                <Input
                  value={formData.heroSubtitle || ''}
                  onChange={(e) => setFormData({ ...formData, heroSubtitle: e.target.value })}
                  placeholder="e.g. Download apps, submit review screenshots, and receive instant cash payouts..."
                  className="text-xs w-full"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-primary)]">
                  CTA Button Text
                </label>
                <Input
                  value={formData.heroCtaText || ''}
                  onChange={(e) => setFormData({ ...formData, heroCtaText: e.target.value })}
                  placeholder="e.g. START EARNING NOW"
                  className="text-xs w-full font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-primary)]">
                  CTA Button Link / Anchor
                </label>
                <Input
                  value={formData.heroCtaLink || ''}
                  onChange={(e) => setFormData({ ...formData, heroCtaLink: e.target.value })}
                  placeholder="e.g. #tasks-marketplace or /my-tasks"
                  className="text-xs w-full font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-primary)]">
                  Background Style
                </label>
                <select
                  value={formData.heroBgType || 'gradient'}
                  onChange={(e) => setFormData({ ...formData, heroBgType: e.target.value as 'gradient' | 'image' })}
                  className="w-full px-3 py-2 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-[var(--radius-md)] text-xs text-[var(--text-primary)]"
                >
                  <option value="gradient">Gradient Overlay</option>
                  <option value="image">Custom Image URL</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-primary)]">
                  Background Image URL (Optional)
                </label>
                <Input
                  value={formData.heroBgImageUrl || ''}
                  onChange={(e) => setFormData({ ...formData, heroBgImageUrl: e.target.value })}
                  placeholder="https://..."
                  className="text-xs w-full font-mono"
                  disabled={formData.heroBgType !== 'image'}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-primary)]">
                  Start Date (Optional)
                </label>
                <Input
                  type="date"
                  value={formData.heroStartDate ? formData.heroStartDate.slice(0, 10) : ''}
                  onChange={(e) => setFormData({ ...formData, heroStartDate: e.target.value })}
                  className="text-xs w-full font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-primary)]">
                  End Date (Optional)
                </label>
                <Input
                  type="date"
                  value={formData.heroEndDate ? formData.heroEndDate.slice(0, 10) : ''}
                  onChange={(e) => setFormData({ ...formData, heroEndDate: e.target.value })}
                  className="text-xs w-full font-mono"
                />
              </div>
            </div>

            {/* Hero Live Preview */}
            <div className="space-y-1.5 pt-2">
              <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" /> Homepage Hero Live Preview
              </span>
              {formData.heroEnabled ? (
                <div
                  className={`p-4 rounded-xl border border-[var(--primary)]/30 text-xs space-y-2 relative overflow-hidden ${
                    formData.heroBgType === 'image' && formData.heroBgImageUrl
                      ? 'bg-cover bg-center text-white'
                      : 'bg-gradient-to-r from-[var(--primary)]/15 via-[var(--surface)] to-[var(--success)]/15'
                  }`}
                  style={
                    formData.heroBgType === 'image' && formData.heroBgImageUrl
                      ? { backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${formData.heroBgImageUrl})` }
                      : {}
                  }
                >
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[var(--radius-pill)] bg-[var(--primary)]/10 text-[var(--primary)] text-[10px] font-bold border border-[var(--primary)]/20">
                    <Sparkles className="w-3 h-3 fill-current" />
                    <span>{formData.heroBadgeText || 'Badge Text'}</span>
                  </div>
                  <h4 className="text-base font-extrabold text-[var(--text-primary)]">
                    {formData.heroTitle || 'Hero Title Placeholder'}
                  </h4>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {formData.heroSubtitle || 'Hero subtitle placeholder...'}
                  </p>
                  <Button variant="primary" size="sm" className="font-extrabold text-xs">
                    {formData.heroCtaText || 'START EARNING'}
                  </Button>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-[var(--bg-muted)] border border-[var(--border)] text-xs text-[var(--text-secondary)] italic">
                  Hero Banner is OFF. Homepage will collapse and show available tasks directly below the notice bar.
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Maintenance Mode Control */}
          <div className="space-y-4 pt-2 border-t border-[var(--border)]">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
              <h3 className="text-base font-extrabold text-[var(--text-primary)] flex items-center gap-2">
                <Wrench className="w-4 h-4 text-amber-500" /> Maintenance Mode Controls
              </h3>

              {/* Maintenance Toggle */}
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!formData.maintenanceMode}
                  onChange={(e) =>
                    setFormData({ ...formData, maintenanceMode: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                <span className={`ml-2 text-xs font-semibold ${formData.maintenanceMode ? 'text-amber-500' : 'text-[var(--text-secondary)]'}`}>
                  {formData.maintenanceMode ? 'Active (Non-admins Blocked)' : 'Inactive (Normal)'}
                </span>
              </label>
            </div>

            {formData.maintenanceMode && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                <div>
                  <p className="font-bold">Maintenance Guard Notice</p>
                  <p className="opacity-90">
                    When Maintenance Mode is active, all regular users are blocked from viewing tasks or making payout requests. Administrators bypass this check automatically.
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-primary)]">
                Maintenance Message Displayed to Users
              </label>
              <Input
                value={formData.maintenanceMessage || ''}
                onChange={(e) =>
                  setFormData({ ...formData, maintenanceMessage: e.target.value })
                }
                placeholder="e.g. System is undergoing scheduled upgrades..."
                className="text-xs w-full"
              />
            </div>
          </div>

          {/* Section 4: Operational Rules & Support */}
          <div className="space-y-4 pt-2 border-t border-[var(--border)]">
            <h3 className="text-base font-extrabold text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--border)] pb-2.5">
              <Smartphone className="w-4 h-4 text-[var(--brand)]" /> Operational Rules & Support
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-500" /> Admin WhatsApp Number
                </label>
                <Input
                  value={formData.adminWhatsAppNumber || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, adminWhatsAppNumber: e.target.value })
                  }
                  placeholder="e.g. +91 9876543210"
                  className="text-xs w-full font-mono"
                />
                <p className="text-[10px] text-[var(--text-secondary)]">
                  Used for direct user support buttons and payout verification on WhatsApp.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[var(--brand)]" /> Payment Eligibility Days
                </label>
                <Input
                  type="number"
                  min={1}
                  max={365}
                  value={formData.paymentEligibilityDays || 7}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      paymentEligibilityDays: parseInt(e.target.value, 10) || 1,
                    })
                  }
                  className="text-xs w-full font-mono"
                />
                <p className="text-[10px] text-[var(--text-secondary)]">
                  Days after registration before user can request task payouts.
                </p>
              </div>
            </div>
          </div>

          {/* Concurrency Conflict / Error Banner */}
          {concurrencyConflict && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-700 dark:text-amber-300 text-xs space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Stale Settings State Detected</p>
                  <p className="opacity-90">{validationError}</p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleReloadLatest}
                className="bg-amber-500 text-white hover:bg-amber-600 border-none text-xs font-semibold"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                Reload Latest Server Configuration
              </Button>
            </div>
          )}

          {validationError && !concurrencyConflict && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500 text-xs font-medium">
              {validationError}
            </div>
          )}

          {/* Submit Action - Responsive Sticky Mobile Action Bar */}
          <div className="fixed bottom-0 left-0 right-0 md:relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-md md:backdrop-blur-none border-t border-[var(--border)] md:border-t-0 py-3.5 px-4 md:p-0 z-40 md:z-auto shadow-[0_-5px_25px_rgba(0,0,0,0.06)] md:shadow-none flex justify-end pb-[calc(14px+env(safe-area-inset-bottom))] md:pb-0">
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isSaving || settingsLoading}
              className="bg-[var(--brand)] hover:opacity-90 text-white min-w-[160px] w-full md:w-auto h-11 rounded-xl font-bold transition-all"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving Settings...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Settings Realtime
                </>
              )}
            </Button>
          </div>
        </form>
      </ContentContainer>
    </PageContainer>
  );
}
