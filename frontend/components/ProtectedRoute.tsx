'use client';

import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
}) {
  const { isAuthenticated, isHydrated, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isHydrated) return;

    if (!isAuthenticated) {
      const path = window.location.pathname + window.location.search;
      router.replace(`/login?redirect=${encodeURIComponent(path)}`);
      return;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      router.replace('/unauthorized');
    }
  }, [isHydrated, isAuthenticated, user, allowedRoles, router]);

  if (!isHydrated || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}
