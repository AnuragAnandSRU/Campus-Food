'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';

/**
 * Client-side guard for pages that require a signed-in user (checkout, orders).
 * Returns `ready` — true only once we've confirmed on the client that the
 * persisted auth store says the user is authenticated. While false, render a
 * lightweight placeholder; unauthenticated users are bounced to /login with a
 * redirect back to where they were headed.
 */
export function useRequireAuth(): boolean {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      setReady(true);
      return;
    }
    const path = window.location.pathname + window.location.search;
    router.replace(`/login?redirect=${encodeURIComponent(path)}`);
  }, [isAuthenticated, router]);

  return ready;
}
