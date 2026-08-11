'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import {
  User,
  Mail,
  Shield,
  Calendar,
  Phone,
  CreditCard,
  Building2,
  UserCheck,
  Hash,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Save,
  WifiOff,
  Sparkles,
  CheckSquare,
  Clock,
  XCircle,
  Flame,
} from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useProfileStats } from '@/hooks/useProfileStats';
import { useUpdateProfile } from '@/hooks/useUpdateProfile';
import { useToast } from '@/hooks/use-toast';

import { PageContainer } from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/layout/SectionHeader';
import { ContentContainer } from '@/components/layout/ContentContainer';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Spinner } from '@/components/ui/spinner';
import { AdSlot } from '@/components/ads/AdSlot';

import {
  formatPhoneNumber,
  validateStrongPassword,
  ProfileFormValues,
} from '@/lib/profile-validation';
import { EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { mapAuthError } from '@/lib/firebase-errors';
import { formatDate } from '@/utils/formatters';

export default function ProfilePage() {
  const router = useRouter();
  const { currentUser, logout, updatePassword } = useAuth();
  const { profile, loading: profileLoading, isOffline } = useProfile();
  const { stats, loading: statsLoading } = useProfileStats();
  const { updateProfile, updating, errors, generalError, clearErrors } = useUpdateProfile();
  const { toast } = useToast();
  const showToast = (message: string, variant: 'info' | 'success' | 'warning' | 'error' = 'info') =>
    toast({ message, variant });

  const [, startTransition] = useTransition();

  // Form state
  const [formValues, setFormValues] = useState<ProfileFormValues>({
    phoneNumber: '',
    upiId: '',
    bankName: '',
    accountHolder: '',
    accountNumber: '',
    ifscCode: '',
  });

  // Optimistic profile override
  const [optimisticProfile, setOptimisticProfile] = useState<Partial<ProfileFormValues> | null>(null);

  // Sync form values with profile snapshot
  useEffect(() => {
    if (profile) {
      queueMicrotask(() => {
        setFormValues({
          phoneNumber: profile.phoneNumber || '',
          upiId: profile.upiId || '',
          bankName: profile.bankName || '',
          accountHolder: profile.accountHolder || '',
          accountNumber: profile.accountNumber || '',
          ifscCode: profile.ifscCode || '',
        });
        setOptimisticProfile(null);
      });
    }
  }, [profile]);

  // Password section collapse & state
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passUpdating, setPassUpdating] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);

  // Logout modal state
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Success message toast timer
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Compute initials for Avatar
  const displayName = profile?.displayName || currentUser?.displayName || currentUser?.email || 'User';
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };
  const initials = getInitials(displayName);

  // Handle Form Change with real-time formatting
  const handleInputChange = (field: keyof ProfileFormValues, value: string) => {
    clearErrors();
    setSaveSuccess(false);

    let processedValue = value;
    if (field === 'phoneNumber') {
      processedValue = formatPhoneNumber(value);
    } else if (field === 'ifscCode') {
      processedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11);
    }

    setFormValues((prev) => ({
      ...prev,
      [field]: processedValue,
    }));
  };

  // Profile Save Submission
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (updating || isOffline) return;

    const success = await updateProfile(formValues, (optimisticData) => {
      setOptimisticProfile(optimisticData as Partial<ProfileFormValues>);
    });

    if (success) {
      setSaveSuccess(true);
      showToast('Profile updated successfully!', 'success');
      setTimeout(() => setSaveSuccess(false), 4000);
    } else {
      showToast('Failed to save profile. Please check validation errors.', 'error');
    }
  };

  // Password Update Handler
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError(null);

    if (!currentPassword) {
      setPassError('Please enter your current password.');
      return;
    }

    const passValidation = validateStrongPassword(newPassword);
    if (!passValidation.isValid) {
      setPassError(passValidation.message || 'Password requirements not met.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassError('New password and confirm password do not match.');
      return;
    }

    setPassUpdating(true);

    try {
      if (currentUser && currentUser.email) {
        // Re-authenticate user to satisfy Firebase security requirement
        const cred = EmailAuthProvider.credential(currentUser.email, currentPassword);
        await reauthenticateWithCredential(currentUser, cred);
      }

      await updatePassword(newPassword);

      showToast('Password changed successfully!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsPasswordOpen(false);
    } catch (err: unknown) {
      console.error('[Password Update Error]', err);
      const mapped = mapAuthError(err);
      setPassError(mapped);
      showToast(mapped, 'error');
    } finally {
      setPassUpdating(false);
    }
  };

  // Logout Handler
  const handleConfirmLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      showToast('Successfully logged out.', 'info');
      startTransition(() => {
        router.push('/login');
      });
    } catch (err) {
      console.error('[Logout Error]', err);
      showToast('Failed to log out. Please try again.', 'error');
      setIsLoggingOut(false);
      setIsLogoutModalOpen(false);
    }
  };

  // Display value solver (supports optimistic UI)
  const displayVal = (field: keyof ProfileFormValues) => {
    if (optimisticProfile && optimisticProfile[field] !== undefined) {
      return optimisticProfile[field] || '';
    }
    return formValues[field];
  };

  const formattedDate = profile?.createdAt
    ? formatDate(profile.createdAt)
    : 'N/A';

  if (profileLoading && !profile) {
    return (
      <PageContainer size="lg">
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <Spinner size="lg" />
          <p className="text-xs text-[var(--text-secondary)] font-medium">Loading profile details...</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer size="lg" className="pb-16">
      {/* Offline Alert Banner */}
      <AnimatePresence>
        {isOffline && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-[var(--radius-lg)] flex items-center gap-3 text-amber-500"
            role="status"
          >
            <WifiOff className="w-5 h-5 shrink-0" />
            <div className="flex-1 text-xs">
              <span className="font-bold">Offline Mode Active: </span>
              Profile edits are disabled until connection is restored.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <SectionHeader
        title="User Profile & Settings"
        subtitle="Manage your personal details, payment accounts, security credentials, and view lifetime task statistics."
      />

      <AdSlot placement="profile" />

      <div className="flex flex-col gap-6 mt-2">
        {/* Profile Card Header */}
        <ContentContainer variant="card" className="flex flex-col sm:flex-row items-center gap-6 p-6">
          {/* Avatar Generated from Initials */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-[var(--primary-fg)] font-bold text-2xl sm:text-3xl flex items-center justify-center shadow-lg border-2 border-[var(--border)] select-none">
              {initials}
            </div>
            <span
              className={`absolute bottom-0 right-0 w-5 h-5 rounded-full border-2 border-[var(--surface)] ${
                profile?.isActive ? 'bg-emerald-500' : 'bg-red-500'
              }`}
              title={profile?.isActive ? 'Account Active' : 'Account Suspended'}
            />
          </div>

          <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-1 flex-1">
            <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
              <h2 className="text-xl sm:text-2xl font-bold font-heading text-[var(--text-primary)]">
                {profile?.displayName || 'PlayPay User'}
              </h2>
              <Badge variant={profile?.role === 'admin' ? 'accent' : 'primary'} size="sm">
                {profile?.role === 'admin' ? 'System Administrator' : 'User Member'}
              </Badge>
            </div>
            <span className="text-xs text-[var(--text-secondary)] font-mono">
              {currentUser?.email || 'No email associated'}
            </span>

            <div className="flex items-center gap-4 text-xs text-[var(--text-muted)] mt-3 pt-2 border-t border-[var(--border)] w-full justify-center sm:justify-start">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Joined {formattedDate}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-500 font-medium">Verified Account</span>
              </div>
            </div>
          </div>
        </ContentContainer>

        {/* Realtime Profile Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <ContentContainer variant="card" className="p-4 flex flex-col justify-between gap-2">
            <div className="flex items-center justify-between text-[var(--text-muted)]">
              <span className="text-xs font-semibold">Total Completed</span>
              <CheckSquare className="w-4 h-4 text-[var(--primary)]" />
            </div>
            <div className="text-2xl font-bold font-heading text-[var(--text-primary)]">
              {statsLoading ? '...' : stats.tasksCompleted}
            </div>
            <p className="text-[10px] text-[var(--text-secondary)]">Tasks submitted or finished</p>
          </ContentContainer>

          <ContentContainer variant="card" className="p-4 flex flex-col justify-between gap-2">
            <div className="flex items-center justify-between text-[var(--text-muted)]">
              <span className="text-xs font-semibold">Approved Tasks</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold font-heading text-emerald-500">
              {statsLoading ? '...' : stats.approvedTasks}
            </div>
            <p className="text-[10px] text-[var(--text-secondary)]">Verified reward earners</p>
          </ContentContainer>

          <ContentContainer variant="card" className="p-4 flex flex-col justify-between gap-2">
            <div className="flex items-center justify-between text-[var(--text-muted)]">
              <span className="text-xs font-semibold font-mono">Rejected Tasks</span>
              <XCircle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-bold font-heading text-rose-500">
              {statsLoading ? '...' : stats.rejectedTasks}
            </div>
            <p className="text-[10px] text-[var(--text-secondary)]">Submission issues</p>
          </ContentContainer>

          <ContentContainer variant="card" className="p-4 flex flex-col justify-between gap-2">
            <div className="flex items-center justify-between text-[var(--text-muted)]">
              <span className="text-xs font-semibold">Weekly Streak</span>
              <Flame className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold font-heading text-amber-500 flex items-center gap-1">
              {statsLoading ? '...' : `${stats.weeklyStreak} Days`}
            </div>
            <p className="text-[10px] text-[var(--text-secondary)]">Active in last 7 days</p>
          </ContentContainer>
        </div>

        {/* Read-Only Account Identity Info */}
        <ContentContainer variant="card" className="flex flex-col gap-4 p-5">
          <div className="flex items-center gap-2 pb-2 border-b border-[var(--border)]">
            <User className="w-4 h-4 text-[var(--primary)]" />
            <h3 className="text-sm font-bold font-heading text-[var(--text-primary)]">
              Account Info
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={profile?.displayName || 'PlayPay User'}
              readOnly
              disabled
              leftIcon={<User className="w-4 h-4" />}
            />

            <Input
              label="Email Address"
              value={currentUser?.email || ''}
              readOnly
              disabled
              leftIcon={<Mail className="w-4 h-4" />}
            />

            

          
          </div>
        </ContentContainer>

        {/* Editable Profile & Payment Details Form */}
        <ContentContainer variant="card" className="flex flex-col gap-5 p-5">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[var(--primary)]" />
              <h3 className="text-sm font-bold font-heading text-[var(--text-primary)]">
                Editable Payment & Contact Details
              </h3>
            </div>
            {profile?.lastProfileUpdateAt && (
              <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Updated {formatDate(profile.lastProfileUpdateAt)}
              </span>
            )}
          </div>

          {generalError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-[var(--radius-md)] text-xs text-red-500 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{generalError}</span>
            </div>
          )}

          {saveSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-[var(--radius-md)] text-xs text-emerald-500 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Profile and payout details updated successfully!</span>
            </motion.div>
          )}

          <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Phone Number"
                placeholder="e.g. 9876543210"
                value={displayVal('phoneNumber')}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                error={errors.phoneNumber}
                maxLength={10}
                required
                disabled={isOffline || updating}
                leftIcon={<Phone className="w-4 h-4" />}
                helperText="10-digit mobile number for contact & verification"
              />

              <Input
                label="UPI ID"
                placeholder="e.g. 9876543210@paytm"
                value={displayVal('upiId')}
                onChange={(e) => handleInputChange('upiId', e.target.value)}
                error={errors.upiId}
                maxLength={100}
                required
                disabled={isOffline || updating}
                leftIcon={<CreditCard className="w-4 h-4" />}
                helperText="Primary UPI for instant payout transfers"
              />

              <Input
                label="Bank Name"
                placeholder="e.g. State Bank of India"
                value={displayVal('bankName')}
                onChange={(e) => handleInputChange('bankName', e.target.value)}
                error={errors.bankName}
                maxLength={100}
                required
                disabled={isOffline || updating}
                leftIcon={<Building2 className="w-4 h-4" />}
              />

              <Input
                label="Account Holder Name"
                placeholder="Name as per bank passbook"
                value={displayVal('accountHolder')}
                onChange={(e) => handleInputChange('accountHolder', e.target.value)}
                error={errors.accountHolder}
                maxLength={100}
                required
                disabled={isOffline || updating}
                leftIcon={<UserCheck className="w-4 h-4" />}
              />

              <Input
                label="Account Number"
                placeholder="9 to 18 digit account number"
                value={displayVal('accountNumber')}
                onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                error={errors.accountNumber}
                maxLength={18}
                required
                disabled={isOffline || updating}
                leftIcon={<Hash className="w-4 h-4" />}
              />

              <Input
                label="IFSC Code"
                placeholder="e.g. SBIN0001234"
                value={displayVal('ifscCode')}
                onChange={(e) => handleInputChange('ifscCode', e.target.value)}
                error={errors.ifscCode}
                maxLength={11}
                required
                disabled={isOffline || updating}
                leftIcon={<Building2 className="w-4 h-4" />}
              />
            </div>

            <div className="flex items-center justify-end mt-2 pt-3 border-t border-[var(--border)]">
              <Button
                type="submit"
                variant="primary"
                isLoading={updating}
                disabled={isOffline || updating}
                leftIcon={<Save className="w-4 h-4" />}
                size="md"
              >
                Save Profile Changes
              </Button>
            </div>
          </form>
        </ContentContainer>

        {/* Collapsible Security & Password Change */}
        <ContentContainer variant="card" className="flex flex-col p-5">
          <button
            type="button"
            onClick={() => setIsPasswordOpen(!isPasswordOpen)}
            className="flex items-center justify-between w-full text-left font-bold font-heading text-sm text-[var(--text-primary)] hover:text-[var(--primary)] transition-colors focus:outline-none"
            aria-expanded={isPasswordOpen}
          >
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[var(--primary)]" />
              <span>Security & Password Management</span>
            </div>
            {isPasswordOpen ? <ChevronUp className="w-5 h-5 text-[var(--text-muted)]" /> : <ChevronDown className="w-5 h-5 text-[var(--text-muted)]" />}
          </button>

          <AnimatePresence>
            {isPasswordOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden pt-4 mt-3 border-t border-[var(--border)]"
              >
                <form onSubmit={handlePasswordUpdate} className="flex flex-col gap-4">
                  {passError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-[var(--radius-md)] text-xs text-red-500 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{passError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Input
                      label="Current Password"
                      type={showCurrentPass ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      leftIcon={<Lock className="w-4 h-4" />}
                      rightIcon={
                        <button
                          type="button"
                          onClick={() => setShowCurrentPass(!showCurrentPass)}
                          className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        >
                          {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      }
                    />

                    <Input
                      label="New Password"
                      type={showNewPass ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      leftIcon={<KeyRound className="w-4 h-4" />}
                      rightIcon={
                        <button
                          type="button"
                          onClick={() => setShowNewPass(!showNewPass)}
                          className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                        >
                          {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      }
                      helperText="Min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 symbol"
                    />

                    <Input
                      label="Confirm New Password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      leftIcon={<KeyRound className="w-4 h-4" />}
                    />
                  </div>

                  <div className="flex items-center justify-end mt-2">
                    <Button
                      type="submit"
                      variant="outline"
                      isLoading={passUpdating}
                      disabled={passUpdating || isOffline}
                      leftIcon={<Shield className="w-4 h-4" />}
                    >
                      Update Password
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </ContentContainer>

        {/* Account Settings & Logout */}
        <ContentContainer variant="card" className="flex flex-col p-5 gap-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[var(--border)]">
            <Sparkles className="w-4 h-4 text-rose-500" />
            <h3 className="text-sm font-bold font-heading text-[var(--text-primary)]">
              Account Session Management
            </h3>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-[var(--text-primary)]">Log Out of PlayPay</p>
              <p className="text-[11px] text-[var(--text-secondary)]">
                Securely close your active session on this device.
              </p>
            </div>

            <Button
              variant="danger"
              size="sm"
              onClick={() => setIsLogoutModalOpen(true)}
              leftIcon={<LogOut className="w-4 h-4" />}
            >
              Sign Out
            </Button>
          </div>
        </ContentContainer>
      </div>

      {/* Logout Confirmation Modal */}
      <Modal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        title="Confirm Account Logout"
        description="Are you sure you want to sign out of your PlayPay account? Any unsaved changes will be lost."
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsLogoutModalOpen(false)}
              disabled={isLoggingOut}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={isLoggingOut}
              onClick={handleConfirmLogout}
              leftIcon={<LogOut className="w-4 h-4" />}
            >
              Confirm Logout
            </Button>
          </div>
        }
      >
        <div className="py-2 flex items-center gap-3 text-xs text-[var(--text-secondary)]">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          <span>Your session credentials will be cleaned up safely.</span>
        </div>
      </Modal>
    </PageContainer>
  );
}
