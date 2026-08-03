'use client';

import React, { useState, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  X,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CloudinaryMetadata } from '@/types/firestore';

interface CloudinaryIconUploadProps {
  value?: string;
  metadata?: CloudinaryMetadata | null;
  onChange: (url: string, metadata?: CloudinaryMetadata | null) => void;
  folder?: string;
  disabled?: boolean;
}

export function CloudinaryIconUpload({
  value = '',
  onChange,
  disabled = false,
}: CloudinaryIconUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    setError(null);

    // 1. Validate File Size (Max 10 MB)
    const MAX_SIZE_BYTES = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      setError(`File size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds 10 MB limit.`);
      return;
    }

    // 2. Validate Image Extension & Type
    const mimeType = file.type.toLowerCase();
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(mimeType)) {
      setError('Invalid format. Please upload JPG, PNG, or WEBP images.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(15);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Simulated smooth progress while waiting for network response
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 85) {
            clearInterval(progressInterval);
            return 85;
          }
          return prev + 15;
        });
      }, 150);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload image.');
      }

      const data = await response.json();
      setUploadProgress(100);

      setTimeout(() => {
        onChange(data.url, data.metadata || null);
        setIsUploading(false);
        setUploadProgress(0);
      }, 200);
    } catch (err: unknown) {
      console.error('[CloudinaryIconUpload Error]', err);
      const msg = err instanceof Error ? err.message : 'Upload failed. Please check connection and retry.';
      setError(msg);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled || isUploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemove = () => {
    if (disabled) return;
    onChange('', null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      {/* Hidden input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/jpg"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {value ? (
        /* Image Uploaded State */
        <div className="flex items-center gap-4 p-3 rounded-[var(--radius-lg)] bg-[var(--surface-elevated)] border border-[var(--border)] relative group">
          <div className="relative w-16 h-16 rounded-[var(--radius-md)] bg-[var(--surface)] border border-[var(--border)] overflow-hidden shrink-0 flex items-center justify-center shadow-xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="App Icon Preview"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-500">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>App Icon Uploaded</span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] truncate font-mono">
              {value.startsWith('http') ? value : 'Base64 Local Image'}
            </p>
          </div>

          {!disabled && (
            <div className="flex items-center gap-1 shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Replace
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                disabled={isUploading}
                className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>
      ) : (
        /* Upload Dropzone */
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => {
            if (!disabled && !isUploading) {
              fileInputRef.current?.click();
            }
          }}
          className={`p-6 rounded-[var(--radius-lg)] border-2 border-dashed transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-3 ${
            isDragOver
              ? 'border-[var(--primary)] bg-[var(--primary)]/5 scale-[1.01]'
              : 'border-[var(--border)] hover:border-[var(--primary)]/50 hover:bg-[var(--surface-elevated)]/50 bg-[var(--surface-elevated)]/30'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          {isUploading ? (
            <div className="space-y-3 w-full max-w-xs">
              <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin mx-auto" />
              <div className="space-y-1">
                <span className="text-xs font-bold text-[var(--text-primary)]">
                  Uploading to Cloudinary... ({uploadProgress}%)
                </span>
                <div className="w-full h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--primary)] transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
                {isDragOver ? <Upload className="w-6 h-6 animate-bounce" /> : <ImageIcon className="w-6 h-6" />}
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-[var(--text-primary)]">
                  Click to upload or drag & drop app icon
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  PNG, JPG, or WEBP (Max 10MB). Saved in <span className="font-mono text-amber-500">playpay/app-icons</span>
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Error Message & Retry */}
      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-[var(--radius-md)] flex items-center justify-between gap-3 text-xs text-rose-500">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}
