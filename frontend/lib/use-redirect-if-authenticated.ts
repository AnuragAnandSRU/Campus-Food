'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';

/**
 * Industry-standard guard for public auth pages (/login, /partner, /register).
 * If a user is already authenticated with a valid session:
 * Immediately redirect them to their proper home screen using router.replace.
 * This prevents the back-button loop and prevents logged-in users from seeing sign-in forms.
 */
export function useRedirectIfAuthenticated() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (isAuthenticated && user) {
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect');
      if (redirect) {
        router.replace(redirect);
        return;
      }

      if (user.role === 'admin') {
        router.replace('/admin');
      } else if (user.role === 'staff' || user.role === 'owner') {
        router.replace('/dashboard');
      } else {
        router.replace('/canteens');
      }
    }
  }, [isAuthenticated, user, router]);

  return { isAuthenticated };
}
