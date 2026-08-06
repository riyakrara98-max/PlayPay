'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSafeTime } from '@/utils/formatters';

export interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  formatted: string;
}

export function useCountdown(expiresAt?: string): TimeLeft {
  const calculateTimeLeft = useCallback((): TimeLeft => {
    if (!expiresAt) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false, formatted: '' };
    }

    const target = getSafeTime(expiresAt);
    const now = new Date().getTime();
    const difference = target - now;

    if (isNaN(target) || difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true, formatted: 'Expired' };
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((difference / 1000 / 60) % 60);
    const seconds = Math.floor((difference / 1000) % 60);

    let formatted = '';
    if (days > 0) {
      formatted = `${days}d ${hours}h left`;
    } else if (hours > 0) {
      formatted = `${hours}h ${minutes}m left`;
    } else if (minutes > 0) {
      formatted = `${minutes}m ${seconds}s left`;
    } else {
      formatted = `${seconds}s left`;
    }

    return { days, hours, minutes, seconds, isExpired: false, formatted };
  }, [expiresAt]);

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft);

  useEffect(() => {
    if (!expiresAt) return;

    const timer = setInterval(() => {
      const updated = calculateTimeLeft();
      setTimeLeft(updated);
      if (updated.isExpired) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt, calculateTimeLeft]);

  return timeLeft;
}
