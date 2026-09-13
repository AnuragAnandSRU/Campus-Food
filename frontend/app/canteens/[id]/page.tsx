'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { canteenApi } from '@/lib/api/canteen';
import { menuApi } from '@/lib/api/menu';
import { SiteHeader } from '@/components/site-header';
import { MenuItemCard } from '@/components/browse/menu-item-card';
import { isCanteenOpen } from '@/lib/utils';

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

  const groups = CATEGORY_ORDER.map((category) => ({
    category,
    items: menu.filter((item) => item.category === category),
  })).filter((group) => group.items.length > 0);

  const open = canteen ? isCanteenOpen(canteen.openingHours) : false;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="mx-auto max-w-4xl px-6 py-8">
        <Link
          href="/canteens"
          className="text-sm font-medium text-muted transition-colors hover:text-ink"
        >
          ← All canteens
        </Link>

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
                  <span className="badge badge-accent text-xs">★ {canteen.rating.toFixed(1)}</span>
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

            {menuQuery.isLoading && <MenuSkeleton />}

            {!menuQuery.isLoading && groups.length === 0 && (
              <div className="card mt-6 p-10 text-center">
                <p className="font-display text-lg text-ink">The menu is empty right now</p>
                <p className="mt-1 font-light text-muted">Dishes will appear here once added.</p>
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
                      <MenuItemCard key={item._id} item={item} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
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
