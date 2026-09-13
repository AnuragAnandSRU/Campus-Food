'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cart-store';
import { SiteHeader } from '@/components/site-header';
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

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6 py-8">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">Your cart</h1>

        {!mounted ? (
          <p className="mt-6 text-muted">Loading…</p>
        ) : items.length === 0 ? (
          <div className="card mt-6 p-10 text-center">
            <p className="font-display text-lg text-ink">Your cart is empty</p>
            <p className="mt-1 font-light text-muted">Add some dishes to get started.</p>
            <Link href="/canteens" className="btn btn-primary mt-5">
              Browse canteens
            </Link>
          </div>
        ) : (
          <>
            <p className="mt-1 text-sm text-muted">
              From <span className="font-medium text-ink">{canteenName}</span>
            </p>

            <div className="mt-6 space-y-3">
              {items.map((item) => (
                <div key={item.menuItemId} className="card flex items-center gap-4 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink">{item.name}</p>
                    <p className="text-sm text-muted">{formatCurrency(item.price)}</p>
                  </div>

                  <div className="inline-flex items-center gap-3 rounded-full border border-line px-1">
                    <button
                      onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-lg text-accent hover:bg-accent-tint"
                      aria-label={`Reduce ${item.name}`}
                    >
                      −
                    </button>
                    <span className="min-w-4 text-center text-sm font-semibold text-ink">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-lg text-accent hover:bg-accent-tint"
                      aria-label={`Add another ${item.name}`}
                    >
                      +
                    </button>
                  </div>

                  <div className="w-20 text-right font-medium text-ink">
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
                onClick={clearCart}
                className="mt-3 w-full text-sm text-muted transition-colors hover:text-danger"
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
