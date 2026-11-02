'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth-store';
import { useRequireRole } from '@/lib/use-require-role';
import { canteenApi } from '@/lib/api/canteen';
import { SiteHeader } from '@/components/site-header';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { OwnerCanteenForm } from '@/components/dashboard/owner-canteen-form';

/**
 * Owner-only screen to edit their own canteen. Staff are bounced to /partner by
 * the role guard; the real form lives in <OwnerCanteenForm>.
 */
export default function OwnerCanteenPage() {
  const ready = useRequireRole(['owner'], '/partner');
  const user = useAuthStore((s) => s.user);
  const canteenId = user?.canteenId;

  const canteenQuery = useQuery({
    queryKey: ['canteen', canteenId],
    queryFn: () => canteenApi.getById(canteenId!),
    enabled: ready && Boolean(canteenId),
  });

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
      <main className="mx-auto max-w-2xl px-6 py-8">
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Your Canteen' },
          ]}
        />
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink">Your canteen</h1>
        <p className="mt-1 font-light text-muted">
          Update your canteen&apos;s details and opening hours.
        </p>

        {(!ready || canteenQuery.isLoading) && <FormSkeleton />}

        {canteenQuery.isError && (
          <div className="card mt-6 p-10 text-center">
            <p className="font-display text-lg text-ink">Couldn&apos;t load your canteen</p>
            <button onClick={() => canteenQuery.refetch()} className="btn btn-secondary mt-4">
              Try again
            </button>
          </div>
        )}

        {canteenQuery.data && <OwnerCanteenForm canteen={canteenQuery.data} />}
      </main>
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="mt-6 space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="card h-14 animate-pulse bg-accent-tint/40" />
      ))}
    </div>
  );
}
