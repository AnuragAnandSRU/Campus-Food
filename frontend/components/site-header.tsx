'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';

/**
 * Slim top navigation shared across the browse/shop pages. Auth-aware, with a
 * mount guard so the persisted zustand store doesn't cause a hydration
 * mismatch on first paint.
 */
export function SiteHeader() {
  const [mounted, setMounted] = useState(false);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="font-display text-xl font-semibold tracking-tight text-accent">
          Campus<span className="text-ink">Food</span>
        </Link>

        <nav className="flex items-center gap-5 text-sm">
          <Link href="/canteens" className="text-muted transition-colors hover:text-ink">
            Canteens
          </Link>
          {mounted && user ? (
            <div className="flex items-center gap-4">
              <span className="hidden text-ink sm:inline">
                Hi, <span className="font-medium">{user.name.split(' ')[0]}</span>
              </span>
              <button
                onClick={logout}
                className="text-muted transition-colors hover:text-danger"
              >
                Log out
              </button>
            </div>
          ) : (
            <Link href="/login" className="btn btn-primary px-5 py-2 text-sm">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
