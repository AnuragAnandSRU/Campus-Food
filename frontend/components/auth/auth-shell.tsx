'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { PortalDoor } from '@/lib/role-routing';
import { useClientSearchParam } from '@/lib/use-client-state';

/**
 * Door-aware chrome for `(auth)` routes so partner sign-in/invite screens and
 * admin password-recovery links never expose student browse/canteen links.
 */
export function AuthShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const queryDoor = useClientSearchParam('door');

  const isRecoveryRoute =
    pathname === '/forgot-password' || pathname === '/reset-password';

  let door: PortalDoor = 'student';
  if (isRecoveryRoute && queryDoor === 'admin') {
    door = 'admin';
  } else if (
    pathname === '/partner' ||
    pathname === '/accept-invite' ||
    (isRecoveryRoute && queryDoor === 'partner')
  ) {
    door = 'partner';
  }

  const brandHref =
    door === 'admin' ? '/admin/login' : door === 'partner' ? '/partner' : '/';

  return (
    <div className="min-h-screen flex flex-col justify-between bg-background bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(27,122,69,0.14),transparent)]">
      {/* Top Header */}
      <header className="px-6 py-6 sm:px-10 flex items-center justify-between max-w-6xl w-full mx-auto">
        <Link
          href={brandHref}
          className="font-display text-xl font-semibold tracking-tight text-accent flex items-center gap-2"
        >
          <span>
            Campus<span className="text-ink">Food</span>
          </span>
          {door === 'partner' && (
            <span className="text-xs font-normal text-muted rounded-md bg-accent-tint px-2 py-0.5 border border-accent/20">
              Partner
            </span>
          )}
          {door === 'admin' && (
            <span className="text-xs font-normal text-muted rounded-md bg-ink/5 px-2 py-0.5 border border-line">
              Admin
            </span>
          )}
        </Link>
      </header>

      {/* Main Content Card Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-lg">
          <div className="card p-6 sm:p-10 shadow-xl shadow-ink/5 border border-line bg-surface/95 backdrop-blur-sm">
            {children}
          </div>
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="px-6 py-6 text-center text-xs text-muted border-t border-line/60">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 Campus Food. Made with care for campus life.</p>
          <div className="flex items-center gap-4">
            {door === 'admin' ? (
              <Link href="/admin/login" className="hover:text-ink transition-colors">
                Admin Sign In
              </Link>
            ) : door === 'partner' ? (
              <Link href="/partner" className="hover:text-ink transition-colors">
                Partner Sign In
              </Link>
            ) : (
              <>
                <Link href="/" className="hover:text-ink transition-colors">
                  Home
                </Link>
                <Link href="/canteens" className="hover:text-ink transition-colors">
                  Canteens
                </Link>
              </>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
