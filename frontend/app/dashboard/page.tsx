'use client';

import { useState, useMemo } from 'react';
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
import { useAudioAlert } from '@/lib/use-audio-alert';

type PrimaryFilter = 'active' | 'all';
type StationFilter = 'all_active' | 'incoming' | 'cooking' | 'dispatch';

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

  const [primaryFilter, setPrimaryFilter] = useState<PrimaryFilter>('active');
  const [stationFilter, setStationFilter] = useState<StationFilter>('all_active');

  const canteenQuery = useQuery({
    queryKey: ['canteen', canteenId],
    queryFn: () => canteenApi.getById(canteenId!),
    enabled: ready && Boolean(canteenId),
  });

  const { soundEnabled, toggleSound, notifyNewOrder } = useAudioAlert(
    canteenQuery.data ? `${canteenQuery.data.name} Dashboard` : 'Live Orders'
  );

  const ordersQuery = useQuery({
    queryKey: ['canteen-orders', canteenId, primaryFilter],
    queryFn: () => orderApi.getCanteenOrders(canteenId!, { status: primaryFilter }),
    enabled: ready && Boolean(canteenId),
    refetchInterval: 30000,
  });

  // Invalidate every variant of the order book for this canteen (active + all).
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ['canteen-orders', canteenId] });

  useOrderSocket({
    onNewOrder: (order) => {
      if (order.canteenId !== canteenId) return;
      notifyNewOrder(order.orderId);
      toast.success(`🔔 New order received (${order.orderId})`);
      refresh();
    },
    onStatusUpdate: (order) => {
      if (order.canteenId === canteenId) refresh();
    },
  });

  const rawOrders = ordersQuery.data ?? [];

  // Compute live station counts
  const stationCounts = useMemo(() => {
    let incoming = 0;
    let cooking = 0;
    let dispatch = 0;
    let activeTotal = 0;

    rawOrders.forEach((o) => {
      if (['pending', 'confirmed'].includes(o.status)) incoming++;
      if (o.status === 'preparing') cooking++;
      if (['ready', 'out_for_delivery'].includes(o.status)) dispatch++;
      if (['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'].includes(o.status)) {
        activeTotal++;
      }
    });

    return { incoming, cooking, dispatch, activeTotal, all: rawOrders.length };
  }, [rawOrders]);

  // Filter orders by active station
  const displayedOrders = useMemo(() => {
    if (primaryFilter === 'all') return rawOrders;

    switch (stationFilter) {
      case 'incoming':
        return rawOrders.filter((o) => ['pending', 'confirmed'].includes(o.status));
      case 'cooking':
        return rawOrders.filter((o) => o.status === 'preparing');
      case 'dispatch':
        return rawOrders.filter((o) => ['ready', 'out_for_delivery'].includes(o.status));
      case 'all_active':
      default:
        return rawOrders.filter((o) =>
          ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'].includes(o.status)
        );
    }
  }, [rawOrders, primaryFilter, stationFilter]);

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
        {/* Top Header & Actions Bar */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
              {canteenQuery.data?.name ?? 'Order dashboard'}
            </h1>
            <p className="mt-1 font-light text-muted">
              Live orders and kitchen dispatch for your campus canteen.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link href="/dashboard/menu" className="btn btn-secondary text-xs">
              Manage menu
            </Link>
            <button
              onClick={toggleSound}
              title={soundEnabled ? 'Kitchen chime is active' : 'Kitchen chime is muted'}
              className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors flex items-center gap-1.5 cursor-pointer ${
                soundEnabled
                  ? 'bg-accent/10 border-accent/30 text-accent hover:bg-accent/20'
                  : 'bg-ink/5 border-line text-muted hover:text-ink'
              }`}
            >
              <span>{soundEnabled ? '🔔' : '🔕'}</span>
              <span>{soundEnabled ? 'Chime On' : 'Muted'}</span>
            </button>
            {(user?.role === 'owner' || user?.permissions?.includes('view_analytics')) && (
              <Link href="/dashboard/analytics" className="btn btn-secondary text-xs">
                Analytics
              </Link>
            )}
            {user?.role === 'owner' && (
              <>
                <Link href="/dashboard/canteen" className="btn btn-secondary text-xs">
                  Edit canteen
                </Link>
                <Link href="/dashboard/team" className="btn btn-secondary text-xs">
                  Team
                </Link>
              </>
            )}

            {/* Primary Mode: Active vs All History */}
            <div className="flex gap-1 rounded-full bg-surface p-1 ring-1 ring-line text-xs">
              <button
                onClick={() => setPrimaryFilter('active')}
                className={`rounded-full px-3 py-1 transition-colors cursor-pointer ${
                  primaryFilter === 'active'
                    ? 'bg-accent text-white font-medium'
                    : 'text-muted hover:text-ink'
                }`}
              >
                Active ({stationCounts.activeTotal})
              </button>
              <button
                onClick={() => setPrimaryFilter('all')}
                className={`rounded-full px-3 py-1 transition-colors cursor-pointer ${
                  primaryFilter === 'all'
                    ? 'bg-accent text-white font-medium'
                    : 'text-muted hover:text-ink'
                }`}
              >
                All History
              </button>
            </div>
          </div>
        </div>

        {/* Station Sub-Filters (Active Mode Only) */}
        {primaryFilter === 'active' && (
          <div className="mt-6 flex flex-wrap items-center gap-2 border-b border-line pb-3 text-xs">
            <span className="text-muted font-medium mr-1">Kitchen Station:</span>
            <button
              onClick={() => setStationFilter('all_active')}
              className={`rounded-lg px-3 py-1.5 font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                stationFilter === 'all_active'
                  ? 'bg-ink text-white'
                  : 'bg-surface border border-line text-muted hover:text-ink'
              }`}
            >
              <span>All Active</span>
              <span className="rounded-full bg-surface/20 px-1.5 py-0.2 text-[10px]">
                {stationCounts.activeTotal}
              </span>
            </button>
            <button
              onClick={() => setStationFilter('incoming')}
              className={`rounded-lg px-3 py-1.5 font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                stationFilter === 'incoming'
                  ? 'bg-amber-600 text-white'
                  : 'bg-surface border border-line text-muted hover:text-ink'
              }`}
            >
              <span>⏳ New / Accept</span>
              <span className="rounded-full bg-surface/20 px-1.5 py-0.2 text-[10px]">
                {stationCounts.incoming}
              </span>
            </button>
            <button
              onClick={() => setStationFilter('cooking')}
              className={`rounded-lg px-3 py-1.5 font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                stationFilter === 'cooking'
                  ? 'bg-blue-600 text-white'
                  : 'bg-surface border border-line text-muted hover:text-ink'
              }`}
            >
              <span>🍳 Cooking</span>
              <span className="rounded-full bg-surface/20 px-1.5 py-0.2 text-[10px]">
                {stationCounts.cooking}
              </span>
            </button>
            <button
              onClick={() => setStationFilter('dispatch')}
              className={`rounded-lg px-3 py-1.5 font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                stationFilter === 'dispatch'
                  ? 'bg-accent text-white'
                  : 'bg-surface border border-line text-muted hover:text-ink'
              }`}
            >
              <span>🛵 Ready & Delivery</span>
              <span className="rounded-full bg-surface/20 px-1.5 py-0.2 text-[10px]">
                {stationCounts.dispatch}
              </span>
            </button>
          </div>
        )}

        {(!ready || ordersQuery.isLoading) && <GridSkeleton />}

        {ordersQuery.isError && (
          <div className="card mt-6 p-10 text-center">
            <p className="font-display text-lg text-ink">Couldn&apos;t load orders</p>
            <button onClick={() => ordersQuery.refetch()} className="btn btn-secondary mt-4">
              Try again
            </button>
          </div>
        )}

        {ready && !ordersQuery.isLoading && !ordersQuery.isError && rawOrders.length === 0 && (
          <div className="card mt-6 p-10 text-center">
            <p className="font-display text-lg text-ink">
              {primaryFilter === 'active' ? 'No active orders' : 'No orders yet'}
            </p>
            <p className="mt-1 font-light text-muted">
              {primaryFilter === 'active'
                ? 'New orders will appear here the moment they come in.'
                : 'Orders for your canteen will show up here.'}
            </p>
          </div>
        )}

        {ready && !ordersQuery.isLoading && rawOrders.length > 0 && displayedOrders.length === 0 && (
          <div className="card mt-6 p-8 text-center text-muted">
            <p className="text-base font-medium text-ink">No orders at this station</p>
            <p className="text-xs mt-1">Select &ldquo;All Active&rdquo; to see all current kitchen orders.</p>
          </div>
        )}

        {displayedOrders.length > 0 && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {displayedOrders.map((order) => (
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
