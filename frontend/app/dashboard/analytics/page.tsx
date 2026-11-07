'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api/analytics';
import { canteenApi } from '@/lib/api/canteen';
import { useAuthStore } from '@/store/auth-store';
import { useRequireRole } from '@/lib/use-require-role';
import { SiteHeader } from '@/components/site-header';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { SalesChart } from '@/components/analytics/sales-chart';
import { HourlyChart } from '@/components/analytics/hourly-chart';
import { PopularItemsCard } from '@/components/analytics/popular-items-card';
import { formatCurrency } from '@/lib/utils';

export default function AnalyticsPage() {
  const ready = useRequireRole(['staff', 'owner', 'admin'], '/partner');
  const user = useAuthStore((s) => s.user);
  const canteenId = user?.canteenId;

  const [days, setDays] = useState<number>(7);

  const timezone =
    typeof Intl !== 'undefined'
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : 'Asia/Kolkata';

  const canView =
    user?.role === 'admin' ||
    user?.role === 'owner' ||
    Boolean(user?.permissions?.includes('view_analytics'));

  const canteenQuery = useQuery({
    queryKey: ['canteen', canteenId],
    queryFn: () => canteenApi.getById(canteenId!),
    enabled: ready && Boolean(canteenId),
  });

  const statsQuery = useQuery({
    queryKey: ['analytics-dashboard', canteenId, timezone],
    queryFn: () => analyticsApi.getDashboardStats(canteenId, timezone),
    enabled: ready && canView && Boolean(canteenId || user?.role === 'admin'),
    refetchInterval: 60000,
  });

  const salesQuery = useQuery({
    queryKey: ['analytics-sales', canteenId, days, timezone],
    queryFn: () => analyticsApi.getSales(days, canteenId, timezone),
    enabled: ready && canView && Boolean(canteenId || user?.role === 'admin'),
  });

  const popularQuery = useQuery({
    queryKey: ['analytics-popular', canteenId, days],
    queryFn: () => analyticsApi.getPopularItems(5, canteenId, days),
    enabled: ready && canView && Boolean(canteenId || user?.role === 'admin'),
  });

  const timelineQuery = useQuery({
    queryKey: ['analytics-timeline', canteenId, days, timezone],
    queryFn: () => analyticsApi.getOrdersTimeline(canteenId, timezone, days),
    enabled: ready && canView && Boolean(canteenId || user?.role === 'admin'),
  });

  function exportCSV() {
    const sales = salesQuery.data || [];
    if (sales.length === 0) return;

    const headers = ['Date', 'Total Orders', 'Revenue (INR)', 'Average Order Value (INR)'];
    const rows = sales.map((s) => [s.date, s.totalOrders, s.totalRevenue, s.averageOrderValue]);
    const csvContent = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const canteenSlug = canteenQuery.data?.name
      ? canteenQuery.data.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')
      : 'canteen';

    // Modern Blob download with UTF-8 BOM for perfect Excel compatibility & unlimited file size
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${canteenSlug}_sales_${days}d_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto max-w-5xl px-6 py-8">
          <div className="h-8 w-48 animate-pulse rounded bg-accent-tint/30" />
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card h-28 animate-pulse bg-accent-tint/20" />
            ))}
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="card h-72 animate-pulse bg-accent-tint/15 lg:col-span-2" />
            <div className="card h-72 animate-pulse bg-accent-tint/15" />
          </div>
        </main>
      </div>
    );
  }

  if (ready && !canView) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto max-w-2xl px-6 py-16 text-center">
          <p className="font-display text-2xl font-semibold text-ink">Permission required</p>
          <p className="mt-2 font-light text-muted">
            You need the <span className="font-mono text-ink">view_analytics</span> permission to access sales reports.
            Ask your canteen owner to enable it in your staff settings.
          </p>
          <Link href="/dashboard" className="btn btn-secondary mt-6 inline-flex">
            Back to Live Orders
          </Link>
        </main>
      </div>
    );
  }

  if (ready && !canteenId && user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto max-w-2xl px-6 py-16 text-center">
          <p className="font-display text-2xl font-semibold text-ink">No Canteen Assigned</p>
          <p className="mt-2 font-light text-muted">
            Your account is not linked to an active canteen yet. Once an administrator assigns your canteen, your sales analytics and live metrics will appear here.
          </p>
          <Link href="/dashboard" className="btn btn-secondary mt-6 inline-flex">
            Go to Dashboard
          </Link>
        </main>
      </div>
    );
  }

  const stats = statsQuery.data;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-6 py-8">
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Analytics' },
          ]}
        />

        {/* Header with Title & Export Actions */}
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
              {canteenQuery.data ? `${canteenQuery.data.name} Analytics` : 'Canteen Analytics'}
            </h1>
            <p className="mt-1 font-light text-muted">
              Live sales performance, daily revenue trends, and kitchen operational metrics.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Days Window Switcher */}
            <div className="flex gap-1 rounded-full bg-surface p-1 ring-1 ring-line">
              {[
                { label: 'Today', value: 1 },
                { label: '7 Days', value: 7 },
                { label: '14 Days', value: 14 },
                { label: '30 Days', value: 30 },
              ].map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => setDays(value)}
                  className={`rounded-full px-3.5 py-1 text-xs font-medium transition-colors ${
                    days === value ? 'bg-accent text-white' : 'text-muted hover:text-ink'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <button
              onClick={exportCSV}
              disabled={!salesQuery.data || salesQuery.data.length === 0}
              className="btn btn-secondary text-xs px-3.5 py-1.5 flex items-center gap-1.5 disabled:opacity-50"
              title="Download CSV export"
            >
              <span>📥</span> Export CSV
            </button>
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="card p-4">
            <span className="text-xs uppercase tracking-wider text-muted font-medium">
              Today&apos;s Revenue
            </span>
            <p className="mt-2 font-display text-2xl font-semibold text-ink">
              {stats ? formatCurrency(stats.todayRevenue) : '—'}
            </p>
            <p className="mt-1 text-xs text-muted">Realized from delivered orders</p>
          </div>

          <div className="card p-4">
            <span className="text-xs uppercase tracking-wider text-muted font-medium">
              Today&apos;s Orders
            </span>
            <p className="mt-2 font-display text-2xl font-semibold text-accent">
              {stats ? `${stats.todayOrders} orders` : '—'}
            </p>
            <p className="mt-1 text-xs text-muted">
              {stats && stats.todayOrders > 0
                ? `${stats.completedOrders} delivered · ${stats.pendingOrders} active`
                : 'Placed since midnight'}
            </p>
          </div>

          <div className="card p-4">
            <span className="text-xs uppercase tracking-wider text-muted font-medium">
              Active In-Kitchen
            </span>
            <p className="mt-2 font-display text-2xl font-semibold text-ink">
              {stats ? `${stats.pendingOrders}` : '—'}
            </p>
            <p className="mt-1 text-xs text-muted">
              {stats?.pendingRevenue ? `~${formatCurrency(stats.pendingRevenue)} in-flight` : 'Needs prep or delivery'}
            </p>
          </div>

          <div className="card p-4">
            <span className="text-xs uppercase tracking-wider text-muted font-medium">
              Avg. Delivery Time
            </span>
            <p className="mt-2 font-display text-2xl font-semibold text-ink">
              {stats && stats.averagePreparationTime > 0 ? `${stats.averagePreparationTime} mins` : '—'}
            </p>
            <p className="mt-1 text-xs text-muted">From order to doorstep</p>
          </div>
        </div>

        {/* Charts & Popular Items Grid */}
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {/* Main Sales Trend Chart (Span 2) */}
          <div className="card p-5 lg:col-span-2">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-ink">Revenue &amp; Sales Trend</h2>
              <span className="badge badge-accent text-[11px]">
                {days === 1 ? 'Today' : `Last ${days} days`}
              </span>
            </div>

            {salesQuery.isLoading ? (
              <div className="h-64 animate-pulse rounded bg-accent-tint/30" />
            ) : salesQuery.data ? (
              <SalesChart data={salesQuery.data} />
            ) : (
              <p className="py-12 text-center text-sm text-muted">Unable to load sales data.</p>
            )}
          </div>

          {/* Popular Menu Items Leaderboard (Span 1) */}
          <div className="card p-5">
            <div className="mb-4">
              <h2 className="font-display text-lg font-semibold text-ink">
                Top Dishes ({days === 1 ? 'Today' : `Last ${days} Days`})
              </h2>
              <p className="text-xs text-muted">Ranked by order count and revenue</p>
            </div>

            {popularQuery.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-14 animate-pulse rounded bg-line" />
                ))}
              </div>
            ) : popularQuery.data ? (
              <PopularItemsCard items={popularQuery.data} />
            ) : (
              <p className="py-8 text-center text-sm text-muted">No menu sales data available.</p>
            )}
          </div>
        </div>

        {/* Peak Ordering Hours Distribution */}
        <div className="card mt-6 p-5">
          <div className="mb-2">
            <h2 className="font-display text-lg font-semibold text-ink">
              24-Hour Kitchen Demand ({days === 1 ? 'Today' : `Last ${days} Days`})
            </h2>
            <p className="text-xs text-muted">
              Order volume breakdown by hour of day (helps plan food prep and kitchen staffing).
            </p>
          </div>

          {timelineQuery.isLoading ? (
            <div className="h-44 animate-pulse rounded bg-accent-tint/30" />
          ) : timelineQuery.data ? (
            <HourlyChart data={timelineQuery.data} />
          ) : (
            <p className="py-8 text-center text-sm text-muted">Unable to load order timeline.</p>
          )}
        </div>
      </main>
    </div>
  );
}
