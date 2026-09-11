import apiClient from '@/lib/api-client';
import type {
  Order,
  CreateOrderDto,
  UpdateOrderStatusDto,
  CancelOrderDto,
} from '../../../shared/src/types/order.types';
import type { ApiResponse, OrderFilters } from '../../../shared/src/types/api.types';

export const orderApi = {
  create: async (data: CreateOrderDto): Promise<Order> => {
    const response = await apiClient.post<ApiResponse<Order>>('/orders', data);
    return response.data.data!;
  },

  getMyOrders: async (): Promise<Order[]> => {
    const response = await apiClient.get<ApiResponse<Order[]>>('/orders/my-orders');
    return response.data.data || [];
  },

  getById: async (id: string): Promise<Order> => {
    const response = await apiClient.get<ApiResponse<Order>>(`/orders/${id}`);
    return response.data.data!;
  },

  getCanteenOrders: async (canteenId: string, filters?: OrderFilters): Promise<Order[]> => {
    const response = await apiClient.get<ApiResponse<Order[]>>(`/orders/canteen/${canteenId}`, {
      params: filters,
    });
    return response.data.data || [];
  },

  updateStatus: async (id: string, data: UpdateOrderStatusDto): Promise<Order> => {
    const response = await apiClient.patch<ApiResponse<Order>>(`/orders/${id}/status`, data);
    return response.data.data!;
  },

  cancel: async (id: string, data: CancelOrderDto): Promise<Order> => {
    const response = await apiClient.post<ApiResponse<Order>>(`/orders/${id}/cancel`, data);
    return response.data.data!;
  },
};
