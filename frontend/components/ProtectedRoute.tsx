'use client';

import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
}) {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  const [ready, setReady] = useState(false);

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

    if (!isAuthed) {
      const path = window.location.pathname + window.location.search;
      router.replace(`/login?redirect=${encodeURIComponent(path)}`);
      return;
    }

    if (allowedRoles && currentUser && !allowedRoles.includes(currentUser.role)) {
      router.replace('/unauthorized');
      return;
    }

    setReady(true);
  }, [isAuthenticated, user, allowedRoles, router]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  return <>{children}</>;
}
