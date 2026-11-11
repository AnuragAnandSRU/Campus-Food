'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { readStoredAuth } from '@/lib/role-routing';
import { useIsClient } from '@/lib/use-client-state';

/**
 * Client-side guard for role-restricted areas (e.g. `/admin`, `/dashboard`).
 * Unauthenticated callers go to `loginPath` with a redirect param; signed-in
 * callers lacking the required role go to `/unauthorized` instead of `/`.
 */
export function useRequireRole(allowed: string[], loginPath = '/login'): boolean {
  const router = useRouter();
  const isClient = useIsClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const key = allowed.join(',');

  const auth = isClient ? readStoredAuth() : { isAuthed: false, user: null };
  const ready = Boolean(
    isClient && auth.isAuthed && auth.user && key.split(',').includes(auth.user.role)
  );

  useEffect(() => {
    if (!isClient) return;
    const current = readStoredAuth();

    if (!current.isAuthed || !current.user) {
      const path = window.location.pathname + window.location.search;
      router.replace(`${loginPath}?redirect=${encodeURIComponent(path)}`);
      return;
    }

    if (!key.split(',').includes(current.user.role)) {
      router.replace('/unauthorized');
    }
  }, [isClient, isAuthenticated, user, key, router, loginPath]);

  return ready;
}
