'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { getSafeRedirectForRole, readStoredAuth } from '@/lib/role-routing';

/**
 * Guard for public auth pages (`/login`, `/partner`, `/register`, `/admin/login`).
 * If a user already has an active session, sends them straight to the safe
 * destination for their role (validating any `?redirect=` param).
 */
export function useRedirectIfAuthenticated() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    const { isAuthed, user: currentUser } = readStoredAuth();

    if (isAuthed && currentUser) {
      const params = new URLSearchParams(window.location.search);
      const target = getSafeRedirectForRole(params.get('redirect'), currentUser.role);
      router.replace(target);
    }
  }, [isAuthenticated, user, router]);

  return { isAuthenticated };
}
