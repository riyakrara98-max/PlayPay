'use client';

import React, { useMemo } from 'react';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useLiveTasks } from '@/hooks/useLiveTasks';
import { useAuthContext } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';

export interface NoticeItem {
  id: string;
  priority: 1 | 2 | 3 | 4;
  type: 'emergency' | 'cms' | 'task' | 'user';
  title: string;
  text: string;
  badgeText: string;
  badgeVariant: 'danger' | 'warning' | 'primary' | 'success' | 'neutral';
  link?: string;
}

/**
  * Utility to strip all emojis and special pictogram characters from text
  */
function stripEmojis(text: string): string {
  if (!text) return '';
  return text
    .replace(/\p{Extended_Pictographic}|\p{Emoji_Presentation}/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function AnnouncementBar() {
  const { settings } = useSiteSettings();
  const { tasks } = useLiveTasks();
  const { currentUser, userProfile } = useAuthContext();

  // Compile prioritized notice list
  const notices = useMemo(() => {
    const list: NoticeItem[] = [];

    // 1. Priority 1: Emergency Admin Notices
    if (settings?.maintenanceMode) {
      const cleanMaint = stripEmojis(settings.maintenanceMessage || 'System undergoing scheduled maintenance optimization.');
      if (cleanMaint) {
        list.push({
          id: 'emerg-maint',
          priority: 1,
          type: 'emergency',
          title: 'Maintenance Alert',
          text: cleanMaint,
          badgeText: 'EMERGENCY',
          badgeVariant: 'danger',
        });
      }
    }

    const rawCmsAnnouncement = settings?.announcement?.trim() || '';
    const cleanCmsAnnouncement = stripEmojis(rawCmsAnnouncement);

    if (cleanCmsAnnouncement && (rawCmsAnnouncement.includes('emergency') || rawCmsAnnouncement.includes('urgent'))) {
      list.push({
        id: 'emerg-cms',
        priority: 1,
        type: 'emergency',
        title: 'Security Alert',
        text: cleanCmsAnnouncement,
        badgeText: 'URGENT',
        badgeVariant: 'danger',
      });
    }

    // 2. Priority 2: Normal Admin CMS Notices
    if (cleanCmsAnnouncement && !rawCmsAnnouncement.includes('emergency') && !rawCmsAnnouncement.includes('urgent')) {
      list.push({
        id: 'cms-notice',
        priority: 2,
        type: 'cms',
        title: 'Announcement',
        text: cleanCmsAnnouncement,
        badgeText: 'NOTICE',
        badgeVariant: 'primary',
      });
    }

    // 3. Priority 3: Automatic Task Notices (active tasks)
    const activeTasks = tasks.filter((t) => t.status === 'active');
    activeTasks.forEach((task) => {
      const reward = task.rewardAmount || 15;
      const appName = stripEmojis(task.appName || task.title || 'App Review');

      if (reward >= 25) {
        list.push({
          id: `task-high-${task.id}`,
          priority: 3,
          type: 'task',
          title: 'High Reward Campaign',
          text: `High Reward: ₹${reward} cash payout for reviewing ${appName}!`,
          badgeText: 'HIGH PAY',
          badgeVariant: 'success',
          link: '#tasks-marketplace',
        });
      } else {
        list.push({
          id: `task-live-${task.id}`,
          priority: 3,
          type: 'task',
          title: 'New Task Live',
          text: `${appName} review task available now — Earn ₹${reward} direct UPI cash!`,
          badgeText: 'LIVE TASK',
          badgeVariant: 'warning',
          link: '#tasks-marketplace',
        });
      }
    });

    // 4. Priority 4: Personal User Notices
    if (currentUser) {
      if (!userProfile?.upiId) {
        list.push({
          id: 'user-upi-notice',
          priority: 4,
          type: 'user',
          title: 'Setup Payouts',
          text: 'Add your UPI ID in Profile to enable instant direct cash payouts.',
          badgeText: 'ACTION',
          badgeVariant: 'warning',
          link: '/profile',
        });
      } else if (userProfile?.totalEarned && userProfile.totalEarned > 0) {
        list.push({
          id: 'user-earnings-notice',
          priority: 4,
          type: 'user',
          title: 'Verified Earner',
          text: `Total Cash Earned: ₹${userProfile.totalEarned}. Keep reviewing apps to earn more!`,
          badgeText: 'EARNINGS',
          badgeVariant: 'success',
          link: '/payment',
        });
      }
    }

    // Sort strictly by priority order
    return list.sort((a, b) => a.priority - b.priority);
  }, [settings, tasks, currentUser, userProfile]);

  if (notices.length === 0) {
    return null;
  }

  // Combine notice texts into marquee stream without emojis or icons
  const combinedText = notices.map((n) => n.text).join('   •   ');

  // Badge variant based on highest priority notice
  const highestPriority = notices[0];
  const badgeText = highestPriority.priority === 1 ? 'URGENT' : 'ANNOUNCEMENT';
  const badgeVariant = highestPriority.priority === 1 ? 'danger' : 'primary';

  return (
    <div
      aria-label="Scrolling Announcement Marquee"
      className="w-full bg-[var(--surface-elevated)] border-b border-[var(--border)] text-[var(--text-primary)] text-xs font-medium py-2 px-4 relative overflow-hidden flex items-center gap-3 shadow-2xs select-none group"
    >
      {/* Pure Text Badge (No Icons) */}
      <Badge
        variant={badgeVariant}
        size="sm"
        className="z-10 shrink-0 font-bold tracking-wider text-[10px] uppercase px-2.5 py-0.5 shadow-xs"
      >
        {badgeText}
      </Badge>

      {/* Scrolling Marquee Container */}
      <div className="overflow-hidden relative flex-1 flex items-center">
        <div className="inline-flex whitespace-nowrap animate-marquee group-hover:[animation-play-state:paused] gap-12">
          <span className="font-semibold text-xs text-[var(--text-primary)]">
            {combinedText} &nbsp;&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;&nbsp;
          </span>
          <span className="font-semibold text-xs text-[var(--text-primary)]">
            {combinedText} &nbsp;&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;&nbsp;
          </span>
        </div>
      </div>
    </div>
  );
}


