'use client';

import React from 'react';
import { Modal } from '@/components/ui/modal';
import { ExternalLink, Image as ImageIcon } from 'lucide-react';

interface ScreenshotLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl?: string | null;
  taskTitle?: string;
  memberName?: string;
}

export function ScreenshotLightbox({
  isOpen,
  onClose,
  imageUrl,
  taskTitle = 'Submission Proof',
  memberName = 'Member',
}: ScreenshotLightboxProps) {
  if (!imageUrl) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title={
        <div className="flex items-center gap-2 text-slate-100">
          <ImageIcon className="w-5 h-5 text-emerald-400" />
          <span className="font-bold text-sm sm:text-base">
            {taskTitle} — {memberName}
          </span>
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-xs text-slate-400">Read-Only Lightbox Preview</span>
          <a
            href={imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-medium transition-colors"
          >
            <span>Open Original</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      }
    >
      <div className="flex items-center justify-center p-2 bg-slate-950/80 rounded-xl border border-slate-800 max-h-[70vh] overflow-auto">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={`Proof by ${memberName}`}
          className="max-w-full max-h-[65vh] object-contain rounded-lg"
        />
      </div>
    </Modal>
  );
}
