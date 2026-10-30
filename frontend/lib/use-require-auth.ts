'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';

/**
 * Client-side guard for pages that require a signed-in user (checkout, orders).
 * Waits for hydration from storage so page refreshes don't prematurely bounce.
 * Returns `ready` — true only once we've confirmed on the client that the
 * persisted auth store says the user is authenticated.
 */
export function useRequireAuth(): boolean {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Wait until Zustand has finished loading session from localStorage
    if (!isHydrated) return;

    if (isAuthenticated) {
      setReady(true);
      return;
    }

    const path = window.location.pathname + window.location.search;
    router.replace(`/login?redirect=${encodeURIComponent(path)}`);
  }, [isHydrated, isAuthenticated, router]);

  return ready;
}
