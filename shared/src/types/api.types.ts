// Common API response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Pagination
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Query filters
export interface MenuFilters {
  category?: string;
  isVeg?: boolean;
  isAvailable?: boolean;
  search?: string;
}

export interface OrderFilters {
  status?: string;
  canteenId?: string;
  studentId?: string;
  startDate?: Date;
  endDate?: Date;
}
