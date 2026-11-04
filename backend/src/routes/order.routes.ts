import { Router } from 'express';
import { protect, restrictTo } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import {
  createOrderValidator,
  updateOrderStatusValidator,
  cancelOrderValidator,
  rateOrderValidator,
} from '../validators/order.validator';
import {
  createOrder,
  getMyOrders,
  getOrderById,
  getCanteenOrders,
  updateOrderStatus,
  cancelOrder,
  rateOrder,
} from '../controllers/order.controller';

const router = Router();

// All order routes require authentication.
router.use(protect);

// Student routes
router.post('/', restrictTo('student'), createOrderValidator, validate, createOrder);
router.get('/my-orders', restrictTo('student'), getMyOrders);

// Canteen order book (staff/owner see their own; admin any). Kept above /:id so
// the literal "canteen" segment isn't captured by the :id param.
router.get('/canteen/:canteenId', restrictTo('staff', 'owner', 'admin'), getCanteenOrders);

// Shared read (ownership enforced inside the controller). After /my-orders and
// /canteen so those literal paths win.
router.get('/:id', getOrderById);

// Status changes and cancellation.
router.patch(
  '/:id/status',
  restrictTo('staff', 'owner', 'admin'),
  updateOrderStatusValidator,
  validate,
  updateOrderStatus
);
router.post(
  '/:id/cancel',
  restrictTo('student', 'staff', 'owner', 'admin'),
  cancelOrderValidator,
  validate,
  cancelOrder
);

router.post(
  '/:id/rate',
  restrictTo('student'),
  rateOrderValidator,
  validate,
  rateOrder
);

export default router;
