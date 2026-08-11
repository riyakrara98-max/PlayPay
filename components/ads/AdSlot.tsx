'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useIsMobile } from '@/hooks/use-mobile';

interface AdSlotProps {
  placement:
    | 'dashboard'
    | 'task-list'
    | 'task-details'
    | 'my-tasks'
    | 'payment'
    | 'profile'
    | 'team-leader'
    | 'mobile'
    | 'desktop';
  className?: string;
}

const PLACEMENT_MAP = {
  'dashboard': 'dashboard',
  'task-list': 'taskList',
  'task-details': 'taskDetails',
  'my-tasks': 'myTasks',
  'payment': 'payment',
  'profile': 'profile',
  'team-leader': 'teamLeader',
  'mobile': 'mobile',
  'desktop': 'desktop',
} as const;

export function AdSlot({ placement, className = '' }: AdSlotProps) {
  const { settings, loading } = useSiteSettings();
  const isMobile = useIsMobile();
  const [isMounted, setIsMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const configKey = PLACEMENT_MAP[placement];
  const adsConfig = settings?.ads;
  const placementConfig = adsConfig ? adsConfig[configKey] : null;

  const isGlobalEnabled = adsConfig?.enabled ?? false;
  const isPlacementEnabled = placementConfig?.enabled ?? false;
  const adCode = placementConfig?.code?.trim() || '';

  useEffect(() => {
    if (!isMounted || !isGlobalEnabled || !isPlacementEnabled || !adCode || !containerRef.current) {
      return;
    }

    // Responsive filtering
    if (placement === 'mobile' && !isMobile) return;
    if (placement === 'desktop' && isMobile) return;

    const container = containerRef.current;
    container.innerHTML = ''; // Clear previous frame

    // Create a same-origin iframe that inherits document referrer & domain
    const iframe = document.createElement('iframe');
    iframe.setAttribute('title', `Ad - ${placement}`);
    iframe.style.width = '100%';
    iframe.style.border = '0';
    iframe.style.overflow = 'hidden';
    iframe.style.backgroundColor = 'transparent';
    iframe.style.minHeight = placement === 'dashboard' || placement === 'task-details' ? '250px' : '90px';

    container.appendChild(iframe);

    try {
      const iframeDoc = iframe.contentWindow?.document;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <base href="${typeof window !== 'undefined' ? window.location.origin : ''}/">
              <style>
                html, body {
                  margin: 0;
                  padding: 0;
                  width: 100%;
                  background: transparent;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  font-family: system-ui, -apple-system, sans-serif;
                }
                #ad-wrapper {
                  width: 100%;
                  text-align: center;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  flex-direction: column;
                }
                img { max-width: 100%; height: auto; }
              </style>
            </head>
            <body>
              <div id="ad-wrapper">
                ${adCode}
              </div>
              <script>
                function resizeAd() {
                  try {
                    var wrapper = document.getElementById('ad-wrapper');
                    var h = wrapper ? wrapper.scrollHeight : document.body.scrollHeight;
                    if (h > 20 && window.frameElement) {
                      window.frameElement.style.height = h + 'px';
                    }
                  } catch (e) {}
                }
                window.addEventListener('load', resizeAd);
                setTimeout(resizeAd, 500);
                setTimeout(resizeAd, 1500);
                setTimeout(resizeAd, 3000);
              </script>
            </body>
          </html>
        `);
        iframeDoc.close();
      }
    } catch (e) {
      console.error('[AdSlot Render Error]', e);
    }

    return () => {
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [isMounted, isGlobalEnabled, isPlacementEnabled, adCode, placement, isMobile]);

  // Hydration protection & checks
  if (!isMounted || loading || !isGlobalEnabled || !isPlacementEnabled || !adCode) {
    return null;
  }

  if (placement === 'mobile' && !isMobile) return null;
  if (placement === 'desktop' && isMobile) return null;

  return (
    <div
      ref={containerRef}
      id={`ad-slot-${placement}`}
      className={`w-full flex justify-center items-center my-3 overflow-hidden transition-all ${className}`}
    />
  );
}

