import apiClient from '@/lib/api-client';
import type { Canteen, CreateCanteenDto, UpdateCanteenDto } from '../../../shared/src/types/canteen.types';
import type { ApiResponse, PaginatedResponse } from '../../../shared/src/types/api.types';

export const canteenApi = {
  getAll: async (): Promise<Canteen[]> => {
    const response = await apiClient.get<ApiResponse<Canteen[]>>('/canteens');
    return response.data.data || [];
  },

  getById: async (id: string): Promise<Canteen> => {
    const response = await apiClient.get<ApiResponse<Canteen>>(`/canteens/${id}`);
    return response.data.data!;
  },

  create: async (data: CreateCanteenDto): Promise<Canteen> => {
    const response = await apiClient.post<ApiResponse<Canteen>>('/canteens', data);
    return response.data.data!;
  },

  update: async (id: string, data: UpdateCanteenDto): Promise<Canteen> => {
    const response = await apiClient.put<ApiResponse<Canteen>>(`/canteens/${id}`, data);
    return response.data.data!;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/canteens/${id}`);
  },
};
