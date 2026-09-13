'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useCartStore } from '@/store/cart-store';

function CartIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 3h2l.4 2M7 13h10l3-8H6.4M7 13L5.4 5M7 13l-2 5h12"
      />
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="17" cy="20" r="1.4" />
    </svg>
  );
}

/**
 * Slim top navigation shared across the browse/shop pages. Auth- and cart-
 * aware, with a mount guard so the persisted zustand stores don't cause a
 * hydration mismatch on first paint.
 */
export function SiteHeader() {
  const [mounted, setMounted] = useState(false);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const items = useCartStore((s) => s.items);

  useEffect(() => setMounted(true), []);

  const itemCount = mounted ? items.reduce((n, i) => n + i.quantity, 0) : 0;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="font-display text-xl font-semibold tracking-tight text-accent">
          Campus<span className="text-ink">Food</span>
        </Link>

        <nav className="flex items-center gap-4 text-sm sm:gap-5">
          <Link href="/canteens" className="text-muted transition-colors hover:text-ink">
            Canteens
          </Link>

          {mounted && user && (user.role === 'staff' || user.role === 'owner') && (
            <Link href="/dashboard" className="font-medium text-accent transition-colors hover:text-accent-hover">
              Dashboard
            </Link>
          )}

          {mounted && user && (
            <Link
              href="/orders"
              className="hidden text-muted transition-colors hover:text-ink sm:inline"
            >
              My orders
            </Link>
          )}

          <Link
            href="/cart"
            className="relative text-ink transition-colors hover:text-accent"
            aria-label={`Cart${itemCount ? `, ${itemCount} items` : ''}`}
          >
            <CartIcon />
            {itemCount > 0 && (
              <span className="absolute -right-2.5 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-semibold text-white">
                {itemCount}
              </span>
            )}
          </Link>

          {mounted && user ? (
            <div className="flex items-center gap-3">
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
