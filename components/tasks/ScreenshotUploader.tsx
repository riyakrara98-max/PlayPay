'use client';

import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UploadCloud,
  CheckCircle2,
  X,
  RefreshCw,
  FileText,
  AlertTriangle,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';
import { useUploadScreenshot } from '@/hooks/useUploadScreenshot';
import { CloudinaryMetadata } from '@/types/firestore';

interface ScreenshotUploaderProps {
  initialUrl?: string | null;
  onUploadComplete: (data: { url: string; publicId: string; metadata: CloudinaryMetadata } | null) => void;
  isDisabled?: boolean;
}

export function ScreenshotUploader({
  initialUrl,
  onUploadComplete,
  isDisabled = false,
}: ScreenshotUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    fileInfo,
    isUploading,
    progress,
    error,
    isDragOver,
    uploadScreenshot,
    cancelUpload,
    removeImage,
    setIsDragOver,
    handleFileDrop,
    handleFileSelect,
  } = useUploadScreenshot(initialUrl);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDisabled) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleRemove = () => {
    removeImage();
    onUploadComplete(null);
  };

  const triggerSelect = () => {
    if (!isDisabled && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  // Synchronize upload result when upload succeeds
  React.useEffect(() => {
    if (fileInfo?.uploadedUrl && fileInfo.metadata) {
      onUploadComplete({
        url: fileInfo.uploadedUrl,
        publicId: fileInfo.publicId || '',
        metadata: fileInfo.metadata,
      });
    }
  }, [fileInfo?.uploadedUrl, fileInfo?.metadata, fileInfo?.publicId, onUploadComplete]);

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 shadow-xs mb-6">
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-[var(--primary)]" />
          Screenshot Proof <span className="text-[var(--danger)]">*</span>
        </label>
        <span className="text-[11px] text-[var(--text-muted)] font-mono">
          Max 10MB (JPG, PNG, WEBP)
        </span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/jpg"
        onChange={handleFileSelect}
        disabled={isDisabled || isUploading}
        className="hidden"
      />

      <AnimatePresence mode="wait">
        {fileInfo ? (
          /* Preview and Uploaded State Card */
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="border border-[var(--border)] rounded-xl p-4 bg-[var(--surface-elevated)]/50 relative overflow-hidden"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Image Thumbnail */}
              <div className="relative w-24 h-24 sm:w-20 sm:h-20 rounded-lg border border-[var(--border)] bg-black/5 overflow-hidden shrink-0 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={fileInfo.previewUrl}
                  alt="Proof Screenshot Preview"
                  className="w-full h-full object-cover"
                />
                {fileInfo.uploadedUrl && (
                  <div className="absolute top-1 right-1 bg-[var(--success)] text-[var(--success-fg)] rounded-full p-0.5 shadow-2xs">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>

              {/* File Info & Upload Progress */}
              <div className="flex-1 min-w-0 w-full space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                      {fileInfo.name}
                    </p>
                    <p className="text-[11px] text-[var(--text-secondary)] font-mono">
                      {fileInfo.sizeFormatted}
                    </p>
                  </div>

                  {!isDisabled && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={triggerSelect}
                        disabled={isUploading}
                        title="Replace Image"
                        className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-[var(--surface)] transition-colors border border-[var(--border)] cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleRemove}
                        disabled={isUploading}
                        title="Remove Image"
                        className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--danger)] hover:bg-[var(--surface)] transition-colors border border-[var(--border)] cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Progress Bar or Success Badge */}
                {isUploading ? (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono text-[var(--primary)]">
                      <span className="flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" /> Uploading to Cloudinary...
                      </span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
                      <motion.div
                        className="h-full bg-[var(--primary)] rounded-full"
                        animate={{ width: `${progress}%` }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={cancelUpload}
                      className="text-[10px] text-[var(--danger)] hover:underline font-medium cursor-pointer"
                    >
                      Cancel Upload
                    </button>
                  </div>
                ) : fileInfo.uploadedUrl ? (
                  <div className="flex items-center gap-1.5 text-xs text-[var(--success)] font-semibold">
                    <CheckCircle2 className="w-4 h-4" /> Cloudinary Verified & Ready for Submission
                  </div>
                ) : null}
              </div>
            </div>
          </motion.div>
        ) : (
          /* Dropzone State */
          <motion.div
            key="dropzone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleFileDrop}
            onClick={triggerSelect}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
              isDragOver
                ? 'border-[var(--primary)] bg-[var(--primary)]/5 scale-[1.01]'
                : error
                ? 'border-[var(--danger)] bg-[var(--danger)]/5'
                : isDisabled
                ? 'border-[var(--border)] bg-[var(--surface-elevated)] cursor-not-allowed opacity-60'
                : 'border-[var(--border)] hover:border-[var(--primary)]/50 bg-[var(--surface-elevated)]/30 hover:bg-[var(--surface-elevated)]'
            }`}
          >
            <div className="flex flex-col items-center justify-center gap-2">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  isDragOver
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--primary)]/10 text-[var(--primary)]'
                }`}
              >
                <UploadCloud className="w-6 h-6" />
              </div>

              <div>
                <p className="text-xs font-bold text-[var(--text-primary)]">
                  {isDragOver ? 'Drop screenshot image here' : 'Drag & drop screenshot here'}
                </p>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  or <span className="text-[var(--primary)] font-semibold underline">browse files</span> from your device
                </p>
              </div>

              <div className="flex items-center gap-2 mt-1 text-[10px] text-[var(--text-muted)] font-mono">
                <FileText className="w-3 h-3" /> JPG, PNG, WEBP up to 10 MB
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="mt-3 p-2.5 rounded-lg bg-[var(--danger)]/10 border border-[var(--danger)]/20 text-xs text-[var(--danger)] flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
