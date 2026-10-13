import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
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
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        set({ user, token, isAuthenticated: true });
      },
      setUser: (user) => {
        localStorage.setItem('user', JSON.stringify(user));
        set({ user });
      },
      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
