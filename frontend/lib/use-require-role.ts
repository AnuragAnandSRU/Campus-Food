'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';

/**
 * Client-side guard for role-restricted areas (e.g. the canteen dashboard).
 * Unauthenticated users are sent to /login with a redirect back; authenticated
 * users who lack an allowed role are sent home. Returns `ready` only once the
 * user is confirmed authorised, so the page can hold a placeholder until then.
 */
export function useRequireRole(allowed: string[]): boolean {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const [ready, setReady] = useState(false);
  const key = allowed.join(','); // stable dep for the effect

  useEffect(() => {
    if (!isAuthenticated || !user) {
      const path = window.location.pathname + window.location.search;
      router.replace(`/login?redirect=${encodeURIComponent(path)}`);
      return;
    }
    if (!key.split(',').includes(user.role)) {
      router.replace('/');
      return;
    }
    setReady(true);
  }, [isAuthenticated, user, key, router]);

  return ready;
}
