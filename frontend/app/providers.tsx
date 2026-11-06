'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { authApi } from '@/lib/api/auth';

/**
 * Silent background sync component:
 * When the app mounts in the browser, if an active session exists, it validates the
 * token against the backend and syncs the latest user profile (role, email verification,
 * canteen assignments) without interrupting the user.
 */
function AuthSync() {
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  useEffect(() => {
    if (!isHydrated) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;

    authApi
      .getMe()
      .then((freshUser) => {
        setUser(freshUser);
      })
      .catch((err) => {
        if (err?.response?.status === 401) {
          logout();
        }
      });
  }, [isHydrated, setUser, logout]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthSync />
      {children}
    </QueryClientProvider>
  );
}
