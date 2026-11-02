import apiClient from '@/lib/api-client';
import type { ApiResponse } from '../../../shared/src/types/api.types';
import type {
  DashboardStats,
  SalesData,
  PopularItem,
  OrderTimeline,
} from '../../../shared/src/types/analytics.types';

export const analyticsApi = {
  getDashboardStats: async (canteenId?: string): Promise<DashboardStats> => {
    const response = await apiClient.get<ApiResponse<DashboardStats>>('/analytics/dashboard', {
      params: canteenId ? { canteenId } : undefined,
    });
    return response.data.data!;
  },

  getSales: async (days: number = 7, canteenId?: string): Promise<SalesData[]> => {
    const response = await apiClient.get<ApiResponse<SalesData[]>>('/analytics/sales', {
      params: { days, ...(canteenId ? { canteenId } : {}) },
    });
    return response.data.data || [];
  },

  getPopularItems: async (limit: number = 5, canteenId?: string): Promise<PopularItem[]> => {
    const response = await apiClient.get<ApiResponse<PopularItem[]>>('/analytics/popular-items', {
      params: { limit, ...(canteenId ? { canteenId } : {}) },
    });
    return response.data.data || [];
  },

  getOrdersTimeline: async (canteenId?: string): Promise<OrderTimeline[]> => {
    const response = await apiClient.get<ApiResponse<OrderTimeline[]>>(
      '/analytics/orders-timeline',
      {
        params: canteenId ? { canteenId } : undefined,
      }
    );
    return response.data.data || [];
  },
};
