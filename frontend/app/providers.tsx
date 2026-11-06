'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { authApi } from '@/lib/api/auth';

/**
 * Real-time background sync component:
 * 1. Validates session and syncs fresh user details (role, email verification, canteens) on mount.
 * 2. Listens for window focus and tab visibility changes (e.g. when returning from Gmail/Outlook
 *    after verifying an email or resetting password), updating user state in real time without
 *    requiring a manual page refresh.
 * 3. Listens for cross-tab storage changes so multi-tab state is immediately unified.
 */
function AuthSync() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const lastSyncRef = useRef<number>(0);

  useEffect(() => {
    if (!isHydrated) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;

    const syncSession = (force = false) => {
      const now = Date.now();
      // Throttle window focus refetches to at most once every 5 seconds unless forced or unverified
      const isUnverified = user && !user.isVerified;
      if (!force && !isUnverified && now - lastSyncRef.current < 5000) {
        return;
      }
      lastSyncRef.current = now;

      authApi
        .getMe()
        .then((freshUser) => {
          setUser(freshUser);
        })
        .catch((err) => {
          if (err?.response?.status === 401) {
            logout();
          }
        });
    };

    // 1. Initial mount sync
    syncSession(true);

    // 2. Window focus (user returns to window from email client)
    const handleFocus = () => syncSession();

    // 3. Tab visibility change (user switches back to this tab)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncSession();
      }
    };

    // 4. Cross-tab storage change (e.g. verified in another tab)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'auth-storage' || e.key === 'token') {
        syncSession(true);
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('storage', handleStorage);
    };
  }, [isHydrated, user?.isVerified, setUser, logout]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthSync />
      {children}
    </QueryClientProvider>
  );
}
