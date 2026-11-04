'use client';

import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useCartStore } from '@/store/cart-store';
import type { Order } from '../../shared/src/types/order.types';

export function useReorder() {
  const router = useRouter();
  const cart = useCartStore();

  const reorder = (order: Order, canteenName?: string) => {
    if (!order.items || order.items.length === 0) {
      toast.error('No items found in this order to reorder.');
      return;
    }

    // If student already has items from another or same canteen, confirm replacement
    if (cart.items.length > 0) {
      const confirmed = window.confirm(
        'Your cart already has items in it. Would you like to clear your current cart and reorder this meal?'
      );
      if (!confirmed) return;
    }

    try {
      cart.clearCart();
      for (const item of order.items) {
        cart.addItem({
          menuItemId: item.menuItemId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          canteenId: order.canteenId,
          canteenName: canteenName || 'Canteen',
        });
      }

      toast.success('Meal reloaded into your cart!');
      router.push('/checkout');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not reorder items';
      toast.error(msg);
    }
  };

  return { reorder };
}
