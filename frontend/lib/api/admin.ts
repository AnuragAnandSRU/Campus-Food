import apiClient from '@/lib/api-client';
import type { ApiResponse } from '../../../shared/src/types/api.types';
import type {
  AdminCanteen,
  CreateCanteenDto,
  UpdateCanteenDto,
} from '../../../shared/src/types/canteen.types';
import type {
  ProvisionedUser,
  ProvisionUserDto,
  ProvisionResult,
} from '../../../shared/src/types/user.types';

/**
 * Admin-only console API. Canteen create/update and staff/owner provisioning
 * (invite-link flow). All calls require an admin token — the interceptor in
 * api-client attaches it automatically.
 */
export const adminApi = {
  // --- Canteens ---
  listCanteens: async (): Promise<AdminCanteen[]> => {
    const res = await apiClient.get<ApiResponse<AdminCanteen[]>>('/canteens/admin/all');
    return res.data.data || [];
  },

  createCanteen: async (data: CreateCanteenDto): Promise<AdminCanteen> => {
    const res = await apiClient.post<ApiResponse<AdminCanteen>>('/canteens', data);
    return res.data.data!;
  },

  updateCanteen: async (id: string, data: UpdateCanteenDto): Promise<AdminCanteen> => {
    const res = await apiClient.patch<ApiResponse<AdminCanteen>>(`/canteens/${id}`, data);
    return res.data.data!;
  },

  // --- Staff / owner provisioning ---
  listUsers: async (): Promise<ProvisionedUser[]> => {
    const res = await apiClient.get<ApiResponse<ProvisionedUser[]>>('/users');
    return res.data.data || [];
  },

  provisionUser: async (data: ProvisionUserDto): Promise<ProvisionResult> => {
    const res = await apiClient.post<ApiResponse<ProvisionResult>>('/users', data);
    return res.data.data!;
  },

  resendInvite: async (id: string): Promise<{ inviteLink: string }> => {
    const res = await apiClient.post<ApiResponse<{ inviteLink: string }>>(
      `/users/${id}/resend-invite`
    );
    return res.data.data!;
  },
};
