'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Megaphone, Sparkles, Flame, Zap, ShieldAlert, CheckCircle2, ChevronRight } from 'lucide-react';
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

export function AnnouncementBar() {
  const { settings } = useSiteSettings();
  const { tasks } = useLiveTasks();
  const { currentUser, userProfile } = useAuthContext();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Compile prioritized notice list
  const notices = useMemo(() => {
    const list: NoticeItem[] = [];

    // 1. Priority 1: Emergency Admin Notices
    if (settings?.maintenanceMode) {
      list.push({
        id: 'emerg-maint',
        priority: 1,
        type: 'emergency',
        title: 'Maintenance Alert',
        text: settings.maintenanceMessage || 'System undergoing scheduled maintenance optimization.',
        badgeText: 'Emergency',
        badgeVariant: 'danger',
      });
    }

    const cmsAnnouncement = settings?.announcement?.trim();
    if (cmsAnnouncement && (cmsAnnouncement.startsWith('🚨') || cmsAnnouncement.toLowerCase().includes('emergency') || cmsAnnouncement.toLowerCase().includes('urgent'))) {
      list.push({
        id: 'emerg-cms',
        priority: 1,
        type: 'emergency',
        title: 'Security Alert',
        text: cmsAnnouncement,
        badgeText: 'Urgent',
        badgeVariant: 'danger',
      });
    }

    // 2. Priority 2: Normal Admin CMS Notices
    if (cmsAnnouncement && !cmsAnnouncement.startsWith('🚨') && !cmsAnnouncement.toLowerCase().includes('emergency')) {
      list.push({
        id: 'cms-notice',
        priority: 2,
        type: 'cms',
        title: 'Announcement',
        text: cmsAnnouncement,
        badgeText: 'Notice',
        badgeVariant: 'primary',
      });
    }

    // 3. Priority 3: Automatic Task Notices (active, unexpired tasks)
    const activeTasks = tasks.filter((t) => t.status === 'active');
    activeTasks.forEach((task) => {
      const reward = task.rewardAmount || 15;
      const appName = task.appName || task.title || 'App Review';

      if (reward >= 25) {
        list.push({
          id: `task-high-${task.id}`,
          priority: 3,
          type: 'task',
          title: 'High Reward Campaign',
          text: `🎉 High Reward: ₹${reward} cash payout for reviewing ${appName}!`,
          badgeText: 'High Pay',
          badgeVariant: 'success',
          link: '#tasks-marketplace',
        });
      } else {
        list.push({
          id: `task-live-${task.id}`,
          priority: 3,
          type: 'task',
          title: 'New Task Live',
          text: `⚡ ${appName} review task available now — Earn ₹${reward} direct UPI cash!`,
          badgeText: 'Live Task',
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
          text: '📢 Add your UPI ID in Profile to enable instant direct cash payouts.',
          badgeText: 'Action',
          badgeVariant: 'warning',
          link: '/profile',
        });
      } else if (userProfile?.totalEarned && userProfile.totalEarned > 0) {
        list.push({
          id: 'user-earnings-notice',
          priority: 4,
          type: 'user',
          title: 'Verified Earner',
          text: `💰 Total Cash Earned: ₹${userProfile.totalEarned}. Keep reviewing apps to earn more!`,
          badgeText: 'Earnings',
          badgeVariant: 'success',
          link: '/payment',
        });
      }
    }

    // Sort strictly by priority order (1 -> 2 -> 3 -> 4)
    return list.sort((a, b) => a.priority - b.priority);
  }, [settings, tasks, currentUser, userProfile]);

  // Handle Rotation Timer
  useEffect(() => {
    if (notices.length <= 1 || isHovered) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % notices.length);
    }, 7000);

    return () => clearInterval(interval);
  }, [notices.length, isHovered]);

  // Adjust index if out of bounds
  const currentNotice = notices[currentIndex % Math.max(1, notices.length)];

  if (notices.length === 0 || !currentNotice) {
    return null;
  }

  const handleNoticeClick = () => {
    if (currentNotice.link) {
      if (currentNotice.link.startsWith('#')) {
        const el = document.getElementById(currentNotice.link.replace('#', ''));
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.location.href = currentNotice.link;
      }
    }
  };

  return (
    <div
      aria-label="Smart prioritized notice feed"
      className="w-full bg-gradient-to-r from-[var(--surface-elevated)] via-[var(--surface)] to-[var(--surface-elevated)] border-b border-[var(--border)] text-[var(--text-primary)] text-xs font-medium py-2 px-4 relative overflow-hidden flex items-center justify-between gap-2 shadow-2xs select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer" onClick={handleNoticeClick}>
        {/* Badge Indicator */}
        <Badge
          variant={currentNotice.badgeVariant}
          size="sm"
          className="z-10 shrink-0 font-bold tracking-tight shadow-xs flex items-center gap-1"
        >
          {currentNotice.priority === 1 ? (
            <ShieldAlert className="w-3.5 h-3.5 animate-pulse shrink-0" />
          ) : currentNotice.type === 'task' ? (
            <Flame className="w-3.5 h-3.5 fill-current shrink-0" />
          ) : currentNotice.type === 'user' ? (
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          ) : (
            <Megaphone className="w-3.5 h-3.5 shrink-0" />
          )}
          <span>{currentNotice.badgeText}</span>
        </Badge>

        {/* Animated Notice Text */}
        <div className="min-w-0 flex-1 overflow-hidden h-5 relative flex items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentNotice.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="truncate text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5"
            >
              <span className="truncate">{currentNotice.text}</span>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Ticker Counter / Link */}
      {notices.length > 1 && (
        <div className="flex items-center gap-1 shrink-0 text-[10px] font-mono font-bold text-[var(--text-muted)] bg-[var(--bg-muted)] px-2 py-0.5 rounded-[var(--radius-pill)] border border-[var(--border)]">
          <span>{currentIndex + 1}</span>
          <span>/</span>
          <span>{notices.length}</span>
        </div>
      )}
    </div>
  );
}

