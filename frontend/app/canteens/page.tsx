'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Sparkles, X } from 'lucide-react';
import { canteenApi } from '@/lib/api/canteen';
import { SiteHeader } from '@/components/site-header';
import { CanteenCard } from '@/components/browse/canteen-card';
import { ConsumerRouteGuard } from '@/components/consumer-route-guard';
import { isCanteenOpen } from '@/lib/utils';

type FilterTab = 'all' | 'open' | 'top_rated';

export default function CanteensPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterTab>('all');

  const {
    data: canteens,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['canteens'],
    queryFn: canteenApi.getAll,
  });

  const counts = useMemo(() => {
    const list = canteens || [];
    let open = 0;
    let topRated = 0;
    list.forEach((c) => {
      if (c.isActive && isCanteenOpen(c.openingHours)) open++;
      if (c.rating >= 4.0) topRated++;
    });
    return { all: list.length, open, topRated };
  }, [canteens]);

  const q = search.trim().toLowerCase();
  const filteredCanteens = useMemo(() => {
    if (!canteens) return [];
    return canteens.filter((c) => {
      if (filter === 'open' && (!c.isActive || !isCanteenOpen(c.openingHours))) {
        return false;
      }
      if (filter === 'top_rated' && c.rating < 4.0) {
        return false;
      }

      if (q) {
        const matchesName = c.name.toLowerCase().includes(q);
        const matchesLoc = c.location.toLowerCase().includes(q);
        const matchesDesc = c.description?.toLowerCase().includes(q);
        if (!matchesName && !matchesLoc && !matchesDesc) return false;
      }

      return true;
    });
  }, [canteens, filter, q]);

  return (
    <ConsumerRouteGuard>
      <div className="min-h-screen bg-background">
        <SiteHeader />

        <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10">
          <header className="mb-8">
            <span className="badge badge-accent">
              <Sparkles className="h-3 w-3" />
              Campus canteens
            </span>
            <h1 className="mt-3 font-display text-3xl sm:text-4xl font-semibold tracking-tight text-ink">
              Order from any canteen
            </h1>
            <p className="mt-2 max-w-xl font-light text-muted text-sm sm:text-base">
              Fresh food from kitchens across campus, delivered straight to your hostel room.
            </p>
          </header>

          {/* Search & Quick Filter Pills */}
          {canteens && canteens.length > 0 && (
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <span className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-muted">
                  <Search className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search canteens by name or location…"
                  className="input pl-10 pr-10 text-sm"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute inset-y-0 right-3 flex items-center text-muted hover:text-ink cursor-pointer"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1 rounded-2xl bg-surface p-1 border border-line">
                <button
                  type="button"
                  onClick={() => setFilter('all')}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                    filter === 'all'
                      ? 'bg-accent text-white shadow-xs'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  All ({counts.all})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('open')}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                    filter === 'open'
                      ? 'bg-accent text-white shadow-xs'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  Open Now ({counts.open})
                </button>
                <button
                  type="button"
                  onClick={() => setFilter('top_rated')}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                    filter === 'top_rated'
                      ? 'bg-accent text-white shadow-xs'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  Top Rated ({counts.topRated})
                </button>
              </div>
            </div>
          )}

          {isLoading && <SkeletonGrid />}

          {isError && (
            <div className="card p-10 text-center max-w-md mx-auto">
              <p className="text-ink font-semibold">We couldn&apos;t load the canteens just now.</p>
              <p className="text-xs text-muted mt-1">Please check your network connection.</p>
              <button onClick={() => refetch()} className="btn btn-secondary mt-4 text-xs">
                Try again
              </button>
            </div>
          )}

          {!isLoading && !isError && canteens && canteens.length === 0 && (
            <div className="card p-12 text-center max-w-md mx-auto">
              <p className="font-display text-xl text-ink">No canteens open yet</p>
              <p className="mt-1 font-light text-muted text-sm">
                Check back soon — kitchens are being set up.
              </p>
            </div>
          )}

          {!isLoading && !isError && canteens && canteens.length > 0 && filteredCanteens.length === 0 && (
            <div className="card p-10 text-center max-w-md mx-auto text-muted">
              <p className="font-display text-lg font-semibold text-ink">No matching canteens found</p>
              <p className="text-xs mt-1">Try adjusting your search query or reset filter pills.</p>
              <button
                onClick={() => {
                  setSearch('');
                  setFilter('all');
                }}
                className="btn btn-secondary mt-4 text-xs"
              >
                Reset Filters
              </button>
            </div>
          )}

          {!isLoading && !isError && filteredCanteens.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCanteens.map((canteen) => (
                <CanteenCard key={canteen._id} canteen={canteen} />
              ))}
            </div>
          )}
        </main>
      </div>
    </ConsumerRouteGuard>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="card overflow-hidden">
          <div className="h-44 skeleton-shimmer" />
          <div className="space-y-3 p-5">
            <div className="h-5 w-2/3 skeleton-shimmer rounded" />
            <div className="h-4 w-1/2 skeleton-shimmer rounded" />
            <div className="h-4 w-full skeleton-shimmer rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
