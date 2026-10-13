import { Router } from 'express';
import { protect, restrictTo } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import {
  getMenuByCanteen,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleAvailability,
} from '../controllers/menu.controller';
import {
  createMenuItemValidator,
  updateMenuItemValidator,
  toggleAvailabilityValidator,
} from '../validators/menu.validator';

const router = Router();

// Public routes — student browse.
// NOTE: '/item/:id' must be declared before '/:canteenId' so it isn't
// swallowed by the canteenId param route.
router.get('/item/:id', getMenuItemById);
router.get('/:canteenId', getMenuByCanteen);

// Protected writes. restrictTo is only a coarse gate — it lets canteen roles
// through and refuses students/admins. The controllers then enforce the
// fine-grained rules: staff need the manage_menu grant to add/edit/delete, and
// everyone is scoped to their OWN canteen. Availability is lighter: any
// owner/staff of the canteen may flip stock.
router.use(protect);
router.post('/', restrictTo('owner', 'staff'), createMenuItemValidator, validate, createMenuItem);
router.put('/:id', restrictTo('owner', 'staff'), updateMenuItemValidator, validate, updateMenuItem);
router.delete('/:id', restrictTo('owner', 'staff'), deleteMenuItem);
router.patch(
  '/:id/availability',
  restrictTo('owner', 'staff'),
  toggleAvailabilityValidator,
  validate,
  toggleAvailability
);

export default router;
