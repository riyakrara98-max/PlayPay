import React, { useState } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getFirebaseDb } from '@/firebase/config';
import { FIRESTORE_COLLECTIONS } from '@/types/firestore';
import { useAuth } from '@/hooks/useAuth';
import { AssignedTask } from '@/hooks/useTeamLeaderAssignedTasks';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Coins, AlertCircle, Loader2 } from 'lucide-react';

interface RewardConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignedTask: AssignedTask | null;
}

export function RewardConfigurationModal({ isOpen, onClose, assignedTask }: RewardConfigurationModalProps) {
  const { currentUser } = useAuth();
  const [rewardAmount, setRewardAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens
  React.useEffect(() => {
    if (isOpen && assignedTask) {
      setRewardAmount(assignedTask.assignment.leaderReward !== null ? String(assignedTask.assignment.leaderReward) : '');
      setError(null);
    }
  }, [isOpen, assignedTask]);

  if (!assignedTask || !currentUser) return null;

  const { task, assignment } = assignedTask;
  const baseReward = task.baseReward || 0;

  const handleSave = async () => {
    setError(null);
    const amount = Number(rewardAmount);

    if (!rewardAmount || isNaN(amount)) {
      setError('Please enter a valid number.');
      return;
    }

    if (amount <= 0) {
      setError('Reward must be greater than 0.');
      return;
    }

    if (amount > baseReward) {
      setError(`Reward cannot exceed the base reward of ₹${baseReward}.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const db = getFirebaseDb();
      const assignmentRef = doc(db, FIRESTORE_COLLECTIONS.LEADER_TASK_ASSIGNMENTS, assignment.id);
      
      await updateDoc(assignmentRef, {
        leaderReward: amount,
        rewardConfiguredAt: serverTimestamp(),
        rewardConfiguredBy: currentUser.uid,
        updatedAt: serverTimestamp(),
      });

      onClose();
    } catch (err: unknown) {
      console.error('[Reward Config Error]', err);
      setError(err instanceof Error ? err.message : 'Failed to configure reward.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const footer = (
    <div className="flex justify-end gap-3 w-full">
      <Button
        variant="ghost"
        onClick={onClose}
        disabled={isSubmitting}
      >
        Cancel
      </Button>
      <Button
        variant="primary"
        onClick={handleSave}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          'Save Reward'
        )}
      </Button>
    </div>
  );

  const title = (
    <div className="flex items-center gap-2">
      <Coins className="w-5 h-5 text-amber-400" />
      Configure Reward
    </div>
  );
  
  const description = (
    <>Set the reward amount your team members will receive for completing <strong>{task.title}</strong>.</>
  );

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={title}
      description={description}
      footer={footer}
      size="md"
    >
      <div className="space-y-4 py-2">
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 flex justify-between items-center">
          <span className="text-sm font-medium text-slate-300">Admin Base Reward</span>
          <span className="text-lg font-bold text-emerald-400">₹{baseReward}</span>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-200">Your Custom Reward (₹)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
            <Input
              type="number"
              min="1"
              max={baseReward}
              value={rewardAmount}
              onChange={(e) => setRewardAmount(e.target.value)}
              placeholder={`e.g. ${Math.floor(baseReward * 0.8)}`}
              className="pl-8 bg-slate-950 border-slate-800 focus:ring-amber-500"
              disabled={isSubmitting}
            />
          </div>
          <p className="text-xs text-slate-400">
            This amount is confidential. Other Team Leaders cannot see your reward.
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
