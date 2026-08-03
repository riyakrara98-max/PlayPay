'use client';

import { useMemo } from 'react';
import { TaskDocument } from '@/types/firestore';
import { calculateTaskAvailability, TaskAvailabilityInfo } from '@/lib/taskAvailability';

export function useTaskAvailability(
  task: TaskDocument,
  isEnrolled: boolean = false
): TaskAvailabilityInfo {
  return useMemo(() => {
    return calculateTaskAvailability(task, isEnrolled);
  }, [task, isEnrolled]);
}
