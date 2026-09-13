'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import type { MenuItem } from '../../../shared/src/types/menu.types';
import { useCartStore } from '@/store/cart-store';

/**
 * The add / quantity-stepper control for a menu item. Writes to the persisted
 * cart store. Guards against mixing canteens (the store enforces a single-
 * canteen cart) by offering to start a fresh cart. Mount-guarded so the
 * persisted quantity doesn't cause a hydration mismatch.
 */
export function AddToCart({ item, canteenName }: { item: MenuItem; canteenName: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const items = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const clearCart = useCartStore((s) => s.clearCart);

  const qty = mounted ? items.find((i) => i.menuItemId === item._id)?.quantity ?? 0 : 0;

  const payload = {
    menuItemId: item._id,
    name: item.name,
    price: item.price,
    quantity: 1,
    image: item.image,
    canteenId: item.canteenId,
    canteenName,
  };

  function add() {
    try {
      addItem(payload);
    } catch {
      // Cart holds items from a different canteen — offer to start over.
      toast(
        (t) => (
          <div className="flex flex-col gap-2">
            <span className="text-sm text-ink">
              Your cart has items from another canteen.
            </span>
            <div className="flex gap-2">
              <button
                className="btn btn-primary px-3 py-1 text-xs"
                onClick={() => {
                  clearCart();
                  addItem(payload);
                  toast.dismiss(t.id);
                  toast.success(`Started a new cart from ${canteenName}`);
                }}
              >
                Start fresh cart
              </button>
              <button
                className="btn btn-secondary px-3 py-1 text-xs"
                onClick={() => toast.dismiss(t.id)}
              >
                Keep current
              </button>
            </div>
          </div>
        ),
        { duration: 6000 }
      );
    }
  }

  if (!item.isAvailable) return null;

  if (qty === 0) {
    return (
      <button
        onClick={add}
        className="btn btn-secondary px-4 py-1.5 text-sm"
        aria-label={`Add ${item.name} to cart`}
      >
        Add
      </button>
    );
  }

  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-accent px-1">
      <button
        onClick={() => updateQuantity(item._id, qty - 1)}
        className="flex h-7 w-7 items-center justify-center rounded-full text-lg text-accent hover:bg-accent-tint"
        aria-label={`Reduce ${item.name}`}
      >
        −
      </button>
      <span className="min-w-4 text-center text-sm font-semibold text-ink">{qty}</span>
      <button
        onClick={() => updateQuantity(item._id, qty + 1)}
        className="flex h-7 w-7 items-center justify-center rounded-full text-lg text-accent hover:bg-accent-tint"
        aria-label={`Add another ${item.name}`}
      >
        +
      </button>
    </div>
  );
}
