import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  canteenId: string;
  canteenName: string;
}

interface CartState {
  items: CartItem[];
  canteenId: string | null;
  addItem: (item: CartItem) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      canteenId: null,

      addItem: (item) => {
        const { items, canteenId } = get();

        // If cart is empty or same canteen, add item
        if (!canteenId || canteenId === item.canteenId) {
          const existingItem = items.find((i) => i.menuItemId === item.menuItemId);

          if (existingItem) {
            // Update quantity
            set({
              items: items.map((i) =>
                i.menuItemId === item.menuItemId
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
            });
          } else {
            // Add new item
            set({
              items: [...items, item],
              canteenId: item.canteenId,
            });
          }
        } else {
          // Different canteen - ask user to clear cart
          throw new Error('Cannot add items from different canteens. Please clear your cart first.');
        }
      },

      removeItem: (menuItemId) => {
        const { items } = get();
        const newItems = items.filter((i) => i.menuItemId !== menuItemId);
        set({
          items: newItems,
          canteenId: newItems.length === 0 ? null : get().canteenId,
        });
      },

      updateQuantity: (menuItemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(menuItemId);
          return;
        }

        set({
          items: get().items.map((i) =>
            i.menuItemId === menuItemId ? { ...i, quantity } : i
          ),
        });
      },

      clearCart: () => {
        set({ items: [], canteenId: null });
      },

      getTotal: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);
