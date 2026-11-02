'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { orderApi } from '@/lib/api/order';
import { canteenApi } from '@/lib/api/canteen';
import { useAuthStore } from '@/store/auth-store';
import { useRequireRole } from '@/lib/use-require-role';
import { useOrderSocket } from '@/lib/use-order-socket';
import { SiteHeader } from '@/components/site-header';
import { StaffOrderCard } from '@/components/orders/staff-order-card';

type Filter = 'active' | 'all';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'active', label: 'Active' },
  { key: 'all', label: 'All' },
];

/**
 * Canteen dashboard for staff/owner: the live order book for their own canteen.
 * Orders stream in over the socket (server auto-joins the canteen room from the
 * user's record); we invalidate the query on each event and also poll every 30s
 * as a safety net in case the socket drops.
 */
export default function DashboardPage() {
  const ready = useRequireRole(['staff', 'owner'], '/partner');
  const user = useAuthStore((s) => s.user);
  const canteenId = user?.canteenId;
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>('active');

  const canteenQuery = useQuery({
    queryKey: ['canteen', canteenId],
    queryFn: () => canteenApi.getById(canteenId!),
    enabled: ready && Boolean(canteenId),
  });

  const ordersQuery = useQuery({
    queryKey: ['canteen-orders', canteenId, filter],
    queryFn: () => orderApi.getCanteenOrders(canteenId!, { status: filter }),
    enabled: ready && Boolean(canteenId),
    refetchInterval: 30000,
  });

  // Invalidate every variant of the order book for this canteen (active + all).
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ['canteen-orders', canteenId] });

  useOrderSocket({
    onNewOrder: (order) => {
      if (order.canteenId !== canteenId) return;
      toast.success('New order received');
      refresh();
    },
    onStatusUpdate: (order) => {
      if (order.canteenId === canteenId) refresh();
    },
  });

  const orders = ordersQuery.data ?? [];

  // A staff/owner without an assigned canteen can't have an order book.
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
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
              {canteenQuery.data?.name ?? 'Order dashboard'}
            </h1>
            <p className="mt-1 font-light text-muted">Live orders for your canteen.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link href="/dashboard/menu" className="btn btn-secondary">
              Manage menu
            </Link>
            {(user?.role === 'owner' || user?.permissions?.includes('view_analytics')) && (
              <Link href="/dashboard/analytics" className="btn btn-secondary">
                Analytics
              </Link>
            )}
            {user?.role === 'owner' && (
              <>
                <Link href="/dashboard/canteen" className="btn btn-secondary">
                  Edit canteen
                </Link>
                <Link href="/dashboard/team" className="btn btn-secondary">
                  Team
                </Link>
              </>
            )}
            <div className="flex gap-1 rounded-full bg-surface p-1 ring-1 ring-line">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                    filter === f.key ? 'bg-accent text-white' : 'text-muted hover:text-ink'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {(!ready || ordersQuery.isLoading) && <GridSkeleton />}

        {ordersQuery.isError && (
          <div className="card mt-6 p-10 text-center">
            <p className="font-display text-lg text-ink">Couldn&apos;t load orders</p>
            <button onClick={() => ordersQuery.refetch()} className="btn btn-secondary mt-4">
              Try again
            </button>
          </div>
        )}

        {ready && !ordersQuery.isLoading && !ordersQuery.isError && orders.length === 0 && (
          <div className="card mt-6 p-10 text-center">
            <p className="font-display text-lg text-ink">
              {filter === 'active' ? 'No active orders' : 'No orders yet'}
            </p>
            <p className="mt-1 font-light text-muted">
              {filter === 'active'
                ? 'New orders will appear here the moment they come in.'
                : 'Orders for your canteen will show up here.'}
            </p>
          </div>
        )}

        {orders.length > 0 && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {orders.map((order) => (
              <StaffOrderCard key={order._id} order={order} onChanged={refresh} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function GridSkeleton() {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="card h-56 animate-pulse bg-accent-tint/40" />
      ))}
    </div>
  );
}
