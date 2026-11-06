import { create } from 'zustand';

export interface CartItem {
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
  activeUserId: string | null;
  addItem: (item: CartItem) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  syncPrice: (menuItemId: string, newPrice: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
  switchUser: (userId: string | null, role?: string) => void;
}

function getStorageKey(userId: string | null): string {
  return userId ? `campus_food_cart_${userId}` : 'campus_food_cart_guest';
}

function readVault(userId: string | null): { items: CartItem[]; canteenId: string | null } {
  if (typeof window === 'undefined') return { items: [], canteenId: null };
  try {
    // Check user-scoped vault first
    const key = getStorageKey(userId);
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.items)) {
        const hasItems = parsed.items.length > 0;
        return {
          items: parsed.items,
          canteenId: hasItems ? (parsed.canteenId ?? null) : null,
        };
      }
    }

    // Backward-compatibility: migrate legacy 'cart-storage' if guest
    if (!userId) {
      const legacy = localStorage.getItem('cart-storage');
      if (legacy) {
        const parsed = JSON.parse(legacy);
        const legacyState = parsed.state || parsed;
        if (Array.isArray(legacyState.items) && legacyState.items.length > 0) {
          localStorage.removeItem('cart-storage');
          return { items: legacyState.items, canteenId: legacyState.canteenId ?? null };
        }
      }
    }
  } catch {
    // Storage read or JSON parse failure fallback
  }
  return { items: [], canteenId: null };
}

function writeVault(userId: string | null, state: { items: CartItem[]; canteenId: string | null }) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(state));
  } catch {
    // Storage quota exceeded or private browsing fallback
  }
}

export const useCartStore = create<CartState>()((set, get) => ({
  items: [],
  canteenId: null,
  activeUserId: null,

  switchUser: (newUserId, role) => {
    // Merchants (staff/owner/admin) do not hold customer shopping carts
    if (role && role !== 'student') {
      set({ items: [], canteenId: null, activeUserId: newUserId });
      return;
    }

    if (newUserId) {
      // Student logged in: load their personal cart vault
      const userVault = readVault(newUserId);
      const guestVault = readVault(null);

      // If student was browsing as a guest with active items, adopt them!
      if (guestVault.items.length > 0) {
        userVault.items = guestVault.items;
        userVault.canteenId = guestVault.canteenId;
        writeVault(null, { items: [], canteenId: null }); // clear guest cart
        writeVault(newUserId, userVault); // save adopted cart to student vault
      }

      set({
        items: userVault.items,
        canteenId: userVault.canteenId,
        activeUserId: newUserId,
      });
    } else {
      // Logged out / Guest mode
      const guestVault = readVault(null);
      set({
        items: guestVault.items,
        canteenId: guestVault.canteenId,
        activeUserId: null,
      });
    }
  },

  addItem: (item) => {
    const { items, canteenId, activeUserId } = get();

    if (!canteenId || canteenId === item.canteenId) {
      const existing = items.find((i) => i.menuItemId === item.menuItemId);
      let nextItems: CartItem[];

      if (existing) {
        nextItems = items.map((i) =>
          i.menuItemId === item.menuItemId ? { ...i, quantity: i.quantity + item.quantity } : i
        );
      } else {
        nextItems = [...items, item];
      }

      const nextState = { items: nextItems, canteenId: item.canteenId };
      writeVault(activeUserId, nextState);
      set(nextState);
    } else {
      throw new Error('Cannot add items from different canteens. Please clear your cart first.');
    }
  },

  removeItem: (menuItemId) => {
    const { items, activeUserId, canteenId } = get();
    const nextItems = items.filter((i) => i.menuItemId !== menuItemId);
    const nextCanteenId = nextItems.length === 0 ? null : canteenId;

    const nextState = { items: nextItems, canteenId: nextCanteenId };
    writeVault(activeUserId, nextState);
    set(nextState);
  },

  updateQuantity: (menuItemId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(menuItemId);
      return;
    }

    const { items, activeUserId, canteenId } = get();
    const nextItems = items.map((i) => (i.menuItemId === menuItemId ? { ...i, quantity } : i));

    const nextState = { items: nextItems, canteenId };
    writeVault(activeUserId, nextState);
    set(nextState);
  },

  syncPrice: (menuItemId, newPrice) => {
    const { items, activeUserId, canteenId } = get();
    const existing = items.find((i) => i.menuItemId === menuItemId);
    if (!existing || existing.price === newPrice) return;

    const nextItems = items.map((i) =>
      i.menuItemId === menuItemId ? { ...i, price: newPrice } : i
    );
    const nextState = { items: nextItems, canteenId };
    writeVault(activeUserId, nextState);
    set(nextState);
  },

  clearCart: () => {
    const { activeUserId } = get();
    const empty = { items: [], canteenId: null };
    writeVault(activeUserId, empty);
    set(empty);
  },

  getTotal: () => {
    return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
  },

  getItemCount: () => {
    return get().items.reduce((count, item) => count + item.quantity, 0);
  },
}));
