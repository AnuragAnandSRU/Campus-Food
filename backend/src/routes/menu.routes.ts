import { Router } from 'express';
// import { protect, restrictTo } from '../middleware/auth.middleware';
import { getMenuByCanteen, getMenuItemById } from '../controllers/menu.controller';

const router = Router();

// Public routes — student browse.
// NOTE: '/item/:id' must be declared before '/:canteenId' so it isn't
// swallowed by the canteenId param route.
router.get('/item/:id', getMenuItemById);
router.get('/:canteenId', getMenuByCanteen);

// TODO (owner/staff step): protected create/update/delete + availability
// router.use(protect);
// router.post('/', restrictTo('owner', 'admin'), createMenuItem);
// router.put('/:id', restrictTo('owner', 'admin'), updateMenuItem);
// router.delete('/:id', restrictTo('owner', 'admin'), deleteMenuItem);
// router.patch('/:id/availability', restrictTo('owner', 'staff'), toggleAvailability);

export default router;
