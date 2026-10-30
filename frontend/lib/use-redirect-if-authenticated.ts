'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';

/**
 * Industry-standard guard for public auth pages (/login, /partner, /register).
 * If a user is already authenticated with a valid session:
 * Immediately redirect them to their proper home screen using router.replace.
 */
export function useRedirectIfAuthenticated() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

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

    if (isAuthed && currentUser) {
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect');
      if (redirect) {
        router.replace(redirect);
        return;
      }

      if (currentUser.role === 'admin') {
        router.replace('/admin');
      } else if (currentUser.role === 'staff' || currentUser.role === 'owner') {
        router.replace('/dashboard');
      } else {
        router.replace('/canteens');
      }
    }
  }, [isAuthenticated, user, router]);

  return { isAuthenticated };
}
