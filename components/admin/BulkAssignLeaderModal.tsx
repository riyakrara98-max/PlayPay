'use client';

import React, { useState } from 'react';
import { UserCheck, ShieldAlert, Loader2, Award, UserPlus } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { UserDocument } from '@/types/firestore';
import { doc, updateDoc, writeBatch } from 'firebase/firestore';
import { getFirebaseDb } from '@/firebase/config';
import { FIRESTORE_COLLECTIONS } from '@/types/firestore';
import { useToast } from '@/hooks/use-toast';
import { logAdminActivity } from '@/lib/audit-logger';

interface BulkAssignLeaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedUserIds: string[];
  users: UserDocument[];
  adminUid?: string;
  adminName?: string;
  adminEmail?: string;
  onSuccess?: () => void;
}

export function BulkAssignLeaderModal({
  isOpen,
  onClose,
  selectedUserIds,
  users,
  adminUid,
  adminName,
  adminEmail,
  onSuccess,
}: BulkAssignLeaderModalProps) {
  const { toast } = useToast();
  const [selectedLeaderId, setSelectedLeaderId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter team leaders from users
  const teamLeaders = users.filter((u) => u.memberType === 'team_leader' && u.isActive);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUserIds.length === 0) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const db = getFirebaseDb();
      const targetLeader = teamLeaders.find((tl) => tl.uid === selectedLeaderId);

      const batch = writeBatch(db);

      for (const uid of selectedUserIds) {
        const userRef = doc(db, FIRESTORE_COLLECTIONS.USERS, uid);
        if (selectedLeaderId === 'none') {
          // Remove leader assignment
          batch.update(userRef, {
            leaderId: null,
            teamLeaderCode: null,
            memberType: 'direct',
          });
        } else if (targetLeader) {
          batch.update(userRef, {
            leaderId: targetLeader.uid,
            teamLeaderCode: targetLeader.leaderCode || null,
            memberType: 'team_member',
          });
        }
      }

      await batch.commit();

      if (adminUid) {
        await logAdminActivity({
          action: selectedLeaderId === 'none' ? 'Bulk Unassigned Leader' : 'Bulk Assigned Leader',
          performedBy: adminUid,
          performedByName: adminName,
          performedByEmail: adminEmail,
          targetType: 'user',
          targetId: 'bulk',
          targetName: `${selectedUserIds.length} user(s)`,
          details: selectedLeaderId === 'none'
            ? `Removed leader assignment from ${selectedUserIds.length} users`
            : `Assigned Team Leader ${targetLeader?.displayName || targetLeader?.email} (${targetLeader?.leaderCode}) to ${selectedUserIds.length} users`,
          before: {},
          after: { selectedLeaderId, count: selectedUserIds.length },
        });
      }

      toast({
        variant: 'success',
        title: 'Leader Assignment Updated',
        message: selectedLeaderId === 'none'
          ? `Removed leader from ${selectedUserIds.length} member(s).`
          : `Assigned ${selectedUserIds.length} member(s) to ${targetLeader?.displayName || 'Team Leader'}.`,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('[BulkAssignLeaderModal Error]', err);
      const msg = err instanceof Error ? err.message : 'Failed to assign team leader.';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Assign Team Leader"
      description={`Select a Team Leader for ${selectedUserIds.length} selected user(s).`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
          <Award className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Team Structure Hierarchy</p>
            <p className="text-[11px] opacity-90 mt-0.5">
              Assigning a team leader links members under that leader&apos;s code for earnings tracking and review management.
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[var(--text-primary)] block">
            Select Team Leader
          </label>
          <Select
            value={selectedLeaderId}
            onChange={(val) => setSelectedLeaderId(val)}
            className="w-full text-xs"
            options={[
              { value: '', label: '-- Select a Team Leader --' },
              { value: 'none', label: '❌ Remove Assigned Leader (Set to Direct Member)' },
              ...teamLeaders.map((tl) => ({
                value: tl.uid,
                label: `👑 ${tl.displayName || tl.email || tl.uid} (Code: ${tl.leaderCode || 'N/A'})`,
              })),
            ]}
          />
        </div>

        {errorMsg && (
          <p className="text-xs text-rose-500 font-medium bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-lg border border-rose-200 dark:border-rose-800">
            {errorMsg}
          </p>
        )}

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={!selectedLeaderId || isSubmitting}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Updating...
              </>
            ) : (
              <>
                <UserCheck className="w-3.5 h-3.5 mr-1.5" /> Apply Leader Assignment
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
