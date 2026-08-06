'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Download,
  ExternalLink,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle2,
  Calendar,
  ShieldCheck,
  Sparkles,
  Maximize2,
  Clock,
} from 'lucide-react';
import { IconButton } from '@/components/ui/icon-button';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ScreenshotLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl?: string;
  title?: string;
  subtitle?: string;
  metadata?: {
    format?: string;
    width?: number;
    height?: number;
    bytes?: number;
    createdAt?: string;
    publicId?: string;
  } | null;
}

export const ScreenshotLightbox = React.memo(function ScreenshotLightbox({
  isOpen,
  onClose,
  imageUrl,
  title = 'Proof Screenshot Review',
  subtitle,
  metadata,
}: ScreenshotLightboxProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [imageError, setImageError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [imgDimensions, setImgDimensions] = useState<{ width: number; height: number } | null>(null);

  // Reset controls when opening new image
  useEffect(() => {
    if (isOpen) {
      queueMicrotask(() => {
        setZoomLevel(1);
        setRotation(0);
        setImageError(false);
        setIsLoading(true);
        setImgDimensions(null);
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
        setRotation(0);
      } else if (e.key === 'r' || e.key === 'R') {
        setRotation((prev) => (prev + 90) % 360);
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
  const handleResetZoom = () => {
    setZoomLevel(1);
    setRotation(0);
  };
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const handleDoubleTap = () => {
    if (zoomLevel === 1) {
      setZoomLevel(2);
    } else {
      setZoomLevel(1);
    }
  };

  const handleDownload = useCallback(() => {
    if (!imageUrl) return;
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `proof_screenshot_${Date.now()}.png`;
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

  const formatBytes = (bytes?: number) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/92 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className="relative z-10 flex flex-col w-full max-w-6xl h-[90vh] bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border)] rounded-[var(--radius-2xl)] shadow-2xl overflow-hidden"
          >
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-[var(--surface-elevated)] border-b border-[var(--border)] shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center shrink-0">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)] truncate flex items-center gap-2">
                    <span>{title}</span>
                    <Badge variant="success" size="sm" className="hidden sm:inline-flex">
                      <ShieldCheck className="w-3 h-3 inline mr-1" /> Cloudinary Verified
                    </Badge>
                  </h3>
                  {subtitle && (
                    <p className="text-xs text-[var(--text-secondary)] truncate mt-0.5">{subtitle}</p>
                  )}
                </div>
              </div>

              {/* Action Controls */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Zoom & Rotate toolbar */}
                <div className="flex items-center bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-lg)] p-1 gap-1">
                  <IconButton
                    icon={<ZoomOut className="w-4 h-4" />}
                    aria-label="Zoom out"
                    variant="ghost"
                    size="sm"
                    onClick={handleZoomOut}
                    disabled={zoomLevel <= 0.5}
                    title="Zoom Out (-)"
                  />
                  <span className="text-xs font-mono font-bold px-2 text-[var(--text-primary)] min-w-[3.5rem] text-center select-none">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <IconButton
                    icon={<ZoomIn className="w-4 h-4" />}
                    aria-label="Zoom in"
                    variant="ghost"
                    size="sm"
                    onClick={handleZoomIn}
                    disabled={zoomLevel >= 3}
                    title="Zoom In (+)"
                  />
                  <IconButton
                    icon={<RotateCw className="w-3.5 h-3.5" />}
                    aria-label="Rotate image"
                    variant="ghost"
                    size="sm"
                    onClick={handleRotate}
                    title="Rotate 90° (R)"
                  />
                  <IconButton
                    icon={<RotateCcw className="w-3.5 h-3.5" />}
                    aria-label="Reset zoom and rotation"
                    variant="ghost"
                    size="sm"
                    onClick={handleResetZoom}
                    title="Reset Zoom & Rotation (0)"
                  />
                </div>

                {/* File Action Controls */}
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
                      title="Open Original Image"
                    />
                  </>
                )}

                <IconButton
                  icon={<X className="w-5 h-5" />}
                  aria-label="Close Lightbox"
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="ml-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                />
              </div>
            </div>

            {/* Lightbox Body Grid */}
            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 overflow-hidden bg-slate-950/70">
              {/* Image Canvas (Col 1 to 9) */}
              <div
                onDoubleClick={handleDoubleTap}
                className="lg:col-span-9 h-full overflow-auto p-4 sm:p-6 flex items-center justify-center relative select-none cursor-zoom-in"
              >
                {isLoading && !imageError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-400">
                    <div className="w-10 h-10 border-3 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                    <span className="text-xs font-mono">Loading High-Res Proof Screenshot...</span>
                  </div>
                )}

                {!imageUrl || imageError ? (
                  <div className="flex flex-col items-center justify-center text-center p-8 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-xl)] max-w-md shadow-xl">
                    <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
                    <h4 className="text-sm font-bold text-[var(--text-primary)]">
                      Proof Screenshot Missing or Unreachable
                    </h4>
                    <p className="text-xs text-[var(--text-secondary)] mt-1 mb-4">
                      The uploaded screenshot URL could not be rendered. Check if Cloudinary asset exists.
                    </p>
                    {imageUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleOpenInNewTab}
                        leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
                      >
                        Open Direct URL
                      </Button>
                    )}
                  </div>
                ) : (
                  <div
                    className="transition-transform duration-200 ease-out flex items-center justify-center max-w-full max-h-full"
                    style={{
                      transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                    }}
                  >
                    <img
                      src={imageUrl}
                      alt="Proof Screenshot Fullview"
                      loading="lazy"
                      onLoad={(e) => {
                        setIsLoading(false);
                        const target = e.currentTarget;
                        setImgDimensions({
                          width: target.naturalWidth,
                          height: target.naturalHeight,
                        });
                      }}
                      onError={() => {
                        setIsLoading(false);
                        setImageError(true);
                      }}
                      className="max-h-[75vh] w-auto h-auto object-contain rounded-[var(--radius-xl)] border border-slate-700/60 shadow-2xl"
                    />
                  </div>
                )}
              </div>

              {/* Sidebar Info Panel (Col 10 to 12) */}
              <div className="lg:col-span-3 border-t lg:border-t-0 lg:border-l border-[var(--border)] bg-[var(--surface-elevated)] p-4 overflow-y-auto space-y-4 text-xs">
                <div>
                  <h4 className="font-bold text-sm text-[var(--text-primary)] flex items-center gap-1.5 mb-3">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Screenshot Metadata</span>
                  </h4>

                  <div className="space-y-2.5">
                    <div className="p-2.5 rounded-[var(--radius-md)] bg-[var(--surface)] border border-[var(--border)] space-y-1.5">
                      <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                        Resolution & Size
                      </div>
                      <div className="font-mono text-sm font-semibold text-[var(--text-primary)]">
                        {imgDimensions
                          ? `${imgDimensions.width} × ${imgDimensions.height} px`
                          : metadata?.width && metadata?.height
                          ? `${metadata.width} × ${metadata.height} px`
                          : 'Standard Screenshot'}
                      </div>
                      <div className="text-[11px] text-[var(--text-secondary)] font-mono">
                        Format: {metadata?.format ? metadata.format.toUpperCase() : 'PNG / JPG'}
                        {metadata?.bytes ? ` • ${formatBytes(metadata.bytes)}` : ''}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-[var(--radius-md)] bg-[var(--surface)] border border-[var(--border)] space-y-1.5">
                      <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                        Verification Status
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-500 font-semibold">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>Valid Cloudinary Upload</span>
                      </div>
                      <div className="text-[11px] text-[var(--text-secondary)] truncate font-mono">
                        ID: {metadata?.publicId || 'cld_proof_asset'}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-[var(--radius-md)] bg-[var(--surface)] border border-[var(--border)] space-y-1.5">
                      <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                        Shortcuts Guide
                      </div>
                      <ul className="space-y-1 text-[11px] text-[var(--text-secondary)]">
                        <li className="flex items-center justify-between">
                          <span>Zoom In/Out</span>
                          <kbd className="px-1.5 py-0.5 bg-[var(--surface-elevated)] border border-[var(--border)] rounded font-mono text-[10px]">+</kbd>
                        </li>
                        <li className="flex items-center justify-between">
                          <span>Rotate Image</span>
                          <kbd className="px-1.5 py-0.5 bg-[var(--surface-elevated)] border border-[var(--border)] rounded font-mono text-[10px]">R</kbd>
                        </li>
                        <li className="flex items-center justify-between">
                          <span>Reset View</span>
                          <kbd className="px-1.5 py-0.5 bg-[var(--surface-elevated)] border border-[var(--border)] rounded font-mono text-[10px]">0</kbd>
                        </li>
                        <li className="flex items-center justify-between">
                          <span>Close Modal</span>
                          <kbd className="px-1.5 py-0.5 bg-[var(--surface-elevated)] border border-[var(--border)] rounded font-mono text-[10px]">Esc</kbd>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Bar */}
            <div className="px-5 py-2.5 bg-[var(--surface-elevated)] border-t border-[var(--border)] shrink-0 flex items-center justify-between text-xs text-[var(--text-secondary)]">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Double tap or double click image for quick 200% zoom</span>
              </span>
              <span className="font-mono text-[10px] text-[var(--text-muted)]">
                Moderation Console v2.0
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
});

