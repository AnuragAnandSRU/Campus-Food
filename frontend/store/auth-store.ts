import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useCartStore } from './cart-store';

export interface User {
  _id: string;
  email: string;
  name: string;
  role: 'student' | 'staff' | 'owner' | 'admin';
  phone: string;
  hostelBlock?: string;
  roomNumber?: string;
  canteenId?: string;
  staffDuties?: ('kitchen' | 'delivery')[];
  permissions?: ('manage_menu' | 'view_analytics')[];
  isVerified: boolean;
  isActive?: boolean;
  createdAt?: Date | string;
  favorites?: string[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  setAuth: (user: User, token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  setHydrated: (isHydrated: boolean) => void;
  isFavorite: (menuItemId: string) => boolean;
  setFavorites: (favorites: string[]) => void;
  toggleFavoriteLocal: (menuItemId: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isHydrated: false,
      setAuth: (user, token) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
        }
        useCartStore.getState().switchUser(user._id, user.role);
        set({ user, token, isAuthenticated: true, isHydrated: true });
      },
      setUser: (user) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(user));
        }
        set({ user });
      },
      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('auth-storage');
        }
        useCartStore.getState().switchUser(null);
        set({ user: null, token: null, isAuthenticated: false, isHydrated: true });
      },
      setHydrated: (isHydrated) => set({ isHydrated }),
      isFavorite: (menuItemId: string) => {
        const { user } = get();
        return Boolean(user?.favorites?.includes(menuItemId));
      },
      setFavorites: (favorites: string[]) => {
        const { user } = get();
        if (!user) return;
        const updated = { ...user, favorites };
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(updated));
        }
        set({ user: updated });
      },
      toggleFavoriteLocal: (menuItemId: string) => {
        const { user } = get();
        if (!user) return false;
        const current = user.favorites || [];
        const exists = current.includes(menuItemId);
        const next = exists ? current.filter((id) => id !== menuItemId) : [...current, menuItemId];
        const updated = { ...user, favorites: next };
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(updated));
        }
        set({ user: updated });
        return !exists;
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHydrated(true);
          if (state.user) {
            useCartStore.getState().switchUser(state.user._id, state.user.role);
          } else {
            useCartStore.getState().switchUser(null);
          }
        }
      },
    }
  )
);
