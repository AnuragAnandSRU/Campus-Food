import apiClient from '@/lib/api-client';
import type { ApiResponse } from '../../../shared/src/types/api.types';
import type {
  DashboardStats,
  SalesData,
  PopularItem,
  OrderTimeline,
} from '../../../shared/src/types/analytics.types';

export const analyticsApi = {
  getDashboardStats: async (canteenId?: string, timezone?: string): Promise<DashboardStats> => {
    const response = await apiClient.get<ApiResponse<DashboardStats>>('/analytics/dashboard', {
      params: {
        ...(canteenId ? { canteenId } : {}),
        ...(timezone ? { timezone } : {}),
      },
    });
    return response.data.data!;
  },

  getSales: async (days: number = 7, canteenId?: string, timezone?: string): Promise<SalesData[]> => {
    const response = await apiClient.get<ApiResponse<SalesData[]>>('/analytics/sales', {
      params: {
        days,
        ...(canteenId ? { canteenId } : {}),
        ...(timezone ? { timezone } : {}),
      },
    });
    return response.data.data || [];
  },

  getPopularItems: async (limit: number = 5, canteenId?: string, days?: number): Promise<PopularItem[]> => {
    const response = await apiClient.get<ApiResponse<PopularItem[]>>('/analytics/popular-items', {
      params: {
        limit,
        ...(canteenId ? { canteenId } : {}),
        ...(days ? { days } : {}),
      },
    });
    return response.data.data || [];
  },

  getOrdersTimeline: async (canteenId?: string, timezone?: string): Promise<OrderTimeline[]> => {
    const response = await apiClient.get<ApiResponse<OrderTimeline[]>>(
      '/analytics/orders-timeline',
      {
        params: {
          ...(canteenId ? { canteenId } : {}),
          ...(timezone ? { timezone } : {}),
        },
      }
    );
    return response.data.data || [];
  },
};
