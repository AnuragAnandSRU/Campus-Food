'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth-store';
import { disconnectSocket } from '@/lib/socket';

/**
 * Industry-standard logout hook:
 * 1. Disconnects Socket.io WebSocket connections immediately.
 * 2. Purges React Query cache so no user data remains in memory.
 * 3. Wipes auth state and localStorage tokens.
 * 4. Navigates cleanly to the appropriate login door (replace history, no back-forward loop).
 * 5. Shows a clean user feedback toast.
 */
export function useLogout() {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const logout = useAuthStore((s) => s.logout);

  return function handleLogout(redirectPath?: string) {
    disconnectSocket();
    queryClient.clear();
    logout();

    let target = redirectPath;
    if (!target) {
      if (pathname?.startsWith('/admin')) {
        target = '/admin/login';
      } else if (pathname?.startsWith('/dashboard')) {
        target = '/partner';
      } else {
        target = '/login';
      }
    }

    toast.success('Logged out successfully');
    router.replace(target);
  };
}
