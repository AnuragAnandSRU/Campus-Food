'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useCartStore } from '@/store/cart-store';
import { SiteHeader } from '@/components/site-header';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { formatCurrency } from '@/lib/utils';

export default function CartPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const total = useCartStore((s) => s.getTotal());

  const canteenName = items[0]?.canteenName;

  function handleClearCart() {
    clearCart();
    toast.success('Cart cleared');
  }

  return (
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

            <div className="mt-6 space-y-3">
              {items.map((item) => (
                <div key={item.menuItemId} className="card flex items-center gap-3.5 p-3.5 sm:p-4">
                  {item.image ? (
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-line bg-surface/50 sm:h-16 sm:w-16">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-line bg-accent-tint text-accent text-lg font-bold sm:h-16 sm:w-16">
                      🍽️
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink">{item.name}</p>
                    <p className="text-sm text-muted">{formatCurrency(item.price)}</p>
                  </div>

                  <div className="inline-flex items-center gap-2.5 rounded-full border border-line px-1">
                    <button
                      onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                      className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
                        item.quantity === 1
                          ? 'text-xs text-muted hover:text-danger hover:bg-red-50'
                          : 'text-lg text-accent hover:bg-accent-tint'
                      }`}
                      aria-label={item.quantity === 1 ? `Remove ${item.name} from cart` : `Reduce ${item.name}`}
                      title={item.quantity === 1 ? 'Remove from cart' : 'Reduce quantity'}
                    >
                      {item.quantity === 1 ? '🗑️' : '−'}
                    </button>
                    <span className="min-w-4 text-center text-sm font-semibold text-ink">
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
                      className="flex h-7 w-7 items-center justify-center rounded-full text-lg text-accent hover:bg-accent-tint transition-colors"
                      aria-label={`Add another ${item.name}`}
                    >
                      +
                    </button>
                  </div>

                  <div className="w-16 sm:w-20 text-right font-medium text-ink text-sm sm:text-base">
                    {formatCurrency(item.price * item.quantity)}
                  </div>
                </div>
              ))}
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
                className="btn btn-primary mt-4 w-full"
              >
                Proceed to checkout
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
  );
}
