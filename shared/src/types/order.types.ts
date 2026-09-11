export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export type PaymentMethod = 'cash_on_delivery' | 'online';
export type PaymentStatus = 'pending' | 'paid' | 'refunded';

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface DeliveryAddress {
  hostelBlock: string;
  roomNumber: string;
}

export interface Order {
  _id: string;
  orderId: string; // "ORD-20260911-1234"
  studentId: string;
  canteenId: string;
  items: OrderItem[];
  totalAmount: number;
  deliveryAddress: DeliveryAddress;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  specialInstructions?: string;
  estimatedDeliveryTime?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  cancelReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOrderDto {
  canteenId: string;
  items: Array<{
    menuItemId: string;
    quantity: number;
  }>;
  deliveryAddress: DeliveryAddress;
  paymentMethod: PaymentMethod;
  specialInstructions?: string;
}

export interface UpdateOrderStatusDto {
  status: OrderStatus;
  estimatedDeliveryTime?: Date;
}

export interface CancelOrderDto {
  cancelReason: string;
}

// For cart functionality
export interface CartItem {
  menuItem: {
    _id: string;
    name: string;
    price: number;
    image: string;
    preparationTime: number;
  };
  quantity: number;
}
