'use client';

import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { orderApi } from '@/lib/api/order';
import { useRequireAuth } from '@/lib/use-require-auth';
import { useOrderSocket } from '@/lib/use-order-socket';
import { SiteHeader } from '@/components/site-header';
import { StatusBadge } from '@/components/orders/status-badge';
import { formatCurrency, formatDateTime } from '@/lib/utils';

export default function OrdersPage() {
  const ready = useRequireAuth();
  const queryClient = useQueryClient();

  const ordersQuery = useQuery({
    queryKey: ['my-orders'],
    queryFn: orderApi.getMyOrders,
    enabled: ready,
  });

  // Any status change on one of the student's orders refreshes the list.
  useOrderSocket({
    onStatusUpdate: () => queryClient.invalidateQueries({ queryKey: ['my-orders'] }),
  });

  const orders = ordersQuery.data ?? [];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6 py-8">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">My orders</h1>

        {(!ready || ordersQuery.isLoading) && <ListSkeleton />}

        {ordersQuery.isError && (
          <div className="card mt-6 p-10 text-center">
            <p className="font-display text-lg text-ink">Couldn&apos;t load your orders</p>
            <button onClick={() => ordersQuery.refetch()} className="btn btn-secondary mt-4">
              Try again
            </button>
          </div>
        )}

        {ready && !ordersQuery.isLoading && !ordersQuery.isError && orders.length === 0 && (
          <div className="card mt-6 p-10 text-center">
            <p className="font-display text-lg text-ink">No orders yet</p>
            <p className="mt-1 font-light text-muted">Your past orders will show up here.</p>
            <Link href="/canteens" className="btn btn-primary mt-5">
              Browse canteens
            </Link>
          </div>
        )}

        {orders.length > 0 && (
          <div className="mt-6 space-y-3">
            {orders.map((order) => {
              const count = order.items.reduce((n, i) => n + i.quantity, 0);
              const summary = order.items.map((i) => i.name).join(', ');
              return (
                <Link
                  key={order._id}
                  href={`/orders/${order._id}`}
                  className="card block p-4 transition-shadow hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-mono text-sm text-muted">{order.orderId}</p>
                    <StatusBadge status={order.status} />
                  </div>
                  <p className="mt-2 line-clamp-1 text-sm text-ink">
                    {count} {count === 1 ? 'item' : 'items'} · {summary}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-muted">{formatDateTime(order.createdAt)}</span>
                    <span className="font-display font-semibold text-ink">
                      {formatCurrency(order.totalAmount)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="mt-6 space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="card h-24 animate-pulse bg-accent-tint/40" />
      ))}
    </div>
  );
}
