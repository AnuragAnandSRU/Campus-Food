export interface SalesData {
  date: string;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
}

export interface PopularItem {
  menuItemId: string;
  name: string;
  image: string;
  totalOrders: number;
  totalRevenue: number;
}

export interface OrderTimeline {
  hour: number;
  orderCount: number;
}

export interface DashboardStats {
  todayOrders: number;
  todayRevenue: number;
  pendingOrders: number;
  completedOrders: number;
  averagePreparationTime: number;
  pendingRevenue?: number;
}
