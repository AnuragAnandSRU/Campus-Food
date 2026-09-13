'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { orderApi } from '@/lib/api/order';
import { canteenApi } from '@/lib/api/canteen';
import { useRequireAuth } from '@/lib/use-require-auth';
import { useOrderSocket } from '@/lib/use-order-socket';
import { SiteHeader } from '@/components/site-header';
import { StatusBadge } from '@/components/orders/status-badge';
import { formatCurrency, formatDateTime } from '@/lib/utils';

export default function OrderDetailPage() {
  const ready = useRequireAuth();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const queryClient = useQueryClient();

  const orderQuery = useQuery({
    queryKey: ['order', id],
    queryFn: () => orderApi.getById(id),
    enabled: ready && Boolean(id),
  });

  // Live status: the student's socket auto-joins their own user room, so a
  // status change (or cancellation) by the canteen refreshes this page.
  useOrderSocket({
    onStatusUpdate: (o) => {
      if (o._id === id) queryClient.invalidateQueries({ queryKey: ['order', id] });
    },
  });

  const order = orderQuery.data;

  const canteenQuery = useQuery({
    queryKey: ['canteen', order?.canteenId],
    queryFn: () => canteenApi.getById(order!.canteenId),
    enabled: Boolean(order?.canteenId),
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6 py-8">
        <Link
          href="/orders"
          className="text-sm font-medium text-muted transition-colors hover:text-ink"
        >
          ← My orders
        </Link>

        {(!ready || orderQuery.isLoading) && <DetailSkeleton />}

        {orderQuery.isError && (
          <div className="card mt-6 p-10 text-center">
            <p className="font-display text-lg text-ink">Order not found</p>
            <p className="mt-1 font-light text-muted">
              It may have been removed, or the link is out of date.
            </p>
            <Link href="/canteens" className="btn btn-secondary mt-4">
              Browse canteens
            </Link>
          </div>
        )}

        {order && (
          <>
            {/* Confirmation banner */}
            <div className="mt-4 flex flex-col items-center text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-2xl text-white">
                ✓
              </span>
              <h1 className="mt-3 font-display text-2xl font-semibold tracking-tight text-ink">
                Order placed
              </h1>
              <p className="mt-1 font-light text-muted">
                We&apos;ve sent it to {canteenQuery.data?.name ?? 'the kitchen'}. Pay cash on
                delivery.
              </p>
            </div>

            {/* Order meta */}
            <div className="card mt-6 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-sm text-muted">{order.orderId}</p>
                  <p className="mt-0.5 text-xs text-muted">{formatDateTime(order.createdAt)}</p>
                </div>
                <StatusBadge status={order.status} />
              </div>

              <div className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
                {order.items.map((item) => (
                  <div key={item.menuItemId} className="flex justify-between">
                    <span className="text-muted">
                      {item.quantity} × {item.name}
                    </span>
                    <span className="text-ink">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex justify-between border-t border-line pt-3">
                <span className="font-medium text-ink">Total</span>
                <span className="font-display text-lg font-semibold text-ink">
                  {formatCurrency(order.totalAmount)}
                </span>
              </div>
            </div>

            {/* Delivery + payment */}
            <div className="card mt-4 space-y-3 p-5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Deliver to</span>
                <span className="text-right text-ink">
                  {order.deliveryAddress.hostelBlock}, Room {order.deliveryAddress.roomNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Payment</span>
                <span className="text-ink">Cash on delivery</span>
              </div>
              {order.estimatedDeliveryTime && (
                <div className="flex justify-between">
                  <span className="text-muted">Estimated by</span>
                  <span className="text-ink">{formatDateTime(order.estimatedDeliveryTime)}</span>
                </div>
              )}
              {order.specialInstructions && (
                <div className="flex justify-between gap-6">
                  <span className="shrink-0 text-muted">Notes</span>
                  <span className="text-right text-ink">{order.specialInstructions}</span>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <Link href="/orders" className="btn btn-secondary flex-1">
                My orders
              </Link>
              <Link href="/canteens" className="btn btn-primary flex-1">
                Order again
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="mt-6 space-y-4">
      <div className="mx-auto h-14 w-14 animate-pulse rounded-full bg-line" />
      <div className="card h-40 animate-pulse bg-accent-tint/40" />
      <div className="card h-24 animate-pulse bg-accent-tint/40" />
    </div>
  );
}
