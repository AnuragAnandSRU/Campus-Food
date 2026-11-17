'use client';

import { Minus, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { MenuItem } from '../../../shared/src/types/menu.types';
import { useCartStore } from '@/store/cart-store';
import { useAuthStore } from '@/store/auth-store';
import { useIsClient } from '@/lib/use-client-state';

/**
 * The add / quantity-stepper control for a menu item. Writes to the persisted
 * cart store. Guards against mixing canteens (the store enforces a single-
 * canteen cart) by offering to start a fresh cart.
 * Only rendered for students and guests — hidden for canteen owners/staff/admins.
 */
export function AddToCart({ item, canteenName }: { item: MenuItem; canteenName: string }) {
  const mounted = useIsClient();

  const user = useAuthStore((s) => s.user);
  const items = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const clearCart = useCartStore((s) => s.clearCart);

  // Canteen staff, owners, and admins do not place customer orders.
  if (mounted && user && (user.role === 'staff' || user.role === 'owner' || user.role === 'admin')) {
    return null;
  }

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
            <span className="text-sm text-ink font-medium">
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
        className="btn btn-secondary px-4 py-1.5 text-xs sm:text-sm font-semibold shadow-xs hover:border-accent hover:text-accent"
        aria-label={`Add ${item.name} to cart`}
      >
        <span>+ Add</span>
      </button>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-accent bg-accent-tint/30 p-0.5 shadow-xs">
      <button
        onClick={() => updateQuantity(item._id, qty - 1)}
        className="flex h-7 w-7 items-center justify-center rounded-full text-accent hover:bg-accent hover:text-white transition-colors cursor-pointer"
        aria-label={qty === 1 ? `Remove ${item.name} from cart` : `Reduce ${item.name}`}
        title={qty === 1 ? 'Remove from cart' : 'Reduce quantity'}
      >
        {qty === 1 ? <Trash2 className="h-3.5 w-3.5 text-danger" /> : <Minus className="h-3.5 w-3.5" />}
      </button>
      <span className="min-w-4 text-center text-xs sm:text-sm font-bold text-ink tabular-nums">
        {qty}
      </span>
      <button
        onClick={() => {
          if (qty >= 50) {
            toast.error('Maximum 50 per dish allowed');
            return;
          }
          updateQuantity(item._id, qty + 1);
        }}
        className="flex h-7 w-7 items-center justify-center rounded-full text-accent hover:bg-accent hover:text-white transition-colors cursor-pointer"
        aria-label={`Add another ${item.name}`}
        title="Increase quantity"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
