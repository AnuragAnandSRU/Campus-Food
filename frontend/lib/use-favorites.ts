'use client';

import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth-store';
import { authApi } from '@/lib/api/auth';
import { getApiErrorMessage } from '@/lib/api-client';

export function useFavorites() {
  const user = useAuthStore((s) => s.user);
  const isFavorite = useAuthStore((s) => s.isFavorite);
  const toggleFavoriteLocal = useAuthStore((s) => s.toggleFavoriteLocal);
  const setFavorites = useAuthStore((s) => s.setFavorites);

  const toggle = useCallback(
    async (menuItemId: string, dishName?: string) => {
      if (!user) {
        toast.error('Please sign in to save your favorite dishes! ❤️');
        return;
      }

      if (user.role !== 'student') {
        return;
      }

      // Optimistic local update
      const nowFavorite = toggleFavoriteLocal(menuItemId);
      if (dishName) {
        if (nowFavorite) {
          toast.success(`Saved ${dishName} to favorites! ❤️`);
        } else {
          toast(`Removed ${dishName} from favorites`);
        }
      }

      try {
        const result = await authApi.toggleFavorite(menuItemId);
        if (result.favorites) {
          setFavorites(result.favorites);
        }
      } catch (err) {
        // Rollback on failure
        toggleFavoriteLocal(menuItemId);
        toast.error(getApiErrorMessage(err, 'Failed to update favorites'));
      }
    },
    [user, toggleFavoriteLocal, setFavorites]
  );

  return {
    isFavorite,
    toggle,
    isAuthenticated: Boolean(user),
  };
}
