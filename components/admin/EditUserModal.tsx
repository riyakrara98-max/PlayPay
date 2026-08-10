'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { UserDocument, FIRESTORE_COLLECTIONS, MemberType } from '@/types/firestore';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc } from 'firebase/firestore';
import { getFirebaseDb } from '@/firebase/config';
import { logAdminActivity } from '@/lib/audit-logger';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserDocument | null;
  allUsers?: UserDocument[];
  adminUid?: string;
  adminName?: string;
  adminEmail?: string;
}

export function EditUserModal({
  isOpen,
  onClose,
  user,
  allUsers = [],
  adminUid,
  adminName,
  adminEmail,
}: EditUserModalProps) {
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [memberType, setMemberType] = useState<MemberType>('direct');
  const [leaderId, setLeaderId] = useState<string>('');
  const [status, setStatus] = useState<'active' | 'deactivated' | 'banned'>('active');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setEmail(user.email || '');
      setRole(user.role || 'user');
      setMemberType(user.memberType || 'direct');
      setLeaderId(user.leaderId || '');
      setStatus(user.isBanned ? 'banned' : user.isActive ? 'active' : 'deactivated');
    }
  }, [user]);

  if (!user) return null;

  const leaders = allUsers.filter((u) => u.memberType === 'team_leader' && u.uid !== user.uid);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const db = getFirebaseDb();
      const userRef = doc(db, FIRESTORE_COLLECTIONS.USERS, user.uid);

      const isActive = status === 'active';
      const isBanned = status === 'banned';

      const updatePayload: Record<string, any> = {
        displayName: displayName.trim(),
        role,
        memberType,
        isActive,
        isBanned,
      };

      if (leaderId) {
        updatePayload.leaderId = leaderId;
      } else {
        updatePayload.leaderId = null;
      }

      if (isBanned && !user.isBanned) {
        updatePayload.banReason = 'Banned via user edit form';
        updatePayload.bannedBy = adminUid || 'admin';
      }

      await updateDoc(userRef, updatePayload);

      if (adminUid) {
        await logAdminActivity({
          action: 'User Profile Updated',
          performedBy: adminUid,
          performedByName: adminName || 'Admin',
          performedByEmail: adminEmail || '',
          targetType: 'user',
          targetId: user.uid,
          targetName: displayName || user.email || user.uid,
          details: `Updated role: ${role}, memberType: ${memberType}, status: ${status}`,
          before: { displayName: user.displayName, role: user.role, memberType: user.memberType },
          after: updatePayload,
        });
      }

      toast({ variant: 'success', message: 'User details updated successfully.' });
      onClose();
    } catch (err) {
      console.error('[EditUserModal error]', err);
      toast({ variant: 'error', message: 'Failed to update user details.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="p-5 space-y-4">
        <div>
          <h2 className="text-base font-bold text-[var(--text-primary)] font-heading">Edit User</h2>
          <p className="text-xs text-[var(--text-muted)]">Update account details, role, and team settings.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-[var(--text-secondary)] mb-1">Name</label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Full Name"
              className="h-9 text-xs"
            />
          </div>

          <div>
            <label className="block font-bold text-[var(--text-secondary)] mb-1">Email</label>
            <Input
              value={email}
              disabled
              readOnly
              className="h-9 text-xs opacity-75 bg-slate-100 dark:bg-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-[var(--text-secondary)] mb-1">System Role</label>
              <Select
                value={role}
                onChange={(val) => setRole(val as 'user' | 'admin')}
                options={[
                  { value: 'user', label: 'User' },
                  { value: 'admin', label: 'Admin' },
                ]}
                className="h-9 text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-[var(--text-secondary)] mb-1">Member Type</label>
              <Select
                value={memberType}
                onChange={(val) => setMemberType(val as any)}
                options={[
                  { value: 'direct', label: 'Direct Member' },
                  { value: 'team_leader', label: 'Team Leader' },
                  { value: 'team_member', label: 'Team Member' },
                  { value: 'pending', label: 'Pending Review' },
                ]}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-[var(--text-secondary)] mb-1">Team Leader</label>
            <Select
              value={leaderId}
              onChange={(val) => setLeaderId(val)}
              options={[
                { value: '', label: 'None (Direct Member)' },
                ...leaders.map((l) => ({
                  value: l.uid,
                  label: `${l.displayName || l.email} (${l.leaderCode || 'No Code'})`,
                })),
              ]}
              className="h-9 text-xs"
            />
          </div>

          <div>
            <label className="block font-bold text-[var(--text-secondary)] mb-1">Status</label>
            <Select
              value={status}
              onChange={(val) => setStatus(val as any)}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'deactivated', label: 'Deactivated' },
                { value: 'banned', label: 'Banned' },
              ]}
              className="h-9 text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="ghost" type="button" onClick={onClose} disabled={isSubmitting} size="sm">
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting} size="sm">
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
