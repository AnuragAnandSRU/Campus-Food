'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { canteenApi } from '@/lib/api/canteen';
import { menuApi } from '@/lib/api/menu';
import { SiteHeader } from '@/components/site-header';
import { MenuItemCard } from '@/components/browse/menu-item-card';
import { isCanteenOpen, formatCurrency } from '@/lib/utils';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { useCartStore } from '@/store/cart-store';
import { useAuthStore } from '@/store/auth-store';

const CATEGORY_ORDER = [
  'Breakfast',
  'Lunch',
  'Dinner',
  'Snacks',
  'Beverages',
  'Desserts',
] as const;

export default function CanteenMenuPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const canteenQuery = useQuery({
    queryKey: ['canteen', id],
    queryFn: () => canteenApi.getById(id),
    enabled: Boolean(id),
  });

  const menuQuery = useQuery({
    queryKey: ['menu', id],
    queryFn: () => menuApi.getByCanteen(id),
    enabled: Boolean(id),
  });

  const canteen = canteenQuery.data;
  const menu = menuQuery.data ?? [];

  const [search, setSearch] = useState('');
  const [diet, setDiet] = useState<'all' | 'veg' | 'nonveg'>('all');
  const [category, setCategory] = useState<string>('all');
  const [bannerError, setBannerError] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const user = useAuthStore((s) => s.user);
  const cartItems = useCartStore((s) => s.items);
  const cartCanteenId = useCartStore((s) => s.canteenId);
  const cartTotal = useCartStore((s) => s.getTotal());
  const cartItemCount = useCartStore((s) => s.getItemCount());

  const isConsumer = !user || user.role === 'student';
  const hasCartHere = mounted && isConsumer && cartItems.length > 0 && cartCanteenId === id;

  // Categories that actually have items, in menu order — drives the filter pills.
  const presentCategories = CATEGORY_ORDER.filter((c) => menu.some((i) => i.category === c));

  const query = search.trim().toLowerCase();
  const filtered = menu.filter((item) => {
    if (diet === 'veg' && !item.isVeg) return false;
    if (diet === 'nonveg' && item.isVeg) return false;
    if (category !== 'all' && item.category !== category) return false;
    if (query && !`${item.name} ${item.description}`.toLowerCase().includes(query)) return false;
    return true;
  });

  const groups = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    items: filtered.filter((item) => item.category === cat),
  })).filter((group) => group.items.length > 0);

  const clearFilters = () => {
    setSearch('');
    setDiet('all');
    setCategory('all');
  };

  const open = canteen ? isCanteenOpen(canteen.openingHours) : false;
  const isOrderingAllowed = Boolean(canteen?.isActive && open);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className={`mx-auto max-w-4xl px-6 py-8 ${hasCartHere ? 'pb-24 sm:pb-28' : ''}`}>
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Canteens', href: '/canteens' },
            { label: canteen?.name ?? 'Menu' },
          ]}
        />

        {canteenQuery.isLoading && <HeaderSkeleton />}

        {canteenQuery.isError && (
          <div className="card mt-6 p-10 text-center">
            <p className="font-display text-lg text-ink">Canteen not found</p>
            <p className="mt-1 font-light text-muted">
              It may have closed or the link is out of date.
            </p>
            <Link href="/canteens" className="btn btn-secondary mt-4">
              Back to canteens
            </Link>
          </div>
        )}

        {canteen && (
          <>
            {canteen.image && !bannerError && (
              <div className="relative mt-4 h-44 w-full overflow-hidden rounded-2xl border border-line bg-surface/50 sm:h-56">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={canteen.image}
                  alt={canteen.name}
                  loading="lazy"
                  decoding="async"
                  onError={() => setBannerError(true)}
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <header className="mt-4 border-b border-line pb-6">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
                  {canteen.name}
                </h1>
                <span
                  className={`badge text-xs ${
                    open ? 'bg-accent text-white' : 'bg-ink/70 text-white'
                  }`}
                >
                  {open ? 'Open now' : 'Closed'}
                </span>
                {canteen.rating > 0 && (
                  <span className="badge badge-accent text-xs">
                    ★ {canteen.rating.toFixed(1)}
                    {canteen.totalRatings ? ` (${canteen.totalRatings} reviews)` : ''}
                  </span>
                )}
              </div>

              <p className="mt-2 font-light text-muted">{canteen.description}</p>

              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted">
                <span>📍 {canteen.location}</span>
                <span>
                  🕒 {canteen.openingHours.open}–{canteen.openingHours.close}
                </span>
              </div>
            </header>

            {canteen && !canteen.isActive && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 flex items-center gap-3">
                <span className="text-xl">⚠️</span>
                <div>
                  <p className="font-semibold">This canteen is temporarily offline</p>
                  <p className="text-xs text-red-700 mt-0.5">
                    The kitchen is not taking orders right now. You can browse the menu, but ordering is disabled.
                  </p>
                </div>
              </div>
            )}

            {canteen && canteen.isActive && !open && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 flex items-center gap-3">
                <span className="text-xl">🕒</span>
                <div>
                  <p className="font-semibold">Canteen is currently closed</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Operating hours are {canteen.openingHours.open} to {canteen.openingHours.close}. You can browse dishes, but ordering is paused until opening time.
                  </p>
                </div>
              </div>
            )}

            {menuQuery.isLoading && <MenuSkeleton />}

            {!menuQuery.isLoading && menu.length > 0 && (
              <MenuFilters
                search={search}
                onSearch={setSearch}
                diet={diet}
                onDiet={setDiet}
                category={category}
                onCategory={setCategory}
                categories={presentCategories}
              />
            )}

            {!menuQuery.isLoading && menu.length === 0 && (
              <div className="card mt-6 p-10 text-center">
                <p className="font-display text-lg text-ink">The menu is empty right now</p>
                <p className="mt-1 font-light text-muted">Dishes will appear here once added.</p>
              </div>
            )}

            {!menuQuery.isLoading && menu.length > 0 && groups.length === 0 && (
              <div className="card mt-6 p-10 text-center">
                <p className="font-display text-lg text-ink">No items match your filters</p>
                <button onClick={clearFilters} className="btn btn-secondary mt-4">
                  Clear filters
                </button>
              </div>
            )}

            <div className="mt-6 space-y-8">
              {groups.map((group) => (
                <section key={group.category}>
                  <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-muted">
                    {group.category}
                  </h2>
                  <div className="space-y-3">
                    {group.items.map((item) => (
                      <MenuItemCard key={item._id} item={item} canteenName={canteen.name} isOrderingAllowed={isOrderingAllowed} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Floating Bottom Cart Bar (Appears when student adds dishes) */}
      {hasCartHere && (
        <aside
          aria-label="Cart summary"
          className="fixed bottom-4 left-4 right-4 z-30 mx-auto max-w-2xl animate-fade-in"
        >
          <div className="flex items-center justify-between rounded-2xl bg-accent px-5 py-3.5 text-white shadow-xl shadow-accent/20 border border-accent-hover/30">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-lg">
                🛍️
              </span>
              <div>
                <p className="text-xs uppercase font-medium tracking-wider text-accent-tint">
                  {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'} in cart
                </p>
                <p className="font-display text-lg font-bold">
                  {formatCurrency(cartTotal)}
                </p>
              </div>
            </div>
            <Link
              href="/cart"
              className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-accent shadow-sm hover:bg-surface active:scale-95 transition-all cursor-pointer"
            >
              <span>View Cart</span>
              <span>→</span>
            </Link>
          </div>
        </aside>
      )}
    </div>
  );
}

const DIET_OPTIONS: { key: 'all' | 'veg' | 'nonveg'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'veg', label: 'Veg' },
  { key: 'nonveg', label: 'Non-veg' },
];

function MenuFilters({
  search,
  onSearch,
  diet,
  onDiet,
  category,
  onCategory,
  categories,
}: {
  search: string;
  onSearch: (v: string) => void;
  diet: 'all' | 'veg' | 'nonveg';
  onDiet: (v: 'all' | 'veg' | 'nonveg') => void;
  category: string;
  onCategory: (v: string) => void;
  categories: readonly string[];
}) {
  return (
    <div className="mt-6 space-y-3">
      <input
        type="search"
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Search the menu"
        className="input w-full"
        aria-label="Search the menu"
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-full bg-surface p-1 ring-1 ring-line">
          {DIET_OPTIONS.map((o) => (
            <button
              key={o.key}
              onClick={() => onDiet(o.key)}
              className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                diet === o.key ? 'bg-accent text-white' : 'text-muted hover:text-ink'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>

        {categories.length > 1 && (
          <div className="flex flex-wrap gap-2">
            <CategoryChip
              label="All"
              active={category === 'all'}
              onClick={() => onCategory('all')}
            />
            {categories.map((c) => (
              <CategoryChip
                key={c}
                label={c}
                active={category === c}
                onClick={() => onCategory(c)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-sm ring-1 transition-colors ${
        active
          ? 'bg-accent-tint text-accent ring-accent/30'
          : 'bg-surface text-muted ring-line hover:text-ink'
      }`}
    >
      {label}
    </button>
  );
}

function HeaderSkeleton() {
  return (
    <div className="mt-4 border-b border-line pb-6">
      <div className="h-8 w-1/2 animate-pulse rounded bg-line" />
      <div className="mt-3 h-4 w-3/4 animate-pulse rounded bg-line" />
      <div className="mt-3 h-4 w-1/3 animate-pulse rounded bg-line" />
    </div>
  );
}

function MenuSkeleton() {
  return (
    <div className="mt-6 space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="card h-20 animate-pulse bg-accent-tint/40" />
      ))}
    </div>
  );
}
