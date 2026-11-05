import { body } from 'express-validator';

/**
 * Validates the CreateOrderDto payload. Note we intentionally do NOT trust any
 * price or name sent by the client — the controller re-reads those from the
 * database. Here we only shape-check what the client controls.
 */
export const createOrderValidator = [
  body('canteenId').isMongoId().withMessage('A valid canteen is required'),

  body('items')
    .isArray({ min: 1 })
    .withMessage('Your order must contain at least one item'),
  body('items.*.menuItemId').isMongoId().withMessage('Invalid menu item in order'),
  body('items.*.quantity')
    .isInt({ min: 1, max: 50 })
    .withMessage('Each item quantity must be between 1 and 50'),

  body('deliveryAddress.hostelBlock')
    .trim()
    .notEmpty()
    .withMessage('Hostel block is required for delivery'),
  body('deliveryAddress.roomNumber')
    .trim()
    .notEmpty()
    .withMessage('Room number is required for delivery'),

  // Cash on delivery is the only option for now; online payment comes later.
  body('paymentMethod')
    .optional()
    .isIn(['cash_on_delivery'])
    .withMessage('Only cash on delivery is available right now'),

  body('specialInstructions')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('Special instructions must be under 500 characters'),
];

/**
 * Validates a staff/owner status change. Cancellation is deliberately excluded —
 * it has its own endpoint and rules — so 'cancelled' is not an accepted value.
 */
export const updateOrderStatusValidator = [
  body('status')
    .isIn(['confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered'])
    .withMessage('Invalid order status'),
  body('estimatedDeliveryTime')
    .optional()
    .isISO8601()
    .withMessage('Estimated delivery time must be a valid date'),
  body('deliveryPin')
    .optional()
    .isString()
    .trim(),
  body('overridePin')
    .optional()
    .isBoolean(),
];

export const cancelOrderValidator = [
  body('cancelReason')
    .optional()
    .isString()
    .isLength({ max: 300 })
    .withMessage('Cancellation reason must be under 300 characters'),
];

export const rateOrderValidator = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer between 1 and 5'),
  body('review')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Review must be under 500 characters'),
];
