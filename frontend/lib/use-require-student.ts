'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { getRoleHomePath, readStoredAuth } from '@/lib/role-routing';
import { useIsClient } from '@/lib/use-client-state';

/**
 * Guard for student-only authenticated pages (checkout, orders, favorites).
 * Unauthenticated visitors go to `/login?redirect=...`; signed-in non-students
 * (admins, owners, staff) are quietly routed back to their own workspace home.
 */
export function useRequireStudent(): boolean {
  const router = useRouter();
  const isClient = useIsClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  const auth = isClient ? readStoredAuth() : { isAuthed: false, user: null };
  const ready = Boolean(
    isClient && auth.isAuthed && auth.user && auth.user.role === 'student'
  );

  useEffect(() => {
    if (!isClient) return;
    const current = readStoredAuth();

    if (!current.isAuthed || !current.user) {
      const path = window.location.pathname + window.location.search;
      router.replace(`/login?redirect=${encodeURIComponent(path)}`);
      return;
    }

    if (current.user.role !== 'student') {
      router.replace(getRoleHomePath(current.user.role));
    }
  }, [isClient, isAuthenticated, user, router]);

  return ready;
}
