'use client';

import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth-store';
import { useCartStore } from '@/store/cart-store';
import { disconnectSocket } from '@/lib/socket';
import { getRoleLoginPath, readStoredAuth } from '@/lib/role-routing';

/**
 * Industry-standard logout hook:
 * 1. Captures the authenticated role BEFORE wiping auth state.
 * 2. Disconnects Socket.io and clears React Query / cart / auth caches.
 * 3. Always routes back to the role's dedicated sign-in door
 *    (admin -> /admin/login, owner/staff -> /partner, student -> /login).
 */
export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const logout = useAuthStore((s) => s.logout);

  return function handleLogout(redirectPath?: string) {
    const role = readStoredAuth().user?.role;

    disconnectSocket();
    queryClient.clear();
    useCartStore.getState().switchUser(null);
    logout();

    const target = redirectPath || getRoleLoginPath(role);

    toast.success('Logged out successfully');
    router.replace(target);
  };
}

