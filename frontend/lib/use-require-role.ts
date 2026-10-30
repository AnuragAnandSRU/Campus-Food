'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';

/**
 * Bulletproof client-side guard for role-restricted areas (e.g. the canteen dashboard).
 * 1. Checks Zustand state with localStorage fallback.
 * 2. Unauthenticated users are sent to loginPath with a redirect param.
 * 3. Authenticated users lacking the required role are bounced to home.
 * 4. Never gets stuck in an infinite loading state.
 */
export function useRequireRole(allowed: string[], loginPath = '/login'): boolean {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const [ready, setReady] = useState(false);
  const key = allowed.join(',');

  useEffect(() => {
    let currentUser = user;
    if (!currentUser && typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          currentUser = JSON.parse(savedUser);
        } catch {}
      }
    }

    const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('token');
    const isAuthed = isAuthenticated || hasToken;

    if (!isAuthed || !currentUser) {
      const path = window.location.pathname + window.location.search;
      router.replace(`${loginPath}?redirect=${encodeURIComponent(path)}`);
      return;
    }

    if (!key.split(',').includes(currentUser.role)) {
      router.replace('/');
      return;
    }

    setReady(true);
  }, [isAuthenticated, user, key, router, loginPath]);

  return ready;
}
