'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth';
import { useRequireStudent } from '@/lib/use-require-student';
import { useFavorites } from '@/lib/use-favorites';
import { SiteHeader } from '@/components/site-header';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { VegIndicator } from '@/components/browse/veg-indicator';
import { AddToCart } from '@/components/browse/add-to-cart';
import { formatCurrency } from '@/lib/utils';
import type { MenuItem } from '../../../shared/src/types/menu.types';

export default function FavoritesPage() {
  const ready = useRequireStudent();
  const queryClient = useQueryClient();
  const { toggle } = useFavorites();
  const [search, setSearch] = useState('');

  const favoritesQuery = useQuery({
    queryKey: ['my-favorites'],
    queryFn: authApi.getFavorites,
    enabled: ready,
  });

  const favorites = favoritesQuery.data || [];

  const filtered = useMemo(() => {
    if (!search.trim()) return favorites;
    const q = search.toLowerCase().trim();
    return favorites.filter((item) => {
      const matchName = item.name.toLowerCase().includes(q);
      const matchCanteen = (item.canteenId?.name || '').toLowerCase().includes(q);
      const matchCat = (item.category || '').toLowerCase().includes(q);
      return matchName || matchCanteen || matchCat;
    });
  }, [favorites, search]);

  const handleToggle = async (item: MenuItem) => {
    await toggle(item._id, item.name);
    queryClient.invalidateQueries({ queryKey: ['my-favorites'] });
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6 pt-8 pb-24 sm:pb-12">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'My Favorites' },
          ]}
        />

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-ink flex items-center gap-2">
              <span>My Favorites</span>
              <span className="text-2xl">❤️</span>
            </h1>
            <p className="mt-1 text-sm text-muted">
              Your go-to campus dishes saved for fast, 1-tap reordering.
            </p>
          </div>
          <Link href="/canteens" className="btn btn-secondary text-xs">
            + Browse Canteens
          </Link>
        </div>

        {/* Search bar when items exist */}
        {favorites.length > 0 && (
          <div className="mt-6">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your favorite dishes or canteens…"
              className="input text-sm"
            />
          </div>
        )}

        {/* Loading state */}
        {(!ready || favoritesQuery.isLoading) && <ListSkeleton />}

        {/* Error state */}
        {favoritesQuery.isError && (
          <div className="card mt-6 p-10 text-center">
            <p className="font-display text-lg text-ink">Couldn&apos;t load your favorites</p>
            <button onClick={() => favoritesQuery.refetch()} className="btn btn-secondary mt-4">
              Try again
            </button>
          </div>
        )}

        {/* Empty state */}
        {ready && !favoritesQuery.isLoading && !favoritesQuery.isError && favorites.length === 0 && (
          <div className="card mt-6 p-10 text-center">
            <span className="text-4xl">🤍</span>
            <p className="mt-3 font-display text-lg font-semibold text-ink">
              No favorite dishes saved yet
            </p>
            <p className="mt-1 text-sm font-light text-muted max-w-sm mx-auto">
              Explore menus from any campus canteen and tap the ❤️ heart icon to pin your go-to meals here!
            </p>
            <Link href="/canteens" className="btn btn-primary mt-5">
              Browse Canteen Menus
            </Link>
          </div>
        )}

        {/* Filtered empty state */}
        {ready && !favoritesQuery.isLoading && favorites.length > 0 && filtered.length === 0 && (
          <div className="card mt-6 p-8 text-center text-muted">
            <p className="text-base font-medium text-ink">No favorites match &ldquo;{search}&rdquo;</p>
            <button onClick={() => setSearch('')} className="btn btn-secondary mt-3 text-xs">
              Clear search
            </button>
          </div>
        )}

        {/* Favorites list */}
        {filtered.length > 0 && (
          <div className="mt-6 space-y-3">
            {filtered.map((item) => {
              const canteenName = item.canteenId?.name || 'Canteen';
              const canteenId = typeof item.canteenId === 'object' ? item.canteenId?._id : item.canteenId;
              const isAvailable = item.isAvailable;

              // Normalized menuItem for AddToCart
              const normalizedItem: MenuItem = {
                _id: item._id,
                name: item.name,
                description: item.description,
                price: item.price,
                image: item.image,
                category: item.category,
                isVeg: item.isVeg,
                isAvailable: item.isAvailable,
                preparationTime: item.preparationTime,
                canteenId: String(canteenId),
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
              };

              return (
                <div
                  key={item._id}
                  className={`card p-4 transition-all hover:shadow-md ${
                    isAvailable ? '' : 'opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      {/* Top line: Canteen badge + Veg/Non-veg */}
                      <div className="flex items-center gap-2 mb-1.5">
                        <VegIndicator isVeg={item.isVeg} />
                        <Link
                          href={`/canteens/${canteenId}`}
                          className="rounded-full bg-accent-tint px-2.5 py-0.5 text-[11px] font-semibold text-accent hover:underline"
                        >
                          {canteenName}
                        </Link>
                        <span className="text-[11px] text-muted">· {item.category}</span>
                      </div>

                      {/* Dish name + remove heart */}
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-base font-semibold text-ink">
                          {item.name}
                        </h3>
                        <button
                          type="button"
                          onClick={() => handleToggle(normalizedItem)}
                          title="Remove from favorites"
                          className="text-base hover:scale-125 transition-transform cursor-pointer"
                        >
                          ❤️
                        </button>
                      </div>

                      {item.description && (
                        <p className="mt-1 line-clamp-2 text-xs font-light text-muted">
                          {item.description}
                        </p>
                      )}

                      <div className="mt-2 flex items-center gap-3 text-xs text-muted">
                        {item.preparationTime > 0 && <span>⏱ {item.preparationTime} min</span>}
                        {!isAvailable && (
                          <span className="font-medium text-danger">Currently unavailable</span>
                        )}
                      </div>
                    </div>

                    {/* Right side: Price + Add to cart */}
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <span className="font-display text-lg font-semibold text-ink">
                        {formatCurrency(item.price)}
                      </span>
                      <AddToCart item={normalizedItem} canteenName={canteenName} />
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
        <div key={i} className="card h-24 animate-pulse bg-accent-tint/40" />
      ))}
    </div>
  );
}
