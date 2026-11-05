import apiClient from '@/lib/api-client';
import type { ApiResponse } from '../../../shared/src/types/api.types';

export const uploadApi = {
  /**
   * Upload an image file directly to AWS S3 via backend API.
   * Returns the permanent public CDN / S3 URL.
   */
  uploadImage: async (file: File, folder: 'dishes' | 'canteens' = 'dishes'): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('folder', folder);

    const response = await apiClient.post<ApiResponse<{ url: string }>>('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.data?.data?.url) {
      throw new Error(response.data?.message || 'Failed to upload image');
    }

    return response.data.data.url;
  },
};

