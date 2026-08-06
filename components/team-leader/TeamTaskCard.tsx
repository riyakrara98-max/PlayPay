'use client';

import React, { useState } from 'react';
import { EnrollmentDocument, UserDocument } from '@/types/firestore';
import { formatDate } from '@/utils/formatters';
import { User, Mail, Calendar, Award, Eye, MessageSquare, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScreenshotLightbox } from './ScreenshotLightbox';

interface TeamTaskCardProps {
  submission: EnrollmentDocument;
  memberInfo?: UserDocument;
}

export function TeamTaskCard({ submission, memberInfo }: TeamTaskCardProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Derive member details (fallback to submission fields if user doc not provided)
  const memberName = memberInfo?.displayName || submission.userName || 'Unnamed Member';
  const memberEmail = memberInfo?.email || submission.userEmail || 'No email';
  const memberPhoto = memberInfo?.photoURL || submission.userAvatar;

  const taskTitle = submission.taskTitle || submission.appName || 'App Task';
  const packageName = submission.packageName || 'N/A';
  const rewardAmount = submission.lockedReward ?? submission.reward ?? submission.rewardAmount ?? 0;

  const screenshot = submission.screenshotUrl || submission.proofUrl;
  const commentText =
    submission.assignedComment ||
    submission.userComment ||
    submission.proofNotes ||
    submission.rejectionReason;

  // Status Badge Logic
  const renderStatusBadge = () => {
    if (submission.paymentStatus === 'paid') {
      return <Badge variant="success">Paid</Badge>;
    }
    if (submission.status === 'approved') {
      return <Badge variant="success">Approved</Badge>;
    }
    if (submission.status === 'rejected') {
      return <Badge variant="danger">Rejected</Badge>;
    }
    if (submission.submittedAt || submission.screenshotUrl || submission.proofUrl) {
      return <Badge variant="warning">Submitted</Badge>;
    }
    return <Badge variant="secondary">In Progress</Badge>;
  };

  const displayTime = submission.submittedAt
    ? formatDate(submission.submittedAt)
    : formatDate(submission.enrolledAt);

  return (
    <>
      <Card className="p-5 bg-[var(--bg-card,#1e293b)] border-[var(--border-color,rgba(255,255,255,0.1))] flex flex-col justify-between hover:border-emerald-500/30 transition-all space-y-4">
        {/* Header: Member Info & Status Badge */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 overflow-hidden text-slate-300">
              {memberPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={memberPhoto} alt={memberName} className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm text-slate-100 truncate">{memberName}</h3>
              <p className="text-xs text-slate-400 truncate flex items-center gap-1">
                <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                <span className="truncate">{memberEmail}</span>
              </p>
            </div>
          </div>
          <div className="shrink-0">{renderStatusBadge()}</div>
        </div>

        {/* Task & Package Info */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <h4 className="font-bold text-sm text-slate-200 truncate">{taskTitle}</h4>
            <span className="font-bold text-xs text-emerald-400 shrink-0">₹{rewardAmount}</span>
          </div>

          <p className="text-xs text-slate-400 flex items-center gap-1.5 font-mono">
            <Package className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="truncate">{packageName}</span>
          </p>
        </div>

        {/* Screenshot Thumbnail Preview (If available) */}
        {screenshot && (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setLightboxOpen(true)}
              className="w-full group relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950/60 p-1 flex items-center gap-3 hover:border-emerald-500/50 transition-all text-left"
            >
              <div className="w-12 h-12 rounded-lg bg-slate-900 overflow-hidden shrink-0 relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={screenshot}
                  alt="Proof Screenshot"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold text-slate-300 block group-hover:text-emerald-400 transition-colors">
                  Proof Screenshot
                </span>
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Eye className="w-3 h-3" /> Click to view lightbox
                </span>
              </div>
            </button>
          </div>
        )}

        {/* Comment / Review Note (Read-only) */}
        {commentText && (
          <div className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2">
            <MessageSquare className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <p className="italic text-slate-300 line-clamp-2">{commentText}</p>
          </div>
        )}

        {/* Footer Meta */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-500" />
            {submission.submittedAt ? 'Submitted:' : 'Enrolled:'}
          </span>
          <span className="font-mono text-slate-300">{displayTime}</span>
        </div>
      </Card>

      {/* Read-Only Screenshot Lightbox Modal */}
      {screenshot && (
        <ScreenshotLightbox
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          imageUrl={screenshot}
          taskTitle={taskTitle}
          memberName={memberName}
        />
      )}
    </>
  );
}
