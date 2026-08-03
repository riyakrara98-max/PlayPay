'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  ExternalLink,
  Image as ImageIcon,
  AlertCircle,
} from 'lucide-react';
import { IconButton } from '@/components/ui/icon-button';
import { Button } from '@/components/ui/button';

interface ScreenshotLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl?: string;
  title?: string;
  subtitle?: string;
}

export function ScreenshotLightbox({
  isOpen,
  onClose,
  imageUrl,
  title = 'Proof Screenshot Review',
  subtitle,
}: ScreenshotLightboxProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [imageError, setImageError] = useState<boolean>(false);

  // Reset zoom when opening a new image
  useEffect(() => {
    if (isOpen) {
      queueMicrotask(() => {
        setZoomLevel(1);
        setImageError(false);
      });
    }
  }, [isOpen, imageUrl]);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === '+' || e.key === '=') {
        setZoomLevel((prev) => Math.min(prev + 0.25, 3));
      } else if (e.key === '-') {
        setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
      } else if (e.key === '0') {
        setZoomLevel(1);
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => setZoomLevel(1);

  const handleDownload = useCallback(() => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `submission_proof_${Date.now()}.png`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [imageUrl]);

  const handleOpenInNewTab = useCallback(() => {
    if (!imageUrl) return;
    window.open(imageUrl, '_blank', 'noopener,noreferrer');
  }, [imageUrl]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/90 backdrop-blur-md"
          />

          {/* Modal Box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className="relative z-10 flex flex-col w-full max-w-5xl h-[85vh] bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border)] rounded-[var(--radius-xl)] shadow-2xl overflow-hidden"
          >
            {/* Header Toolbar */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-[var(--surface-elevated)] border-b border-[var(--border)] shrink-0">
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-emerald-500" />
                  {title}
                </h3>
                {subtitle && (
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">{subtitle}</p>
                )}
              </div>

              {/* Action Controls */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="hidden sm:flex items-center bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-md)] p-1 gap-1 mr-2">
                  <IconButton
                    icon={<ZoomOut className="w-4 h-4" />}
                    aria-label="Zoom out"
                    variant="ghost"
                    size="sm"
                    onClick={handleZoomOut}
                    disabled={zoomLevel <= 0.5}
                  />
                  <span className="text-xs font-mono px-2 text-[var(--text-secondary)] min-w-[3.5rem] text-center">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <IconButton
                    icon={<ZoomIn className="w-4 h-4" />}
                    aria-label="Zoom in"
                    variant="ghost"
                    size="sm"
                    onClick={handleZoomIn}
                    disabled={zoomLevel >= 3}
                  />
                  <IconButton
                    icon={<RotateCcw className="w-3.5 h-3.5" />}
                    aria-label="Reset zoom"
                    variant="ghost"
                    size="sm"
                    onClick={handleResetZoom}
                    title="Reset Zoom (100%)"
                  />
                </div>

                {imageUrl && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownload}
                      leftIcon={<Download className="w-3.5 h-3.5" />}
                      className="hidden md:inline-flex"
                    >
                      Download
                    </Button>
                    <IconButton
                      icon={<ExternalLink className="w-4 h-4" />}
                      aria-label="Open image in new tab"
                      variant="outline"
                      size="sm"
                      onClick={handleOpenInNewTab}
                      title="Open image in new tab"
                    />
                  </>
                )}

                <IconButton
                  icon={<X className="w-5 h-5" />}
                  aria-label="Close Lightbox"
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="ml-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                />
              </div>
            </div>

            {/* Lightbox Canvas Area */}
            <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-950/50 flex items-center justify-center relative select-none">
              {!imageUrl || imageError ? (
                <div className="flex flex-col items-center justify-center text-center p-8 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] max-w-md">
                  <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
                  <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                    Proof Screenshot Missing or Unreachable
                  </h4>
                  <p className="text-xs text-[var(--text-secondary)] mt-1 mb-4">
                    The uploaded image URL could not be loaded or Cloudinary asset is unavailable.
                  </p>
                  {imageUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleOpenInNewTab}
                      leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
                    >
                      Try External Direct Link
                    </Button>
                  )}
                </div>
              ) : (
                <div
                  className="transition-transform duration-200 ease-out max-w-full max-h-full flex items-center justify-center"
                  style={{ transform: `scale(${zoomLevel})` }}
                >
                  <img
                    src={imageUrl}
                    alt="Proof Screenshot"
                    onError={() => setImageError(true)}
                    className="max-h-[70vh] w-auto h-auto object-contain rounded-[var(--radius-md)] border border-slate-700/50 shadow-2xl"
                  />
                </div>
              )}
            </div>

            {/* Footer helper info */}
            <div className="px-5 py-2.5 bg-[var(--surface-elevated)] border-t border-[var(--border)] shrink-0 flex items-center justify-between text-xs text-[var(--text-secondary)]">
              <span>Press <kbd className="px-1.5 py-0.5 bg-[var(--surface)] border border-[var(--border)] rounded text-[10px] font-mono">Esc</kbd> to close lightbox</span>
              <span className="hidden sm:inline">Use <kbd className="px-1.5 py-0.5 bg-[var(--surface)] border border-[var(--border)] rounded text-[10px] font-mono">+</kbd> / <kbd className="px-1.5 py-0.5 bg-[var(--surface)] border border-[var(--border)] rounded text-[10px] font-mono">-</kbd> to zoom screenshot</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
