import { TaskDocument } from '@/types/firestore';

export type ComputedTaskStatus = 'available' | 'almost_full' | 'full' | 'expired';

export interface TaskAvailabilityInfo {
  totalSlots: number;
  enrolledCount: number;
  remainingSlots: number;
  progressPercent: number;
  status: ComputedTaskStatus;
  isFull: boolean;
  isExpired: boolean;
  buttonText: string;
  isButtonDisabled: boolean;
}

export function calculateTaskAvailability(
  task: TaskDocument,
  isEnrolled: boolean = false
): TaskAvailabilityInfo {
  const totalSlots = task.totalSlots ?? task.maxSubmissions ?? 1;
  const enrolledCount = task.enrolledCount ?? task.currentSubmissions ?? 0;
  const remainingSlots = Math.max(0, totalSlots - enrolledCount);
  const progressPercent = Math.min(100, Math.round((enrolledCount / totalSlots) * 100));

  const isExpired = Boolean(
    task.expiresAt && !isNaN(new Date(task.expiresAt).getTime()) && new Date(task.expiresAt).getTime() <= Date.now()
  );

  const isFull = remainingSlots <= 0;

  let status: ComputedTaskStatus = 'available';
  if (isExpired) {
    status = 'expired';
  } else if (isFull) {
    status = 'full';
  } else if (progressPercent >= 80) {
    status = 'almost_full';
  }

  let buttonText = 'Enroll Now';
  let isButtonDisabled = false;

  if (isEnrolled) {
    buttonText = 'View Task →';
    isButtonDisabled = false; // Clicking will navigate in Phase 2C
  } else if (isExpired) {
    buttonText = 'Expired';
    isButtonDisabled = true;
  } else if (isFull) {
    buttonText = 'Task Full';
    isButtonDisabled = true;
  } else if (task.status !== 'active') {
    buttonText = 'Inactive';
    isButtonDisabled = true;
  }

  return {
    totalSlots,
    enrolledCount,
    remainingSlots,
    progressPercent,
    status,
    isFull,
    isExpired,
    buttonText,
    isButtonDisabled,
  };
}
