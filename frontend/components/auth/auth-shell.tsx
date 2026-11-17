'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, Store, UtensilsCrossed } from 'lucide-react';
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
    <div className="relative min-h-screen flex flex-col justify-between bg-background bg-dot-grid overflow-x-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_75%_65%_at_50%_-10%,rgba(27,122,69,0.16),transparent)]"
      />

      {/* Top Header */}
      <header className="relative z-10 px-6 py-6 sm:px-10 flex items-center justify-between max-w-6xl w-full mx-auto">
        <Link
          href={brandHref}
          className="group font-display text-xl font-semibold tracking-tight text-accent flex items-center gap-2.5"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-white shadow-xs transition-transform duration-200 group-hover:scale-105">
            <UtensilsCrossed className="h-4 w-4" strokeWidth={2.1} />
          </span>
          <span>
            Campus<span className="text-ink">Food</span>
          </span>
          {door === 'partner' && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-accent rounded-full bg-accent-tint px-2.5 py-0.5 border border-accent/25">
              <Store className="h-3 w-3" />
              Partner
            </span>
          )}
          {door === 'admin' && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-ink rounded-full bg-ink/5 px-2.5 py-0.5 border border-ink/15">
              <ShieldCheck className="h-3 w-3 text-accent" />
              Admin
            </span>
          )}
        </Link>
      </header>

      {/* Main Content Card Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-6 sm:px-6">
        <div className="w-full max-w-lg animate-slide-up">
          <div className="card p-6 sm:p-10 shadow-[0_18px_45px_-20px_rgba(16,20,14,0.14)] border border-line/90 bg-surface/95 backdrop-blur-sm">
            {children}
          </div>
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="relative z-10 px-6 py-6 text-center text-xs text-muted border-t border-line/70 bg-surface/50">
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
