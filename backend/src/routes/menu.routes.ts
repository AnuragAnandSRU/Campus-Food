import { Router } from 'express';
import { protect, restrictTo } from '../middleware/auth.middleware';

const router = Router();

// TODO: Implement menu controllers
// Public routes
// router.get('/:canteenId', getMenuByCanteen);
// router.get('/item/:id', getMenuItemById);

// Protected routes - Owner/Staff only
// router.use(protect);
// router.post('/', restrictTo('owner', 'admin'), createMenuItem);
// router.put('/:id', restrictTo('owner', 'admin'), updateMenuItem);
// router.delete('/:id', restrictTo('owner', 'admin'), deleteMenuItem);
// router.patch('/:id/availability', restrictTo('owner', 'staff'), toggleAvailability);

export default router;
