'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  BarChart3,
  Heart,
  LogOut,
  Mail,
  Menu,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Store,
  Users,
  UtensilsCrossed,
  X,
  ClipboardList,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth-store';
import { useCartStore } from '@/store/cart-store';
import { usePwaStore } from '@/store/pwa-store';
import { useLogout } from '@/lib/use-logout';
import { useIsClient } from '@/lib/use-client-state';
import { authApi } from '@/lib/api/auth';
import { getApiErrorMessage } from '@/lib/api-client';
import { cn } from '@/lib/utils';

/**
 * Role-aware top navigation:
 * - Guests & Students: Consumer view (Canteens, Orders, Favorites, Cart).
 * - Canteen Owners & Staff: Merchant view (Live Orders, Menu, Analytics, Canteen, Team).
 * - Platform Admins: Admin view (Admin Console).
 */
export function SiteHeader() {
  const pathname = usePathname() || '/';
  const mounted = useIsClient();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileOpen(false);
  }
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const user = useAuthStore((s) => s.user);
  const handleLogout = useLogout();
  const items = useCartStore((s) => s.items);
  const canInstall = usePwaStore((s) => s.canInstall);
  const promptInstall = usePwaStore((s) => s.promptInstall);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  async function handleResendVerification() {
    if (cooldown > 0) return;
    setResending(true);
    try {
      await authApi.resendVerification();
      toast.success('Verification link sent! Check your inbox or spam folder.');
      setCooldown(60);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not resend email.'));
    } finally {
      setResending(false);
    }
  }

  const isPartner = Boolean(user && (user.role === 'staff' || user.role === 'owner'));
  const isAdmin = Boolean(user && user.role === 'admin');
  const isStudent = Boolean(user && user.role === 'student');
  const isConsumer = !user || isStudent;

  const itemCount = mounted && isConsumer ? items.reduce((n, i) => n + i.quantity, 0) : 0;
  const brandHref = isPartner ? '/dashboard' : isAdmin ? '/admin' : '/';

  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  const navLinkClass = (href: string, exact = false) =>
    cn(
      'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-all duration-150',
      isActive(href, exact)
        ? 'bg-accent-tint text-accent font-semibold shadow-[inset_0_0_0_1px_rgba(27,122,69,0.16)]'
        : 'font-medium text-muted hover:bg-ink/5 hover:text-ink'
    );

  const initial = user?.name?.charAt(0).toUpperCase() || 'U';
  const firstName = user?.name?.split(' ')[0] || 'Account';

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-surface/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* Brand Wordmark */}
        <Link
          href={brandHref}
          className="group flex shrink-0 items-center gap-2.5 font-display text-xl font-semibold tracking-tight text-accent"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-white shadow-xs transition-transform duration-200 group-hover:scale-105">
            <UtensilsCrossed className="h-4 w-4" strokeWidth={2.1} />
          </span>
          <span>
            Campus<span className="text-ink">Food</span>
          </span>
          {mounted && isPartner && (
            <span className="hidden xs:inline-flex items-center rounded-full border border-accent/25 bg-accent-tint px-2.5 py-0.5 text-[11px] font-semibold text-accent">
              Partner
            </span>
          )}
          {mounted && isAdmin && (
            <span className="inline-flex items-center gap-1 rounded-full border border-ink/15 bg-ink/5 px-2.5 py-0.5 text-[11px] font-semibold text-ink">
              <ShieldCheck className="h-3 w-3 text-accent" />
              Admin
            </span>
          )}
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1.5" aria-label="Primary">
          {mounted && isPartner && (
            <>
              <Link href="/dashboard" className={navLinkClass('/dashboard', true)}>
                <ClipboardList className="h-4 w-4" />
                Live Orders
              </Link>
              <Link href="/dashboard/menu" className={navLinkClass('/dashboard/menu')}>
                <UtensilsCrossed className="h-4 w-4" />
                Menu
              </Link>
              {(user?.role === 'owner' || user?.permissions?.includes('view_analytics')) && (
                <Link href="/dashboard/analytics" className={navLinkClass('/dashboard/analytics')}>
                  <BarChart3 className="h-4 w-4" />
                  Analytics
                </Link>
              )}
              {user?.role === 'owner' && (
                <>
                  <Link href="/dashboard/canteen" className={navLinkClass('/dashboard/canteen')}>
                    <Store className="h-4 w-4" />
                    Canteen
                  </Link>
                  <Link href="/dashboard/team" className={navLinkClass('/dashboard/team')}>
                    <Users className="h-4 w-4" />
                    Team
                  </Link>
                </>
              )}
            </>
          )}

          {mounted && isAdmin && (
            <Link href="/admin" className={navLinkClass('/admin', true)}>
              <ShieldCheck className="h-4 w-4" />
              Admin Console
            </Link>
          )}

          {mounted && isConsumer && (
            <>
              <Link href="/canteens" className={navLinkClass('/canteens')}>
                <Store className="h-4 w-4" />
                Canteens
              </Link>
              {isStudent && (
                <>
                  <Link href="/orders" className={navLinkClass('/orders')}>
                    <ClipboardList className="h-4 w-4" />
                    My orders
                  </Link>
                  <Link href="/favorites" className={navLinkClass('/favorites')}>
                    <Heart className="h-4 w-4" />
                    Favorites
                  </Link>
                </>
              )}
            </>
          )}
        </nav>

        {/* Right Utility & Account Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {mounted && isConsumer && (
            <>
              {canInstall && (
                <button
                  type="button"
                  onClick={() => promptInstall()}
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent-tint/70 px-3 py-1.5 text-xs font-semibold text-accent hover:bg-accent hover:text-white transition-all cursor-pointer active:scale-95"
                  title="Install Campus Food app for 1-tap ordering"
                  aria-label="Install Campus Food App"
                >
                  <Smartphone className="h-3.5 w-3.5" />
                  <span>Install App</span>
                </button>
              )}

              <Link
                href="/cart"
                className={cn(
                  'relative inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-all',
                  isActive('/cart')
                    ? 'border-accent bg-accent-tint text-accent'
                    : 'border-line bg-surface text-ink hover:border-accent/50 hover:text-accent'
                )}
                aria-label={`Cart${itemCount ? `, ${itemCount} items` : ''}`}
              >
                <ShoppingBag className="h-4 w-4" />
                <span className="hidden sm:inline text-xs font-semibold">Cart</span>
                {itemCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-semibold text-white tabular-nums">
                    {itemCount}
                  </span>
                )}
              </Link>
            </>
          )}

          {!mounted ? (
            <div className="h-9 w-24 rounded-full bg-line/40 animate-pulse" aria-hidden="true" />
          ) : user ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link
                href="/profile"
                className={cn(
                  'inline-flex items-center gap-2 rounded-full border py-1 pl-1 pr-2.5 text-xs font-medium transition-all',
                  isActive('/profile')
                    ? 'border-accent bg-accent-tint text-accent'
                    : 'border-line bg-surface text-ink hover:border-accent/40'
                )}
                title="View and edit your profile"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-white">
                  {initial}
                </span>
                <span className="hidden sm:inline max-w-[96px] truncate">{firstName}</span>
              </Link>

              <button
                type="button"
                onClick={() => handleLogout()}
                className="hidden sm:inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-xs font-medium text-muted transition-colors hover:border-danger/40 hover:bg-red-50 hover:text-danger cursor-pointer"
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Log out</span>
              </button>
            </div>
          ) : (
            <Link href="/login" className="btn btn-primary px-4 py-2 text-xs sm:text-sm">
              Sign in
            </Link>
          )}

          {/* Mobile Menu Toggle */}
          {mounted && (
            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-ink hover:border-accent/40 cursor-pointer"
              aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile Collapsible Navigation Drawer */}
      {mounted && mobileOpen && (
        <div className="md:hidden border-t border-line bg-surface/95 px-4 py-3 animate-fade-in">
          <nav className="flex flex-col gap-1" aria-label="Mobile Navigation">
            {isPartner && (
              <>
                <Link href="/dashboard" className={navLinkClass('/dashboard', true)}>
                  <ClipboardList className="h-4 w-4" />
                  Live Orders
                </Link>
                <Link href="/dashboard/menu" className={navLinkClass('/dashboard/menu')}>
                  <UtensilsCrossed className="h-4 w-4" />
                  Menu
                </Link>
                {(user?.role === 'owner' || user?.permissions?.includes('view_analytics')) && (
                  <Link href="/dashboard/analytics" className={navLinkClass('/dashboard/analytics')}>
                    <BarChart3 className="h-4 w-4" />
                    Analytics
                  </Link>
                )}
                {user?.role === 'owner' && (
                  <>
                    <Link href="/dashboard/canteen" className={navLinkClass('/dashboard/canteen')}>
                      <Store className="h-4 w-4" />
                      Canteen Info
                    </Link>
                    <Link href="/dashboard/team" className={navLinkClass('/dashboard/team')}>
                      <Users className="h-4 w-4" />
                      Team
                    </Link>
                  </>
                )}
              </>
            )}

            {isAdmin && (
              <Link href="/admin" className={navLinkClass('/admin', true)}>
                <ShieldCheck className="h-4 w-4" />
                Admin Console
              </Link>
            )}

            {isConsumer && (
              <>
                <Link href="/canteens" className={navLinkClass('/canteens')}>
                  <Store className="h-4 w-4" />
                  Canteens
                </Link>
                {isStudent && (
                  <>
                    <Link href="/orders" className={navLinkClass('/orders')}>
                      <ClipboardList className="h-4 w-4" />
                      My orders
                    </Link>
                    <Link href="/favorites" className={navLinkClass('/favorites')}>
                      <Heart className="h-4 w-4" />
                      Favorites
                    </Link>
                  </>
                )}
                {canInstall && (
                  <button
                    type="button"
                    onClick={() => promptInstall()}
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-accent hover:bg-accent-tint/50 text-left cursor-pointer"
                  >
                    <Smartphone className="h-4 w-4" />
                    Install App
                  </button>
                )}
              </>
            )}

            {user && (
              <button
                type="button"
                onClick={() => handleLogout()}
                className="mt-2 inline-flex items-center gap-2 rounded-full border border-line px-3 py-2 text-sm font-medium text-danger hover:bg-red-50 cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            )}
          </nav>
        </div>
      )}

      {/* Persistent email verification banner for unverified students */}
      {mounted && user && user.role === 'student' && !user.isVerified && (
        <div className="border-t border-amber-300/40 bg-amber-50/90 px-4 py-2 text-xs text-amber-900">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 shrink-0 text-amber-700" />
              <span>
                Please verify your email (<strong>{user.email}</strong>) to unlock food ordering.
              </span>
            </div>
            <button
              onClick={handleResendVerification}
              disabled={resending || cooldown > 0}
              className="rounded-full bg-amber-200/70 hover:bg-amber-200 px-3 py-1 text-[11px] font-semibold text-amber-950 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {resending ? 'Sending…' : cooldown > 0 ? `Resend link (${cooldown}s)` : 'Resend link'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
