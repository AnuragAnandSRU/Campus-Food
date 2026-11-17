'use client';

import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { useAuthStore } from '@/store/auth-store';
import { useLogout } from '@/lib/use-logout';
import { getRoleHomePath, isPartnerRole } from '@/lib/role-routing';
import { useIsClient } from '@/lib/use-client-state';

export default function UnauthorizedPage() {
  const mounted = useIsClient();
  const user = useAuthStore((s) => s.user);
  const handleLogout = useLogout();

  const homeHref = mounted && user ? getRoleHomePath(user.role) : '/';
  const homeLabel =
    mounted && user?.role === 'admin'
      ? 'Go to Admin Console'
      : mounted && isPartnerRole(user?.role)
        ? 'Go to Dashboard'
        : mounted && user?.role === 'student'
          ? 'Browse Canteens'
          : 'Back to Home';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="card max-w-md w-full p-8 text-center border-line bg-surface/90 shadow-xl shadow-ink/5">
          <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-danger/10 text-danger border border-danger/20">
            <ShieldAlert className="h-7 w-7" />
          </div>

          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
            Access Restricted
          </h1>

          <p className="mt-2 text-sm text-muted leading-relaxed">
            {mounted && user ? (
              <>
                Your account (
                <span className="font-medium text-ink capitalize">{user.role}</span>)
                does not have permission to open this area.
              </>
            ) : (
              'You do not have permission to access this page. Please sign in with an authorized account.'
            )}
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href={homeHref} className="btn btn-primary px-5 py-2 text-sm">
              {homeLabel}
            </Link>
            {mounted && user ? (
              <button
                type="button"
                onClick={() => handleLogout()}
                className="btn btn-secondary px-5 py-2 text-sm cursor-pointer"
              >
                Sign out
              </button>
            ) : (
              <Link href="/login" className="btn btn-secondary px-5 py-2 text-sm">
                Sign in
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
