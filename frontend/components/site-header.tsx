'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useCartStore } from '@/store/cart-store';
import { useLogout } from '@/lib/use-logout';
import toast from 'react-hot-toast';
import { authApi } from '@/lib/api/auth';
import { getApiErrorMessage } from '@/lib/api-client';

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
 * Role-aware top navigation:
 * - Guests & Students: Consumer view (Canteens, Cart, My Orders).
 * - Canteen Owners & Staff: Merchant view (Dashboard, Menu, Canteen Info, Team) - NO cart, NO student orders.
 * - Platform Admins: Admin view (Admin Console, Canteens).
 */
export function SiteHeader() {
  const [mounted, setMounted] = useState(false);
  const [resending, setResending] = useState(false);
  const user = useAuthStore((s) => s.user);
  const handleLogout = useLogout();
  const items = useCartStore((s) => s.items);

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleResendVerification() {
    setResending(true);
    try {
      await authApi.resendVerification();
      toast.success('Verification link sent! Check your inbox/spam folder.');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not resend email.'));
    } finally {
      setResending(false);
    }
  }

  const isPartner = user && (user.role === 'staff' || user.role === 'owner');
  const isAdmin = user && user.role === 'admin';
  const isStudent = user && user.role === 'student';
  const isConsumer = !user || isStudent;

  const itemCount = mounted && isConsumer ? items.reduce((n, i) => n + i.quantity, 0) : 0;
  const brandHref = isPartner ? '/dashboard' : isAdmin ? '/admin' : '/';

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        {/* Brand */}
        <Link href={brandHref} className="font-display text-xl font-semibold tracking-tight text-accent">
          Campus<span className="text-ink">Food</span>
          {mounted && isPartner && (
            <span className="ml-2 text-xs font-normal text-muted rounded-md bg-accent-tint px-2 py-0.5 border border-accent/20">
              Partner
            </span>
          )}
          {mounted && isAdmin && (
            <span className="ml-2 text-xs font-normal text-muted rounded-md bg-ink/5 px-2 py-0.5 border border-line">
              Admin
            </span>
          )}
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-4 text-sm sm:gap-5">
          {/* Canteen Partner Navigation */}
          {mounted && isPartner && (
            <>
              <Link href="/dashboard" className="font-medium text-accent hover:text-accent-hover transition-colors">
                Live Orders
              </Link>
              <Link href="/dashboard/menu" className="text-muted hover:text-ink transition-colors">
                Menu
              </Link>
              <Link href="/dashboard/analytics" className="text-muted hover:text-ink transition-colors">
                Analytics
              </Link>
              <Link href="/dashboard/canteen" className="text-muted hover:text-ink transition-colors">
                Canteen
              </Link>
              {user.role === 'owner' && (
                <Link href="/dashboard/team" className="text-muted hover:text-ink transition-colors">
                  Team
                </Link>
              )}
            </>
          )}

          {/* Platform Admin Navigation */}
          {mounted && isAdmin && (
            <>
              <Link href="/admin" className="font-medium text-accent hover:text-accent-hover transition-colors">
                Admin Console
              </Link>
              <Link href="/canteens" className="text-muted hover:text-ink transition-colors">
                View Canteens
              </Link>
            </>
          )}

          {/* Consumer Navigation (Students & Guests) */}
          {mounted && isConsumer && (
            <>
              <Link href="/canteens" className="text-muted hover:text-ink transition-colors">
                Canteens
              </Link>

              {isStudent && (
                <Link href="/orders" className="text-muted hover:text-ink transition-colors">
                  <span className="sm:hidden">Orders</span>
                  <span className="hidden sm:inline">My orders</span>
                </Link>
              )}

              {/* Cart Icon (Only shown to students and guests) */}
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
            </>
          )}

          {/* User Account State */}
          {!mounted ? (
            <div className="h-9 w-20" aria-hidden="true" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/profile"
                className="text-ink hover:text-accent transition-colors font-medium flex items-center gap-1"
                title="View and edit your profile"
              >
                <span className="hidden sm:inline">Hi, </span>
                <span>{user.name.split(' ')[0]}</span>
              </Link>
              <button
                onClick={() => handleLogout()}
                className="text-muted transition-colors hover:text-danger cursor-pointer"
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

      {/* Persistent Swiggy/Amazon style email verification banner for unverified students */}
      {mounted && user && user.role === 'student' && !user.isVerified && (
        <div className="border-t border-amber-300/40 bg-amber-50 px-4 py-2 text-xs text-amber-900">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm">✉️</span>
              <span>
                Please verify your email (<strong>{user.email}</strong>) to unlock food ordering.
              </span>
            </div>
            <button
              onClick={handleResendVerification}
              disabled={resending}
              className="rounded-full bg-amber-200/60 hover:bg-amber-200 px-3 py-1 text-[11px] font-semibold text-amber-950 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {resending ? 'Sending…' : 'Resend link'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
