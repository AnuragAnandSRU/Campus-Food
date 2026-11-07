'use client';

import { useEffect } from 'react';
import { usePwaStore, BeforeInstallPromptEvent } from '@/store/pwa-store';

/**
 * Headless lifecycle component for Progressive Web App (PWA):
 * - Registers Service Worker (/sw.js)
 * - Tracks installability state and standalone display mode in usePwaStore
 * - Eliminates intrusive floating bottom banners completely
 */
export function PwaLifecycle() {
  const setDeferredPrompt = usePwaStore((s) => s.setDeferredPrompt);
  const setIsInstalled = usePwaStore((s) => s.setIsInstalled);
  const setIsIos = usePwaStore((s) => s.setIsIos);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Safe Service Worker registration
    if ('serviceWorker' in navigator) {
      const registerSW = () => {
        navigator.serviceWorker.register('/sw.js').catch((err) => {
          console.warn('SW registration skipped:', err);
        });
      };

      if (document.readyState === 'complete') {
        registerSW();
      } else {
        window.addEventListener('load', registerSW);
      }
    }

    // 2. Standalone Mode Detection (App is already installed & running standalone)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
    }

    // 3. iOS Detection
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice =
      /iphone|ipad|ipod/.test(userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIos(Boolean(isIosDevice));

    // 4. Capture native browser install prompt without displaying intrusive floating popups
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [setDeferredPrompt, setIsInstalled, setIsIos]);

  return null;
}

