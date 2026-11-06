import apiClient from '@/lib/api-client';
import type {
  User,
  RegisterUserDto,
  LoginDto,
  AuthResponse,
  UpdateProfileDto,
  ChangePasswordDto,
} from '../../../shared/src/types/user.types';
import type { PopulatedFavoriteItem } from '../../../shared/src/types/menu.types';

export const authApi = {
  register: async (data: RegisterUserDto): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  login: async (data: LoginDto): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  acceptInvite: async (token: string, password: string): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/accept-invite', {
      token,
      password,
    });
    return response.data;
  },

  verifyEmail: async (token: string): Promise<{ success: boolean; message: string; user?: User; token?: string }> => {
    const response = await apiClient.post('/auth/verify-email', { token });
    return response.data;
  },

  resendVerification: async (): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post('/auth/resend-verification');
    return response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },

  updateProfile: async (data: UpdateProfileDto): Promise<User> => {
    const response = await apiClient.patch<{ success: boolean; data: User }>('/auth/profile', data);
    return response.data.data;
  },

  changePassword: async (data: ChangePasswordDto): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post<{ success: boolean; message: string }>(
      '/auth/change-password',
      data
    );
    return response.data;
  },

  getFavorites: async (): Promise<PopulatedFavoriteItem[]> => {
    const response = await apiClient.get<{ success: boolean; data: PopulatedFavoriteItem[] }>(
      '/auth/favorites'
    );
    return response.data.data || [];
  },

  toggleFavorite: async (
    menuItemId: string
  ): Promise<{ success: boolean; isFavorite: boolean; favorites: string[] }> => {
    const response = await apiClient.post<{
      success: boolean;
      isFavorite: boolean;
      message: string;
      favorites: string[];
    }>(`/auth/favorites/${menuItemId}`);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  forgotPassword: async (email: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (
    token: string,
    password: string
  ): Promise<{ success: boolean; message: string; role?: string }> => {
    const response = await apiClient.post('/auth/reset-password', { token, password });
    return response.data;
  },
};
