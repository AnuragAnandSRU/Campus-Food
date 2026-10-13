import apiClient from '@/lib/api-client';
import type {
  MenuItem,
  CreateMenuItemDto,
  UpdateMenuItemDto,
} from '../../../shared/src/types/menu.types';
import type { ApiResponse } from '../../../shared/src/types/api.types';

/**
 * Menu API client. Reads are public (student browse); writes hit the protected
 * routes and the server enforces the real rules — the caller only needs to be a
 * signed-in owner/staff of the canteen. On create the server files the item
 * under the actor's OWN canteen regardless of the canteenId we send, so this is
 * safe even though CreateMenuItemDto carries one.
 */
export const menuApi = {
  getByCanteen: async (canteenId: string): Promise<MenuItem[]> => {
    const response = await apiClient.get<ApiResponse<MenuItem[]>>(`/menu/${canteenId}`);
    return response.data.data || [];
  },

  create: async (data: CreateMenuItemDto): Promise<MenuItem> => {
    const response = await apiClient.post<ApiResponse<MenuItem>>('/menu', data);
    return response.data.data!;
  },

  update: async (id: string, data: UpdateMenuItemDto): Promise<MenuItem> => {
    const response = await apiClient.put<ApiResponse<MenuItem>>(`/menu/${id}`, data);
    return response.data.data!;
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/menu/${id}`);
  },

  // Everyday stock lever — any owner/staff of the canteen may flip it, no
  // manage_menu grant needed (the server enforces that).
  setAvailability: async (id: string, isAvailable: boolean): Promise<MenuItem> => {
    const response = await apiClient.patch<ApiResponse<MenuItem>>(
      `/menu/${id}/availability`,
      { isAvailable }
    );
    return response.data.data!;
  },
};
