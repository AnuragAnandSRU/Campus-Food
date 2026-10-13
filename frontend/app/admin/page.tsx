'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { useRequireRole } from '@/lib/use-require-role';
import { SiteHeader } from '@/components/site-header';
import { CanteenList } from '@/components/admin/canteen-list';
import { TeamList } from '@/components/admin/team-list';
import { CreateCanteenForm } from '@/components/admin/create-canteen-form';
import { ProvisionUserForm } from '@/components/admin/provision-user-form';

/**
 * Platform admin console (Option A account creation). Admins create canteens
 * and provision staff/owner accounts via invitation links. Role-gated to admin.
 */
export default function AdminPage() {
  const ready = useRequireRole(['admin'], '/admin/login');
  const [showCanteenForm, setShowCanteenForm] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);

  const canteensQuery = useQuery({
    queryKey: ['admin-canteens'],
    queryFn: () => adminApi.listCanteens(),
    enabled: ready,
  });
  const usersQuery = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminApi.listUsers(),
    enabled: ready,
  });

  const canteens = canteensQuery.data ?? [];
  const users = usersQuery.data ?? [];
  const noCanteens = ready && !canteensQuery.isLoading && canteens.length === 0;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl space-y-12 px-6 py-8">
        <header>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
            Admin console
          </h1>
          <p className="mt-1 font-light text-muted">
            Manage canteens and provision staff &amp; owner accounts.
          </p>
        </header>

        {/* --- Canteens --- */}
        <section>
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-xl font-semibold text-ink">Canteens</h2>
            {!showCanteenForm && (
              <button
                onClick={() => setShowCanteenForm(true)}
                className="btn btn-primary px-5 py-2 text-sm"
              >
                Add canteen
              </button>
            )}
          </div>

          {showCanteenForm && (
            <div className="card mt-4 p-5 sm:p-6">
              <CreateCanteenForm onDone={() => setShowCanteenForm(false)} />
            </div>
          )}

          <div className="mt-4">
            {!ready || canteensQuery.isLoading ? (
              <ListSkeleton />
            ) : canteensQuery.isError ? (
              <ErrorCard onRetry={() => canteensQuery.refetch()} />
            ) : (
              <CanteenList canteens={canteens} />
            )}
          </div>
        </section>

        {/* --- Team --- */}
        <section>
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-xl font-semibold text-ink">Team</h2>
            {!showInviteForm && (
              <button
                onClick={() => setShowInviteForm(true)}
                disabled={noCanteens}
                title={noCanteens ? 'Create a canteen first' : undefined}
                className="btn btn-primary px-5 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                Invite someone
              </button>
            )}
          </div>

          {noCanteens && (
            <p className="mt-2 text-sm text-muted">
              Add a canteen before inviting staff or owners.
            </p>
          )}

          {showInviteForm && (
            <div className="card mt-4 p-5 sm:p-6">
              <ProvisionUserForm
                canteens={canteens}
                onDone={() => setShowInviteForm(false)}
              />
            </div>
          )}

          <div className="mt-4">
            {!ready || usersQuery.isLoading ? (
              <ListSkeleton />
            ) : usersQuery.isError ? (
              <ErrorCard onRetry={() => usersQuery.refetch()} />
            ) : (
              <TeamList users={users} />
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="card h-20 animate-pulse bg-accent-tint/40" />
      ))}
    </div>
  );
}

function ErrorCard({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="card p-8 text-center">
      <p className="font-display text-lg text-ink">Couldn&apos;t load this</p>
      <button onClick={onRetry} className="btn btn-secondary mt-4">
        Try again
      </button>
    </div>
  );
}
