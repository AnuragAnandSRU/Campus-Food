'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';

/**
 * Client-side guard for role-restricted areas (e.g. the canteen dashboard).
 * Waits for storage hydration to avoid premature redirects on page refresh.
 * Unauthenticated users are sent to `loginPath` (default /login) with a redirect back;
 * authenticated users who lack an allowed role are sent home.
 */
export function useRequireRole(allowed: string[], loginPath = '/login'): boolean {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const user = useAuthStore((s) => s.user);
  const [ready, setReady] = useState(false);
  const key = allowed.join(','); // stable dep for the effect

  useEffect(() => {
    // Wait until Zustand has finished loading session from localStorage
    if (!isHydrated) return;

    if (!isAuthenticated || !user) {
      const path = window.location.pathname + window.location.search;
      router.replace(`${loginPath}?redirect=${encodeURIComponent(path)}`);
      return;
    }

    if (!key.split(',').includes(user.role)) {
      router.replace('/');
      return;
    }

    setReady(true);
  }, [isHydrated, isAuthenticated, user, key, router, loginPath]);

  return ready;
}
