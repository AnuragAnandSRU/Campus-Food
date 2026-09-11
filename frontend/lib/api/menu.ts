import apiClient from '@/lib/api-client';
import type { MenuItem, CreateMenuItemDto, UpdateMenuItemDto } from '../../../shared/src/types/menu.types';
import type { ApiResponse, MenuFilters } from '../../../shared/src/types/api.types';

export const menuApi = {
  getByCanteen: async (canteenId: string, filters?: MenuFilters): Promise<MenuItem[]> => {
    const response = await apiClient.get<ApiResponse<MenuItem[]>>(`/menu/${canteenId}`, {
      params: filters,
    });
    return response.data.data || [];
  },

  getById: async (id: string): Promise<MenuItem> => {
    const response = await apiClient.get<ApiResponse<MenuItem>>(`/menu/item/${id}`);
    return response.data.data!;
  },

  create: async (data: CreateMenuItemDto): Promise<MenuItem> => {
    const response = await apiClient.post<ApiResponse<MenuItem>>('/menu', data);
    return response.data.data!;
  },

  update: async (id: string, data: UpdateMenuItemDto): Promise<MenuItem> => {
    const response = await apiClient.put<ApiResponse<MenuItem>>(`/menu/${id}`, data);
    return response.data.data!;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/menu/${id}`);
  },

  toggleAvailability: async (id: string, isAvailable: boolean): Promise<MenuItem> => {
    const response = await apiClient.patch<ApiResponse<MenuItem>>(`/menu/${id}/availability`, {
      isAvailable,
    });
    return response.data.data!;
  },
};
