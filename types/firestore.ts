export type UserRole = 'user' | 'admin';
export type MemberType = 'pending' | 'direct' | 'team_member' | 'team_leader' | 'admin';

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
  memberType?: MemberType;
  leaderId?: string;
  rewardResolvedAt?: string;
  leaderCode?: string;
  profileCompleted?: boolean;
  createdAt: string;
  _resolvedLeaderRewardAmount?: number | null;
  _resolvedAssignmentId?: string;
  _resolvedBaseReward?: number;
  lastLoginAt: string;
  isActive: boolean;
  isBanned: boolean;
  banReason?: string | null;
  bannedBy?: string | null;
  bannedAt?: string | null;
  unbannedBy?: string | null;
  unbannedAt?: string | null;
  totalTasksCompleted?: number;
  totalEarned?: number;
  approvedTasksCount?: number;
  rejectedTasksCount?: number;
  weeklyStreak?: number;
  lastTaskCompletedAt?: string | null;
  effectiveReward?: number | null;
  isLeaderActive?: boolean;
  teamMemberCount?: number;
  teamLeaderCode?: string;
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
export type ReenrollmentPolicy = 'cooldown' | 'none';
export type TaskAssignmentType = 'all' | 'leaders';
export type AssignmentStatus = 'active' | 'paused' | 'removed';

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
  appIconUrl?: string;
  packageName?: string;
  playStoreUrl?: string;
  appUrl?: string;
  hint?: string;
  totalSlots?: number;
  enrolledCount?: number;
  isVerified?: boolean;
  expiresAt?: string;
  commentMode?: CommentMode;
  comments?: string[];
  reenrollmentPolicy?: ReenrollmentPolicy;
  cooldownDays?: number;
  assignmentType?: TaskAssignmentType;
  assignedLeaderIds?: string[];
  baseReward?: number | null;
  createdBy: string;
  createdAt: string;
  _resolvedLeaderRewardAmount?: number | null;
  _resolvedAssignmentId?: string;
  _resolvedBaseReward?: number;
  updatedAt: string;
}

export interface LeaderTaskAssignmentDocument {
  id: string; // {taskId}_{leaderId}
  taskId: string;
  leaderId: string;
  leaderReward: number | null;
  assignmentStatus?: AssignmentStatus;
  status?: 'active' | 'inactive';
  assignedAt: string;
  assignedBy: string;
  updatedAt: string;
  removedAt?: string | null;
  removedBy?: string | null;
  rewardConfiguredAt?: string | null;
  rewardConfiguredBy?: string | null;
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
  packageName?: string;
  taskTitle?: string;
  category?: TaskCategory;
  reward?: number;
  rewardAmount?: number;
  leaderRewardAmount?: number | null;
  baseReward?: number;
  assignmentId?: string;
  leaderId?: string;
  rewardResolvedAt?: string;
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
  // Homepage Hero CMS configuration
  heroEnabled?: boolean;
  heroTitle?: string;
  heroSubtitle?: string;
  heroCtaText?: string;
  heroCtaLink?: string;
  heroBadgeText?: string;
  heroBgType?: 'gradient' | 'image';
  heroBgImageUrl?: string;
  heroStartDate?: string;
  heroEndDate?: string;
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
  | 'User Profile Updated'
  | 'Task Created'
  | 'Task Updated'
  | 'Task Deleted'
  | 'Settings Updated'
  | 'Team Leader Saved'
  | 'Member Reward Updated'
  | 'Member Assigned'
  | 'Member Unassigned'
  | 'Team Leader Status Updated'
  | 'Team Leader Enabled'
  | 'Team Leader Disabled'
  | 'Member Reward Configured'
  | 'Bulk Member Rewards Updated'
  | 'Bulk Users Activated'
  | 'Bulk Users Deactivated'
  | 'Bulk Assigned Leader'
  | 'Bulk Unassigned Leader';

export interface LeaderCodeDocument {
  leaderId: string;
  leaderCode: string;
  memberType?: string;
  isLeaderActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

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
  _resolvedLeaderRewardAmount?: number | null;
  _resolvedAssignmentId?: string;
  _resolvedBaseReward?: number;
  timestamp?: string;
  ipAddress?: string;
  userAgent?: string;
}

export const FIRESTORE_COLLECTIONS = {
  USERS: 'users',
  LEADER_CODES: 'leaderCodes',
  TASKS: 'tasks',
  ENROLLMENTS: 'enrollments',
  SITE_SETTINGS: 'siteSettings',
  ADMIN_ACTIVITY: 'adminActivity',
  LEADER_TASK_ASSIGNMENTS: 'leaderTaskAssignments',
} as const;

export type FirestoreCollectionName =
  (typeof FIRESTORE_COLLECTIONS)[keyof typeof FIRESTORE_COLLECTIONS];
