'use client';

import { useState, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { CloudinaryMetadata } from '@/types/firestore';

export interface UploadedFileInfo {
  file?: File;
  name: string;
  sizeFormatted: string;
  previewUrl: string;
  uploadedUrl: string | null;
  publicId: string | null;
  metadata: CloudinaryMetadata | null;
}

export interface UseUploadScreenshotResult {
  fileInfo: UploadedFileInfo | null;
  isUploading: boolean;
  progress: number;
  error: string | null;
  isDragOver: boolean;
  uploadScreenshot: (file: File) => Promise<{ url: string; publicId: string; metadata: CloudinaryMetadata } | null>;
  cancelUpload: () => void;
  removeImage: () => void;
  rollbackUpload: (publicIdToRollback?: string) => Promise<void>;
  setIsDragOver: (isOver: boolean) => void;
  handleFileDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  validateFile: (file: File) => string | null;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function useUploadScreenshot(initialUrl?: string | null): UseUploadScreenshotResult {
  const { toast } = useToast();
  const [fileInfo, setFileInfo] = useState<UploadedFileInfo | null>(() => {
    if (initialUrl) {
      return {
        name: 'Submitted Screenshot Proof',
        sizeFormatted: 'Verified',
        previewUrl: initialUrl,
        uploadedUrl: initialUrl,
        publicId: null,
        metadata: {
          public_id: 'existing_proof',
          secure_url: initialUrl,
        },
      };
    }
    return null;
  });

  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const xhrRef = useRef<XMLHttpRequest | null>(null);

  // Validate File locally before upload
  const validateFile = useCallback((file: File): string | null => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      return 'Invalid file format. Allowed formats: JPG, JPEG, PNG, WEBP.';
    }

    const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
    if (file.size > MAX_SIZE) {
      return `File size (${formatFileSize(file.size)}) exceeds the 10 MB limit.`;
    }

    return null;
  }, []);

  // Rule 9 Rollback Helper
  const rollbackUpload = useCallback(async (publicIdToRollback?: string) => {
    const targetId = publicIdToRollback || fileInfo?.publicId;
    if (!targetId) return;

    try {
      await fetch('/api/upload/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicId: targetId }),
      });
      console.log('[Upload Rollback Executed]', targetId);
    } catch (e) {
      console.error('[Upload Rollback Failed]', e);
    }
  }, [fileInfo?.publicId]);

  const cancelUpload = useCallback(() => {
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }
    setIsUploading(false);
    setProgress(0);
    toast({
      title: 'Upload Cancelled',
      message: 'Screenshot upload was cancelled.',
      variant: 'info',
    });
  }, [toast]);

  const removeImage = useCallback(() => {
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }
    setFileInfo(null);
    setIsUploading(false);
    setProgress(0);
    setError(null);
  }, []);

  const uploadScreenshot = useCallback(
    async (file: File): Promise<{ url: string; publicId: string; metadata: CloudinaryMetadata } | null> => {
      const valError = validateFile(file);
      if (valError) {
        setError(valError);
        toast({
          title: 'Validation Error',
          message: valError,
          variant: 'error',
        });
        return null;
      }

      setError(null);
      setIsUploading(true);
      setProgress(10);

      const previewUrl = URL.createObjectURL(file);
      const newFileInfo: UploadedFileInfo = {
        file,
        name: file.name,
        sizeFormatted: formatFileSize(file.size),
        previewUrl,
        uploadedUrl: null,
        publicId: null,
        metadata: null,
      };
      setFileInfo(newFileInfo);

      return new Promise((resolve) => {
        const formData = new FormData();
        formData.append('file', file);

        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;

        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 90) + 10;
            setProgress(Math.min(99, percent));
          }
        });

        xhr.addEventListener('load', () => {
          setIsUploading(false);
          xhrRef.current = null;

          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              const url = response.url;
              const publicId = response.publicId;
              const metadata: CloudinaryMetadata = response.metadata || {
                public_id: publicId,
                secure_url: url,
              };

              // Strict Rule 1 Verification on Client
              if (!url || typeof url !== 'string' || !url.startsWith('https://')) {
                throw new Error('Upload verification failed: Security requirement HTTPS not met.');
              }

              setProgress(100);
              setFileInfo((prev) =>
                prev ? { ...prev, uploadedUrl: url, publicId, metadata } : null
              );

              toast({
                title: 'Upload Verified ✨',
                message: 'Screenshot uploaded and verified successfully.',
                variant: 'success',
              });

              resolve({ url, publicId, metadata });
            } catch (e: unknown) {
              const msg = e instanceof Error ? e.message : 'Failed to process server upload response.';
              console.error('Upload verification error:', e);
              setError(msg);
              toast({
                title: 'Upload Verification Failed',
                message: msg,
                variant: 'error',
              });
              resolve(null);
            }
          } else {
            let serverError = 'Upload failed. Please try again.';
            try {
              const parsed = JSON.parse(xhr.responseText);
              if (parsed.error) serverError = parsed.error;
            } catch {
              // use default message
            }
            setError(serverError);
            toast({
              title: 'Upload Failed',
              message: serverError,
              variant: 'error',
            });
            resolve(null);
          }
        });

        xhr.addEventListener('error', () => {
          setIsUploading(false);
          xhrRef.current = null;
          const msg = 'Network error during upload. Please check your connection.';
          setError(msg);
          toast({
            title: 'Network Error',
            message: msg,
            variant: 'error',
          });
          resolve(null);
        });

        xhr.addEventListener('abort', () => {
          setIsUploading(false);
          xhrRef.current = null;
          resolve(null);
        });

        xhr.open('POST', '/api/upload');
        xhr.send(formData);
      });
    },
    [validateFile, toast]
  );

  const handleFileDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const droppedFile = e.dataTransfer.files[0];
        uploadScreenshot(droppedFile);
      }
    },
    [uploadScreenshot]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const selectedFile = e.target.files[0];
        uploadScreenshot(selectedFile);
      }
    },
    [uploadScreenshot]
  );

  return {
    fileInfo,
    isUploading,
    progress,
    error,
    isDragOver,
    uploadScreenshot,
    cancelUpload,
    removeImage,
    rollbackUpload,
    setIsDragOver,
    handleFileDrop,
    handleFileSelect,
    validateFile,
  };
}
