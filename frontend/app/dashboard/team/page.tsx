'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/auth-store';
import { useRequireRole } from '@/lib/use-require-role';
import { SiteHeader } from '@/components/site-header';
import { OwnerStaffManager } from '@/components/dashboard/owner-staff-manager';

/**
 * Owner-only screen to manage their canteen's staff (invite / resend / remove).
 * Staff are bounced to /partner by the role guard; the real UI lives in
 * <OwnerStaffManager>.
 */
export default function OwnerTeamPage() {
  const ready = useRequireRole(['owner'], '/partner');
  const user = useAuthStore((s) => s.user);
  const canteenId = user?.canteenId;

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
      <main className="mx-auto max-w-3xl px-6 py-8">
        <Link href="/dashboard" className="text-sm text-muted transition-colors hover:text-ink">
          ← Back to orders
        </Link>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink">Your team</h1>
        <p className="mt-1 font-light text-muted">
          Invite staff to your canteen, set what they can do, and remove them when they leave.
        </p>

        {ready && canteenId ? (
          <OwnerStaffManager canteenId={canteenId} />
        ) : (
          <div className="mt-6 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card h-20 animate-pulse bg-accent-tint/40" />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
