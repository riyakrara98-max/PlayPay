'use client';

import React from 'react';
import { UserDocument } from '@/types/firestore';
import { formatDate } from '@/utils/formatters';
import { ShieldCheck, User, Mail, Calendar, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface TeamMemberCardProps {
  member: UserDocument;
}

export function TeamMemberCard({ member }: TeamMemberCardProps) {
  const rewardText =
    member.effectiveReward !== undefined && member.effectiveReward !== null
      ? `₹${member.effectiveReward}`
      : 'Task Default';

  const memberTypeBadge = () => {
    switch (member.memberType) {
      case 'team_member':
        return <Badge variant="success">Team Member</Badge>;
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'direct':
        return <Badge variant="accent">Direct</Badge>;
      default:
        return <Badge variant="outline">{member.memberType || 'Member'}</Badge>;
    }
  };

  const statusBadge = () => {
    if (member.isBanned) {
      return <Badge variant="danger">Banned</Badge>;
    }
    if (member.isActive) {
      return <Badge variant="success">Active</Badge>;
    }
    return <Badge variant="secondary">Inactive</Badge>;
  };

  return (
    <Card className="p-5 bg-[var(--bg-card,#1e293b)] border-[var(--border-color,rgba(255,255,255,0.1))] flex flex-col justify-between hover:border-emerald-500/30 transition-all">
      <div className="space-y-4">
        {/* Header with Photo & Badges */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 overflow-hidden text-slate-300">
              {member.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={member.photoURL}
                  alt={member.displayName || 'Member'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm text-slate-100 truncate">
                {member.displayName || 'Unnamed Member'}
              </h3>
              <p className="text-xs text-slate-400 truncate flex items-center gap-1 mt-0.5">
                <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                <span className="truncate">{member.email || 'No email'}</span>
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            {statusBadge()}
            {memberTypeBadge()}
          </div>
        </div>

        {/* Member Meta Details */}
        <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800">
          <div className="bg-slate-950/40 p-2.5 rounded-xl border border-white/5 space-y-1">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-500" /> Joined Date
            </span>
            <p className="font-semibold text-slate-200 text-xs">
              {formatDate(member.createdAt)}
            </p>
          </div>

          <div className="bg-slate-950/40 p-2.5 rounded-xl border border-white/5 space-y-1">
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Award className="w-3 h-3 text-emerald-400" /> Current Reward
            </span>
            <p className="font-bold text-emerald-400 text-xs">{rewardText}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
