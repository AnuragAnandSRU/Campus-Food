'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';

/**
 * Bulletproof client-side guard for pages that require a signed-in user (checkout, orders).
 * 1. Checks Zustand auth state AND direct localStorage token.
 * 2. Never gets stuck in an infinite loading state.
 * 3. Immediately sets ready=true if authenticated.
 * 4. Redirects cleanly to /login if unauthenticated.
 */
export function useRequireAuth(): boolean {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('token');
    const isAuthed = isAuthenticated || hasToken;

    if (isAuthed) {
      setReady(true);
    } else {
      const path = window.location.pathname + window.location.search;
      router.replace(`/login?redirect=${encodeURIComponent(path)}`);
    }
  }, [isAuthenticated, router]);

  return ready;
}
