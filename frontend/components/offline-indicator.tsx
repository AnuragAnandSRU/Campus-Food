'use client';

import { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import toast from 'react-hot-toast';

export function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(() =>
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOffline = () => {
      setIsOffline(true);
      toast('You are offline. Showing cached menus.', {
        id: 'network-status',
        duration: 5000,
        icon: <WifiOff className="h-4 w-4 text-amber-600" />,
      });
    };

    const handleOnline = () => {
      setIsOffline(false);
      toast.success('Back online! Reconnected to campus network.', {
        id: 'network-status',
        duration: 3000,
        icon: <Wifi className="h-4 w-4 text-accent" />,
      });
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 transform animate-fade-in flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/90 px-4 py-2 text-xs font-medium text-white shadow-lg backdrop-blur-md"
    >
      <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
      <span>Offline Mode · Cached content available</span>
    </div>
  );
}
