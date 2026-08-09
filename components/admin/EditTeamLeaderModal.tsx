'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, Copy, Check, ShieldAlert } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UserDocument } from '@/types/firestore';
import { useToast } from '@/hooks/use-toast';

interface EditTeamLeaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserDocument | null;
  existingUsers: UserDocument[];
  onSave: (
    targetUserId: string,
    leaderCode: string,
    isLeaderActive: boolean,
    memberType?: 'team_leader' | 'direct' | 'pending' | 'team_member'
  ) => Promise<void>;
}

export function generateLeaderCode(
  existingUsers: UserDocument[],
  user?: UserDocument | null
): string {
  // Extract clean A-Z letters from displayName or email
  const rawName = (user?.displayName || user?.email?.split('@')[0] || 'LEADER').trim();
  let nameLetters = rawName.toUpperCase().replace(/[^A-Z]/g, '');

  if (nameLetters.length < 3) {
    nameLetters = (nameLetters + 'LEADER').slice(0, 5);
  } else if (nameLetters.length > 6) {
    nameLetters = nameLetters.slice(0, 5);
  }

  const existingCodes = new Set(
    existingUsers.map((u) => u.leaderCode?.toUpperCase()).filter(Boolean)
  );

  let code = '';
  let attempts = 0;
  do {
    const randomDigits = Math.floor(100 + Math.random() * 900).toString();
    code = `${nameLetters}${randomDigits}`;
    attempts++;
  } while (existingCodes.has(code) && attempts < 200);

  return code;
}

export function EditTeamLeaderModal({
  isOpen,
  onClose,
  user,
  existingUsers,
  onSave,
}: EditTeamLeaderModalProps) {
  const { toast } = useToast();
  const [leaderCode, setLeaderCode] = useState('');
  const [isLeaderActive, setIsLeaderActive] = useState(true);
  const [targetMemberType, setTargetMemberType] = useState<
    'team_leader' | 'direct' | 'pending' | 'team_member'
  >('team_leader');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const hasExistingCode = Boolean(user?.leaderCode && user.leaderCode.trim() !== '');

  useEffect(() => {
    if (user) {
      if (user.leaderCode && user.leaderCode.trim() !== '') {
        setLeaderCode(user.leaderCode.trim().toUpperCase());
      } else {
        setLeaderCode(generateLeaderCode(existingUsers, user));
      }
      setIsLeaderActive(user.isLeaderActive ?? true);
      setTargetMemberType('team_leader');
      setErrorMsg(null);
      setCopied(false);
    }
  }, [user?.uid, user?.leaderCode]);

  if (!user) return null;

  const isExistingLeader = user.memberType === 'team_leader';

  const handleAutoGenerate = () => {
    if (hasExistingCode) return;
    const newCode = generateLeaderCode(existingUsers, user);
    setLeaderCode(newCode);
    setErrorMsg(null);
  };

  const handleCopyCode = () => {
    if (!leaderCode) return;
    navigator.clipboard.writeText(leaderCode);
    setCopied(true);
    toast({ variant: 'success', message: 'Leader Code copied to clipboard!' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.toUpperCase().replace(/\s+/g, '');
    if (val.length > 20) {
      val = val.slice(0, 20);
    }
    setLeaderCode(val);
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = leaderCode.trim().toUpperCase();

    if (!trimmed) {
      setErrorMsg('Leader Code is required.');
      return;
    }

    if (!/^[A-Z0-9]{3,20}$/.test(trimmed)) {
      setErrorMsg('Enter a valid Leader Code (e.g. PRIYA369, ANSHU195).');
      return;
    }

    // Role change protection: If converting a Team Leader to another role while members exist
    if (user.memberType === 'team_leader' && targetMemberType !== 'team_leader') {
      const teamSize = existingUsers.filter((u) => u.leaderId === user.uid).length;
      if (teamSize > 0) {
        setErrorMsg(
          `This Team Leader still has ${teamSize} active member(s). Transfer or remove all team members before changing this role.`
        );
        return;
      }
    }

    // Check duplicate code across other users
    const duplicate = existingUsers.find(
      (u) => u.uid !== user.uid && u.leaderCode?.toUpperCase() === trimmed
    );
    if (duplicate) {
      setErrorMsg('Leader Code already assigned to another Team Leader.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await onSave(user.uid, trimmed, isLeaderActive, targetMemberType);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save Team Leader settings.';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            {isExistingLeader ? 'Edit Team Leader' : 'Promote to Team Leader'}
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {user.displayName || user.email || user.uid}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Leader Code Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                Leader Code {hasExistingCode && <span className="text-[var(--primary)] font-normal ml-1">(Permanent)</span>}
              </label>
              {!hasExistingCode && (
                <button
                  type="button"
                  onClick={handleAutoGenerate}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--primary)] hover:underline cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3 shrink-0" />
                  <span>Auto Generate</span>
                </button>
              )}
            </div>

            <div className="relative flex items-center">
              <Input
                type="text"
                value={leaderCode}
                onChange={handleCodeChange}
                placeholder="e.g. PRIYA369"
                maxLength={20}
                disabled={hasExistingCode}
                readOnly={hasExistingCode}
                className={`font-mono text-base font-bold uppercase tracking-wider pr-20 ${
                  hasExistingCode ? 'bg-[var(--bg-muted)] opacity-90 cursor-not-allowed select-all' : ''
                }`}
              />
              <button
                type="button"
                onClick={handleCopyCode}
                className="absolute right-2 px-2.5 py-1 text-xs font-semibold rounded-lg bg-[var(--surface)] hover:bg-[var(--border)] text-[var(--text-secondary)] transition-colors flex items-center gap-1 border border-[var(--border)]"
                title="Copy Code"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="text-[11px] text-[var(--text-secondary)]">
              {hasExistingCode
                ? 'Leader Code is permanent for this Team Leader and cannot be changed.'
                : 'Format: Memorable name code (e.g. PRIYA369, ANSHU195). Permanent once saved.'}
            </p>
          </div>

          {/* Leader Status Toggle (ON / OFF) */}
          <div className="space-y-2 p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-muted)]">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[var(--text-primary)] block">
                  Leader Status
                </span>
                <span className="text-[11px] text-[var(--text-secondary)] block mt-0.5">
                  {isLeaderActive
                    ? 'Active — New users can join using this Leader Code.'
                    : 'Disabled — New users cannot join using this Leader Code.'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsLeaderActive(!isLeaderActive)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isLeaderActive ? 'bg-[var(--primary)]' : 'bg-[var(--border)]'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isLeaderActive ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-[var(--danger)]/10 border border-[var(--danger)]/20 text-xs font-medium text-[var(--danger)] flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="ghost" type="button" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={isSubmitting || !leaderCode.trim()}
            >
              {isSubmitting ? 'Saving...' : isExistingLeader ? 'Update Leader' : 'Promote to Leader'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
