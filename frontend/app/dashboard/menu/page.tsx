'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/auth-store';
import { useRequireRole } from '@/lib/use-require-role';
import { SiteHeader } from '@/components/site-header';
import { MenuManager } from '@/components/menu/menu-manager';

/**
 * Menu management screen for a canteen's owner/staff (option A: a dedicated page
 * reached from the order dashboard). This wrapper only handles the guard, the
 * canteen lookup and the "who can manage" decision; all the real UI lives in
 * <MenuManager>, so moving it into a dashboard tab later is a one-line change.
 */
export default function MenuManagementPage() {
  const ready = useRequireRole(['staff', 'owner'], '/partner');
  const user = useAuthStore((s) => s.user);
  const canteenId = user?.canteenId;
  // Owners always manage; staff need the manage_menu grant. (Anyone here can
  // still flip availability — that gate lives inside MenuManager.)
  const canManage =
    user?.role === 'owner' || Boolean(user?.permissions?.includes('manage_menu'));

  // A staff/owner with no assigned canteen has no menu to manage.
  if (ready && !canteenId) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto max-w-2xl px-6 py-16 text-center">
          <p className="font-display text-lg text-ink">No canteen assigned</p>
          <p className="mt-1 font-light text-muted">
            Your account isn&apos;t linked to a canteen yet. Ask an admin to assign one.
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-8">
        <Link
          href="/dashboard"
          className="text-sm text-muted transition-colors hover:text-ink"
        >
          ← Back to orders
        </Link>

        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink">
          Menu
        </h1>
        <p className="mt-1 font-light text-muted">
          {canManage
            ? 'Add dishes, update prices, and mark items in or out of stock.'
            : 'Mark items in or out of stock as they run out.'}
        </p>

        {ready && canteenId ? (
          <MenuManager canteenId={canteenId} canManage={canManage} />
        ) : (
          <div className="mt-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card h-20 animate-pulse bg-accent-tint/40" />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
