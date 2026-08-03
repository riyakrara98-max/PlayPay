export type UserRole = 'user' | 'admin';

export interface UserDocument {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber?: string | null;
  upiId?: string | null;
  bankName?: string | null;
  accountHolder?: string | null;
  accountNumber?: string | null;
  ifscCode?: string | null;
  lastProfileUpdateAt?: string | null;
  role: UserRole;
  createdAt: string;
  lastLoginAt: string;
  isActive: boolean;
  isBanned: boolean;
  banReason?: string | null;
  bannedBy?: string | null;
  bannedAt?: string | null;
  unbannedBy?: string | null;
  unbannedAt?: string | null;
  totalTasksCompleted?: number;
  approvedTasksCount?: number;
  rejectedTasksCount?: number;
  weeklyStreak?: number;
  lastTaskCompletedAt?: string | null;
}

export type TaskStatus = 'active' | 'paused' | 'completed' | 'draft';
export type TaskCategory =
  | 'app_download'
  | 'survey'
  | 'video_watch'
  | 'social_follow'
  | 'referral'
  | 'other';
export type TaskProofType = 'screenshot' | 'text' | 'both';

export type CommentMode = 'fixed' | 'hint' | 'none';

export interface TaskDocument {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  rewardAmount: number;
  maxSubmissions: number;
  currentSubmissions: number;
  status: TaskStatus;
  instructions?: string;
  proofType?: TaskProofType;
  appName?: string;
  appIcon?: string;
  playStoreUrl?: string;
  appUrl?: string;
  hint?: string;
  totalSlots?: number;
  enrolledCount?: number;
  isVerified?: boolean;
  expiresAt?: string;
  commentMode?: CommentMode;
  comments?: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export type EnrollmentStatus = 'pending' | 'approved' | 'rejected';
export type PaymentStatus = 'pending' | 'requested' | 'processing' | 'paid' | 'rejected' | 'failed';

export interface CloudinaryMetadata {
  public_id: string;
  asset_id?: string;
  version?: number;
  bytes?: number;
  width?: number;
  height?: number;
  format?: string;
  resource_type?: string;
  secure_url: string;
  created_at?: string;
}

export interface EnrollmentDocument {
  id: string;
  userId: string;
  taskId: string;
  userName?: string;
  userEmail?: string;
  userAvatar?: string;
  appName?: string;
  appIcon?: string;
  taskTitle?: string;
  category?: TaskCategory;
  reward?: number;
  rewardAmount?: number;
  assignedComment?: string;
  commentIndex?: number | null;
  status: EnrollmentStatus;
  enrolledAt: string;
  submittedAt: string | null;
  reviewedAt?: string | null;
  reviewedBy?: string;
  approvedAt?: string | null;
  rejectionReason?: string;
  screenshotUrl?: string;
  userComment?: string;
  proofUrl?: string;
  proofNotes?: string;
  paymentStatus?: PaymentStatus;
  paymentRequestedAt?: string | null;
  lastWhatsAppRequestAt?: string | null;
  whatsAppRequestCount?: number;
  cloudinaryMetadata?: CloudinaryMetadata | null;
  submissionVersion?: number;
  resubmissionCount?: number;
  lastUpdatedAt?: string;
  lastUpdatedBy?: string;
  canResubmit?: boolean;
  // Locked fields on approval (Phase 3C)
  lockedReward?: number;
  lockedTaskId?: string;
  lockedAssignedComment?: string;
  lockedCommentIndex?: number | null;
  // Payment workflow fields (Phase 3C)
  processedBy?: string;
  processingStartedAt?: string | null;
  paymentProcessedAt?: string | null;
  paymentReference?: string;
}

export interface SiteSettingsDocument {
  siteName: string;
  tagline?: string;
  logo: string;
  logoMetadata?: CloudinaryMetadata | null;
  announcement?: string;
  announcementText?: string;
  announcementEnabled?: boolean;
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  paymentEligibilityDays: number;
  adminWhatsAppNumber: string;
  settingsVersion?: number;
  updatedAt: string;
  updatedBy?: string;
}

export type AuditActivityType =
  | 'Login'
  | 'Logout'
  | 'Approve'
  | 'Reject'
  | 'Payment Requested'
  | 'Payment Processing'
  | 'Payment Paid'
  | 'User Banned'
  | 'User Unbanned'
  | 'User Deactivated'
  | 'User Reactivated'
  | 'Task Created'
  | 'Task Updated'
  | 'Task Deleted'
  | 'Settings Updated';

export interface AdminActivityDocument {
  id: string;
  action: AuditActivityType;
  performedBy: string;
  performedByName?: string;
  performedByEmail?: string;
  targetType: 'user' | 'task' | 'enrollment' | 'settings' | 'auth' | 'system';
  targetId: string;
  targetName?: string;
  details?: string;
  changedFields?: Record<string, { old: unknown; new: unknown }> | Record<string, unknown> | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  createdAt: string;
  timestamp?: string;
  ipAddress?: string;
  userAgent?: string;
}

export const FIRESTORE_COLLECTIONS = {
  USERS: 'users',
  TASKS: 'tasks',
  ENROLLMENTS: 'enrollments',
  SITE_SETTINGS: 'siteSettings',
  ADMIN_ACTIVITY: 'adminActivity',
} as const;

export type FirestoreCollectionName =
  (typeof FIRESTORE_COLLECTIONS)[keyof typeof FIRESTORE_COLLECTIONS];
