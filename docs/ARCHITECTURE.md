# System Architecture

## High-Level Overview

```
┌─────────────────┐
│  Student App    │ (Next.js PWA - Mobile First)
│  (Vercel)       │
└────────┬────────┘
         │
         │ REST API + WebSocket
         ↓
┌─────────────────┐
│  API Gateway    │
│  + Socket.io    │
└────────┬────────┘
         │
    ┌────┴────┬──────────┬──────────┐
    ↓         ↓          ↓          ↓
┌─────┐  ┌──────┐  ┌──────┐  ┌──────┐
│Auth │  │Order │  │Menu  │  │User  │
│Svc  │  │Svc   │  │Svc   │  │Svc   │
└─────┘  └──────┘  └──────┘  └──────┘
           │          │          │
           └──────────┴──────────┘
                     │
              ┌──────┴──────┐
              ↓             ↓
         ┌─────────┐   ┌──────┐
         │MongoDB  │   │AWS S3│
         │Atlas    │   │Images│
         └─────────┘   └──────┘
```

## User Roles

### 1. Student
- Browse canteens and menus
- Place orders
- Track delivery status
- View order history

### 2. Cafeteria Staff
- View incoming orders
- Update order status
- Manage daily menu availability
- Mark items out of stock

### 3. Canteen Owner (Admin)
- Full menu CRUD operations
- Pricing management
- Sales analytics
- Staff management

### 4. Super Admin (Optional - Future)
- Platform-wide oversight
- Multi-canteen analytics
- Commission management

## Data Models

### User
```typescript
{
  _id: ObjectId
  email: string              // College email
  name: string
  role: 'student' | 'staff' | 'owner'
  phone: string
  hostelBlock?: string       // For students
  roomNumber?: string
  canteenId?: ObjectId       // For staff/owners
  isVerified: boolean
  createdAt: Date
}
```

### Canteen
```typescript
{
  _id: ObjectId
  name: string
  description: string
  location: string
  image: string              // S3 URL
  ownerId: ObjectId
  openingHours: {
    open: string             // "07:00"
    close: string            // "22:00"
  }
  isActive: boolean
  rating: number
  totalOrders: number
  createdAt: Date
}
```

### MenuItem
```typescript
{
  _id: ObjectId
  canteenId: ObjectId
  name: string
  description: string
  price: number
  image: string              // S3 URL
  category: string           // "Breakfast", "Lunch", "Snacks", "Beverages"
  isVeg: boolean
  isAvailable: boolean
  preparationTime: number    // minutes
  createdAt: Date
  updatedAt: Date
}
```

### Order
```typescript
{
  _id: ObjectId
  orderId: string            // "ORD-20260911-1234"
  studentId: ObjectId
  canteenId: ObjectId
  items: [{
    menuItemId: ObjectId
    name: string
    price: number
    quantity: number
  }]
  totalAmount: number
  deliveryAddress: {
    hostelBlock: string
    roomNumber: string
  }
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled'
  paymentMethod: 'cash_on_delivery' | 'online'  // 'online' for future
  paymentStatus: 'pending' | 'paid'
  specialInstructions?: string
  estimatedDeliveryTime?: Date
  deliveredAt?: Date
  cancelledAt?: Date
  cancelReason?: string
  createdAt: Date
  updatedAt: Date
}
```

## API Structure

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/verify-email` - Email verification
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Canteens
- `GET /api/canteens` - List all active canteens
- `GET /api/canteens/:id` - Get canteen details
- `GET /api/canteens/:id/menu` - Get canteen menu
- `POST /api/canteens` - Create canteen (admin)
- `PUT /api/canteens/:id` - Update canteen (owner)

### Menu
- `GET /api/menu/:canteenId` - Get menu items
- `POST /api/menu` - Add menu item (owner)
- `PUT /api/menu/:id` - Update menu item (owner)
- `DELETE /api/menu/:id` - Delete menu item (owner)
- `PATCH /api/menu/:id/availability` - Toggle availability (staff)

### Orders
- `POST /api/orders` - Place order (student)
- `GET /api/orders/my-orders` - Get user's orders (student)
- `GET /api/orders/:id` - Get order details
- `GET /api/orders/canteen/:canteenId` - Get canteen orders (staff)
- `PATCH /api/orders/:id/status` - Update order status (staff)
- `POST /api/orders/:id/cancel` - Cancel order

### Analytics (Owner/Admin)
- `GET /api/analytics/sales` - Sales data
- `GET /api/analytics/popular-items` - Top selling items
- `GET /api/analytics/orders-timeline` - Order trends

## Real-time Events (Socket.io)

### Student Events
- `order:placed` - New order confirmation
- `order:status_updated` - Order status change
- `order:delivered` - Delivery confirmation

### Staff Events
- `new_order` - New order notification
- `order:cancelled` - Order cancellation

## Security

- JWT tokens for authentication
- Password hashing with bcrypt
- Email verification required
- Role-based access control (RBAC)
- Rate limiting on API endpoints
- Input validation and sanitization
- CORS configuration
- Secure headers (helmet.js)

## Scalability Considerations

- Horizontal scaling with load balancer
- MongoDB replica sets for high availability
- Redis caching for frequently accessed data
- CDN for static assets (S3 + CloudFront)
- Socket.io adapter for multi-instance support
- Database indexing on frequent queries

## Future Enhancements

- Push notifications (Firebase)
- Payment gateway (Razorpay/Stripe)
- Loyalty points and rewards
- Group ordering
- Pre-order scheduling
- Dietary preferences and allergen filtering
- Multi-language support
