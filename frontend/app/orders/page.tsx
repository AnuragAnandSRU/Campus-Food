'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { orderApi } from '@/lib/api/order';
import { canteenApi } from '@/lib/api/canteen';
import { useRequireAuth } from '@/lib/use-require-auth';
import { useOrderSocket } from '@/lib/use-order-socket';
import { useReorder } from '@/lib/use-reorder';
import { SiteHeader } from '@/components/site-header';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { StatusBadge } from '@/components/orders/status-badge';
import { formatCurrency, formatDateTime, formatTime } from '@/lib/utils';
import type { OrderStatus } from '../../../shared/src/types/order.types';

type TabFilter = 'all' | 'active' | 'completed' | 'cancelled';

const ACTIVE_STATUSES: OrderStatus[] = [
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'out_for_delivery',
];

export default function OrdersPage() {
  const ready = useRequireAuth();
  const queryClient = useQueryClient();
  const { reorder } = useReorder();

  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const ordersQuery = useQuery({
    queryKey: ['my-orders'],
    queryFn: orderApi.getMyOrders,
    enabled: ready,
  });

  const canteensQuery = useQuery({
    queryKey: ['canteens'],
    queryFn: canteenApi.getAll,
    enabled: ready,
  });

  // Map canteen IDs to names for quick lookup
  const canteenMap = useMemo(() => {
    const map = new Map<string, string>();
    canteensQuery.data?.forEach((c) => map.set(c._id, c.name));
    return map;
  }, [canteensQuery.data]);

  // Any status change on one of the student's orders refreshes the list.
  useOrderSocket({
    onStatusUpdate: () => queryClient.invalidateQueries({ queryKey: ['my-orders'] }),
  });

  const orders = useMemo(() => ordersQuery.data ?? [], [ordersQuery.data]);

  // Tab counts
  const counts = useMemo(() => {
    let active = 0;
    let completed = 0;
    let cancelled = 0;
    orders.forEach((o) => {
      if (ACTIVE_STATUSES.includes(o.status)) active++;
      else if (o.status === 'delivered') completed++;
      else if (o.status === 'cancelled') cancelled++;
    });
    return { all: orders.length, active, completed, cancelled };
  }, [orders]);

  // Filtered orders based on Tab and Search query
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Tab filter
      if (activeTab === 'active' && !ACTIVE_STATUSES.includes(order.status)) return false;
      if (activeTab === 'completed' && order.status !== 'delivered') return false;
      if (activeTab === 'cancelled' && order.status !== 'cancelled') return false;

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesId = order.orderId.toLowerCase().includes(query);
        const canteenName = (canteenMap.get(order.canteenId) || '').toLowerCase();
        const matchesCanteen = canteenName.includes(query);
        const matchesItems = order.items.some((item) =>
          item.name.toLowerCase().includes(query)
        );
        if (!matchesId && !matchesCanteen && !matchesItems) return false;
      }

      return true;
    });
  }, [orders, activeTab, searchQuery, canteenMap]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6 py-8">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'My Orders' },
          ]}
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
            My orders
          </h1>
          <Link href="/canteens" className="btn btn-secondary text-sm">
            + New Order
          </Link>
        </div>

        {/* Filter Tabs & Search Bar */}
        {orders.length > 0 && (
          <div className="mt-6 space-y-3">
            {/* Tabs */}
            <div className="flex border-b border-line gap-2 overflow-x-auto pb-1 text-sm">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 font-medium rounded-t-md transition-colors cursor-pointer ${
                  activeTab === 'all'
                    ? 'border-b-2 border-accent text-accent font-semibold'
                    : 'text-muted hover:text-ink'
                }`}
              >
                All ({counts.all})
              </button>
              <button
                onClick={() => setActiveTab('active')}
                className={`px-3 py-1.5 font-medium rounded-t-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'active'
                    ? 'border-b-2 border-accent text-accent font-semibold'
                    : 'text-muted hover:text-ink'
                }`}
              >
                Active ({counts.active})
                {counts.active > 0 && (
                  <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`px-3 py-1.5 font-medium rounded-t-md transition-colors cursor-pointer ${
                  activeTab === 'completed'
                    ? 'border-b-2 border-accent text-accent font-semibold'
                    : 'text-muted hover:text-ink'
                }`}
              >
                Completed ({counts.completed})
              </button>
              <button
                onClick={() => setActiveTab('cancelled')}
                className={`px-3 py-1.5 font-medium rounded-t-md transition-colors cursor-pointer ${
                  activeTab === 'cancelled'
                    ? 'border-b-2 border-accent text-accent font-semibold'
                    : 'text-muted hover:text-ink'
                }`}
              >
                Cancelled ({counts.cancelled})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by order ID, dish, or canteen…"
                className="input text-sm pl-9"
              />
              <span className="absolute left-3 top-2.5 text-muted text-sm">🔍</span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-xs text-muted hover:text-ink cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

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

        {ready && !ordersQuery.isLoading && orders.length > 0 && filteredOrders.length === 0 && (
          <div className="card mt-6 p-8 text-center text-muted">
            <p className="text-base font-medium text-ink">No matching orders found</p>
            <p className="text-sm mt-1">Try switching tabs or adjusting your search keyword.</p>
          </div>
        )}

        {filteredOrders.length > 0 && (
          <div className="mt-4 space-y-3">
            {filteredOrders.map((order) => {
              const count = order.items.reduce((n, i) => n + i.quantity, 0);
              const summary = order.items.map((i) => `${i.quantity}× ${i.name}`).join(', ');
              const canteenName = canteenMap.get(order.canteenId) || 'Canteen';
              const isActive = ACTIVE_STATUSES.includes(order.status);

              return (
                <div
                  key={order._id}
                  className={`card p-4 transition-all hover:shadow-md ${
                    isActive ? 'border-accent/40 bg-accent-tint/10' : ''
                  }`}
                >
                  {/* Top Bar: Order ID + Canteen & Status */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/orders/${order._id}`}
                        className="font-mono text-sm font-semibold text-accent hover:underline"
                      >
                        {order.orderId}
                      </Link>
                      <span className="text-xs text-muted">·</span>
                      <span className="text-xs font-medium text-ink/80">{canteenName}</span>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>

                  {/* Middle: Items summary */}
                  <p className="mt-2 line-clamp-1 text-sm text-ink font-normal">
                    <span className="font-medium text-ink/70">
                      {count} {count === 1 ? 'item' : 'items'}:
                    </span>{' '}
                    {summary}
                  </p>

                  {/* Bottom: Date, Price & Actions */}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line/60 pt-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="text-xs text-muted">{formatDateTime(order.createdAt)}</span>
                      <span className="font-display font-semibold text-ink">
                        {formatCurrency(order.totalAmount)}
                      </span>
                      {isActive && order.estimatedDeliveryTime && (
                        <span className="rounded-full bg-accent-tint/60 px-2 py-0.5 text-[11px] font-semibold text-accent ring-1 ring-accent/30 flex items-center gap-1">
                          <span>🕒</span>
                          <span>ETA: {formatTime(order.estimatedDeliveryTime)}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {isActive && order.deliveryPin && (
                        <span
                          className="rounded-lg bg-emerald-50 px-2 py-1 text-xs font-mono font-semibold text-accent ring-1 ring-emerald-200/70"
                          title="Share this PIN with the delivery person"
                        >
                          PIN: {order.deliveryPin}
                        </span>
                      )}
                      <Link
                        href={`/orders/${order._id}`}
                        className="btn btn-secondary px-3 py-1 text-xs"
                      >
                        {isActive ? '📍 Track' : 'Details'}
                      </Link>

                      <button
                        onClick={() => reorder(order, canteenName)}
                        className="btn btn-primary px-3 py-1 text-xs flex items-center gap-1 cursor-pointer"
                        title="Add these dishes to your cart and proceed to checkout"
                      >
                        <span>🔁</span>
                        <span>Reorder</span>
                      </button>
                    </div>
                  </div>
                </div>
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
        <div key={i} className="card h-28 animate-pulse bg-accent-tint/40" />
      ))}
    </div>
  );
}
