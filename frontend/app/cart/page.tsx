'use client';

import Link from 'next/link';
import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  Minus,
  Plus,
  Trash2,
  UtensilsCrossed,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useCartStore } from '@/store/cart-store';
import { menuApi } from '@/lib/api/menu';
import { SiteHeader } from '@/components/site-header';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { formatCurrency } from '@/lib/utils';
import { ConsumerRouteGuard } from '@/components/consumer-route-guard';
import { useIsClient } from '@/lib/use-client-state';

export default function CartPage() {
  const mounted = useIsClient();

  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const syncPrice = useCartStore((s) => s.syncPrice);
  const clearCart = useCartStore((s) => s.clearCart);
  const total = useCartStore((s) => s.getTotal());

  const canteenId = items[0]?.canteenId;
  const canteenName = items[0]?.canteenName;

  // Live menu validation to catch price updates or sold-out items
  const menuQuery = useQuery({
    queryKey: ['canteen-menu-cart', canteenId],
    queryFn: () => menuApi.getByCanteen(canteenId!),
    enabled: Boolean(canteenId),
    staleTime: 10000,
  });

  const liveMenu = useMemo(() => menuQuery.data ?? [], [menuQuery.data]);
  const liveMenuMap = useMemo(
    () => new Map(liveMenu.map((m) => [m._id, m])),
    [liveMenu]
  );

  // Silently sync any price updates from the database
  useEffect(() => {
    if (liveMenu.length === 0) return;
    for (const item of items) {
      const live = liveMenuMap.get(item.menuItemId);
      if (live && live.price !== item.price) {
        syncPrice(item.menuItemId, live.price);
      }
    }
  }, [liveMenu, items, liveMenuMap, syncPrice]);

  const unavailableItemIds = useMemo(() => {
    if (!menuQuery.isSuccess) return new Set<string>();
    return new Set(
      items
        .filter((item) => {
          const live = liveMenuMap.get(item.menuItemId);
          return !live || !live.isAvailable;
        })
        .map((i) => i.menuItemId)
    );
  }, [menuQuery.isSuccess, items, liveMenuMap]);

  const hasUnavailableItems = unavailableItemIds.size > 0;

  function handleClearCart() {
    if (confirm('Are you sure you want to clear your cart?')) {
      clearCart();
      toast.success('Cart cleared');
    }
  }

  return (
    <ConsumerRouteGuard>
      <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6 py-8">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Canteens', href: '/canteens' },
            { label: 'Cart' },
          ]}
        />

        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">Your cart</h1>

        {!mounted ? (
          <p className="mt-6 text-muted">Loading…</p>
        ) : items.length === 0 ? (
          <div className="card mt-6 p-10 text-center">
            <p className="font-display text-lg text-ink">Your cart is empty</p>
            <p className="mt-1 font-light text-muted">Add some dishes to get started.</p>
            <Link href="/canteens" className="btn btn-primary mt-5 inline-flex">
              Browse canteens
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-muted">
                From{' '}
                <Link
                  href={`/canteens/${items[0]?.canteenId}`}
                  className="font-medium text-accent hover:underline"
                >
                  {canteenName}
                </Link>
              </p>
              {items[0]?.canteenId && (
                <Link
                  href={`/canteens/${items[0]?.canteenId}`}
                  className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
                >
                  <span>+</span> Add more dishes
                </Link>
              )}
            </div>

            {hasUnavailableItems && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs sm:text-sm text-red-900 flex items-center gap-2.5">
                <AlertTriangle className="h-4 w-4 text-danger shrink-0" />
                <span>
                  Some items in your cart are currently sold out. Please remove them to proceed to checkout.
                </span>
              </div>
            )}

            <div className="mt-6 space-y-3">
              {items.map((item) => {
                const isSoldOut = unavailableItemIds.has(item.menuItemId);
                return (
                  <div
                    key={item.menuItemId}
                    className={`card flex items-center gap-3.5 p-3.5 sm:p-4 ${
                      isSoldOut ? 'border-red-300 bg-red-50/40' : ''
                    }`}
                  >
                    {item.image ? (
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-line bg-surface/50 sm:h-16 sm:w-16">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.image}
                          alt={item.name}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                    ) : (
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-line bg-accent-tint text-accent sm:h-16 sm:w-16">
                        <UtensilsCrossed className="h-6 w-6" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium text-ink">{item.name}</p>
                        {isSoldOut && (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                            Sold out
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted">{formatCurrency(item.price)}</p>
                    </div>

                    <div className="inline-flex items-center gap-2 rounded-full border border-line bg-surface p-0.5">
                      <button
                        onClick={() =>
                          item.quantity === 1 || isSoldOut
                            ? removeItem(item.menuItemId)
                            : updateQuantity(item.menuItemId, item.quantity - 1)
                        }
                        className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors cursor-pointer ${
                          item.quantity === 1 || isSoldOut
                            ? 'text-danger hover:bg-red-50'
                            : 'text-accent hover:bg-accent-tint'
                        }`}
                        aria-label={item.quantity === 1 ? `Remove ${item.name} from cart` : `Reduce ${item.name}`}
                        title={item.quantity === 1 ? 'Remove from cart' : 'Reduce quantity'}
                      >
                        {item.quantity === 1 || isSoldOut ? (
                          <Trash2 className="h-3.5 w-3.5" />
                        ) : (
                          <Minus className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <span className="min-w-4 text-center text-xs sm:text-sm font-semibold text-ink tabular-nums">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => {
                          if (item.quantity >= 50) {
                            toast.error('Maximum 50 per dish allowed');
                            return;
                          }
                          updateQuantity(item.menuItemId, item.quantity + 1);
                        }}
                        disabled={isSoldOut}
                        className="flex h-7 w-7 items-center justify-center rounded-full text-accent hover:bg-accent hover:text-white transition-colors disabled:opacity-40 cursor-pointer"
                        aria-label={`Add another ${item.name}`}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="w-16 sm:w-20 text-right font-medium text-ink text-sm sm:text-base">
                      {formatCurrency(item.price * item.quantity)}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="card mt-6 p-5">
              <div className="flex items-center justify-between">
                <span className="text-muted">Subtotal</span>
                <span className="font-display text-xl font-semibold text-ink">
                  {formatCurrency(total)}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted">Pay with cash when your order arrives.</p>

              <button
                onClick={() => router.push('/checkout')}
                disabled={hasUnavailableItems}
                className="btn btn-primary mt-4 w-full disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {hasUnavailableItems ? 'Remove sold out items to proceed' : 'Proceed to checkout'}
              </button>
              <button
                onClick={handleClearCart}
                className="mt-3 w-full text-sm text-muted transition-colors hover:text-danger cursor-pointer"
              >
                Clear cart
              </button>
            </div>
          </>
        )}
      </main>
      </div>
    </ConsumerRouteGuard>
  );
}
