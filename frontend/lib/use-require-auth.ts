'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { readStoredAuth } from '@/lib/role-routing';
import { useIsClient } from '@/lib/use-client-state';

/**
 * Guard for pages shared by any signed-in role (e.g. `/profile`).
 * Student-only routes should use `useRequireStudent`; role-scoped workspaces
 * should use `useRequireRole`.
 */
export function useRequireAuth(): boolean {
  const router = useRouter();
  const isClient = useIsClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  const auth = isClient ? readStoredAuth() : { isAuthed: false, user: null };
  const ready = Boolean(isClient && auth.isAuthed && auth.user);

  useEffect(() => {
    if (!isClient) return;
    const current = readStoredAuth();
    if (!current.isAuthed || !current.user) {
      const path = window.location.pathname + window.location.search;
      router.replace(`/login?redirect=${encodeURIComponent(path)}`);
    }
  }, [isClient, isAuthenticated, user, router]);

  return ready;
}
