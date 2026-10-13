import { body } from 'express-validator';

const CATEGORIES = ['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Beverages', 'Desserts'];

/**
 * Creating a menu item. canteenId is intentionally NOT accepted here — the
 * server always files the item under the acting owner/staff member's own
 * canteen, so a caller can never create items for someone else's canteen.
 */
export const createMenuItemValidator = [
  body('name').trim().notEmpty().withMessage('Item name is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be zero or more'),
  body('category').isIn(CATEGORIES).withMessage('Choose a valid category'),
  body('isVeg').isBoolean().withMessage('Mark the item as veg or non-veg'),
  body('preparationTime')
    .isInt({ min: 1 })
    .withMessage('Preparation time must be at least 1 minute'),
  body('image').optional().isString().withMessage('Image must be a URL'),
];

/**
 * Updating a menu item. Every field is optional (partial PATCH); when present
 * it must still be valid. isAvailable may also be set through this route.
 */
export const updateMenuItemValidator = [
  body('name').optional().trim().notEmpty().withMessage('Item name cannot be empty'),
  body('description').optional().trim().notEmpty().withMessage('Description cannot be empty'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be zero or more'),
  body('category').optional().isIn(CATEGORIES).withMessage('Choose a valid category'),
  body('isVeg').optional().isBoolean().withMessage('Mark the item as veg or non-veg'),
  body('preparationTime')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Preparation time must be at least 1 minute'),
  body('image').optional().isString().withMessage('Image must be a URL'),
  body('isAvailable').optional().isBoolean().withMessage('Availability must be true or false'),
];

/** Toggling availability. Omit isAvailable to simply flip the current state. */
export const toggleAvailabilityValidator = [
  body('isAvailable').optional().isBoolean().withMessage('Availability must be true or false'),
];
