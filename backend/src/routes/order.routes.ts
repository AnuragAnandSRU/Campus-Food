import { Router } from 'express';
import { protect, restrictTo } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(protect);

// TODO: Implement order controllers
// Student routes
// router.post('/', restrictTo('student'), createOrder);
// router.get('/my-orders', restrictTo('student'), getMyOrders);
// router.get('/:id', getOrderById);
// router.post('/:id/cancel', restrictTo('student'), cancelOrder);

// Staff routes
// router.get('/canteen/:canteenId', restrictTo('staff', 'owner'), getCanteenOrders);
// router.patch('/:id/status', restrictTo('staff', 'owner'), updateOrderStatus);

export default router;
