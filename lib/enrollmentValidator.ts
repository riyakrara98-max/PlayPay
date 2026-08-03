import { TaskDocument } from '@/types/firestore';

export type EnrollmentErrorCode =
  | 'TASK_INACTIVE'
  | 'TASK_EXPIRED'
  | 'TASK_FULL'
  | 'ALREADY_ENROLLED'
  | 'NETWORK_ERROR'
  | 'PERMISSION_DENIED'
  | 'UNKNOWN_ERROR';

export interface EnrollmentValidationResult {
  isValid: boolean;
  errorCode?: EnrollmentErrorCode;
  message?: string;
}

export const ERROR_MESSAGES: Record<EnrollmentErrorCode, string> = {
  TASK_INACTIVE: 'This task is currently inactive or paused.',
  TASK_EXPIRED: 'This task has expired and is no longer accepting enrollments.',
  TASK_FULL: 'This task has reached its maximum slot capacity.',
  ALREADY_ENROLLED: 'You are already enrolled in this task.',
  NETWORK_ERROR: 'Network error occurred. Please check your connection and try again.',
  PERMISSION_DENIED: 'Permission denied. Please sign in to enroll.',
  UNKNOWN_ERROR: 'An unexpected error occurred during enrollment. Please try again.',
};

export function validateTaskForEnrollment(task: TaskDocument): EnrollmentValidationResult {
  if (!task) {
    return {
      isValid: false,
      errorCode: 'TASK_INACTIVE',
      message: ERROR_MESSAGES.TASK_INACTIVE,
    };
  }

  // Check Status
  if (task.status !== 'active') {
    return {
      isValid: false,
      errorCode: 'TASK_INACTIVE',
      message: ERROR_MESSAGES.TASK_INACTIVE,
    };
  }

  // Check Expiry
  if (task.expiresAt) {
    const expiryTime = new Date(task.expiresAt).getTime();
    if (!isNaN(expiryTime) && expiryTime <= Date.now()) {
      return {
        isValid: false,
        errorCode: 'TASK_EXPIRED',
        message: ERROR_MESSAGES.TASK_EXPIRED,
      };
    }
  }

  // Check Slots
  const totalSlots = task.totalSlots ?? task.maxSubmissions ?? 1;
  const enrolledCount = task.enrolledCount ?? task.currentSubmissions ?? 0;

  if (enrolledCount >= totalSlots) {
    return {
      isValid: false,
      errorCode: 'TASK_FULL',
      message: ERROR_MESSAGES.TASK_FULL,
    };
  }

  return { isValid: true };
}
