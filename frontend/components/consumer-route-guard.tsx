'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { getRoleHomePath, readStoredAuth } from '@/lib/role-routing';
import { useIsClient } from '@/lib/use-client-state';

/**
 * Prevents signed-in internal roles (admin, owner, staff) from rendering
 * consumer-facing routes (`/`, `/canteens`, `/cart`) and redirects them to
 * their operational workspace.
 */
export function ConsumerRouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isClient = useIsClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  const auth = isClient ? readStoredAuth() : { isAuthed: false, user: null };
  const nonStudentRole =
    isClient && auth.isAuthed && auth.user && auth.user.role !== 'student'
      ? auth.user.role
      : null;

  useEffect(() => {
    if (nonStudentRole) {
      router.replace(getRoleHomePath(nonStudentRole));
    }
  }, [nonStudentRole, isAuthenticated, user, router]);

  if (nonStudentRole) {
    const label =
      nonStudentRole === 'admin' ? 'Admin Console' : 'Partner Dashboard';
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background bg-dot-grid px-6 text-center animate-fade-in">
        <div className="card max-w-xs w-full p-8 flex flex-col items-center">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-tint text-accent">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
          <p className="mt-4 font-display text-base font-semibold text-ink">
            Opening {label}
          </p>
          <p className="mt-1 text-xs text-muted">
            Routing you to your workspace…
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
