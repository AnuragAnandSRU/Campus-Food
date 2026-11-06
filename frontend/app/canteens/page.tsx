'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { canteenApi } from '@/lib/api/canteen';
import { SiteHeader } from '@/components/site-header';
import { CanteenCard } from '@/components/browse/canteen-card';

export default function CanteensPage() {
  const [search, setSearch] = useState('');

  const {
    data: canteens,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['canteens'],
    queryFn: canteenApi.getAll,
  });

  const q = search.trim().toLowerCase();
  const filteredCanteens = canteens
    ? canteens.filter((c) => {
        if (!q) return true;
        return (
          c.name.toLowerCase().includes(q) ||
          c.location.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q)
        );
      })
    : [];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-6 py-10">
        <header className="mb-8">
          <span className="badge badge-accent">Campus canteens</span>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink">
            Order from any canteen
          </h1>
          <p className="mt-2 max-w-xl font-light text-muted">
            Fresh food from kitchens across campus, delivered straight to your hostel room.
          </p>
        </header>

        {canteens && canteens.length > 0 && (
          <div className="mb-6 relative max-w-md">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search canteens by name or campus location..."
              className="input w-full pl-9 pr-16 text-sm"
            />
            <span className="absolute left-3 top-2.5 text-xs text-muted" aria-hidden>
              🔍
            </span>
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-2 text-xs text-muted hover:text-ink cursor-pointer bg-line/30 rounded px-1.5 py-0.5"
              >
                Clear
              </button>
            )}
          </div>
        )}

        {isLoading && <SkeletonGrid />}

        {isError && (
          <div className="card p-10 text-center">
            <p className="text-ink">We couldn&apos;t load the canteens just now.</p>
            <button onClick={() => refetch()} className="btn btn-secondary mt-4">
              Try again
            </button>
          </div>
        )}

        {canteens && canteens.length === 0 && (
          <div className="card p-10 text-center">
            <p className="font-display text-lg text-ink">No canteens are open yet</p>
            <p className="mt-1 font-light text-muted">
              Check back soon — kitchens are being set up.
            </p>
          </div>
        )}

        {q && filteredCanteens.length === 0 && !isLoading && (
          <div className="card p-10 text-center">
            <p className="font-display text-lg text-ink">No canteens match &ldquo;{search}&rdquo;</p>
            <button onClick={() => setSearch('')} className="btn btn-secondary mt-4 text-xs">
              Clear search
            </button>
          </div>
        )}

        {filteredCanteens.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCanteens.map((canteen) => (
              <CanteenCard key={canteen._id} canteen={canteen} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="card overflow-hidden">
          <div className="h-40 animate-pulse bg-accent-tint/60" />
          <div className="space-y-3 p-5">
            <div className="h-5 w-2/3 animate-pulse rounded bg-line" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-line" />
            <div className="h-4 w-full animate-pulse rounded bg-line" />
          </div>
        </div>
      ))}
    </div>
  );
}
