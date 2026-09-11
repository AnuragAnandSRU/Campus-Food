import { Router } from 'express';
import { protect, restrictTo } from '../middleware/auth.middleware';

const router = Router();

// TODO: Implement canteen controllers
// Public routes
// router.get('/', getAllCanteens);
// router.get('/:id', getCanteenById);
// router.get('/:id/menu', getCanteenMenu);

// Protected routes - Owner/Admin only
// router.use(protect);
// router.post('/', restrictTo('admin'), createCanteen);
// router.put('/:id', restrictTo('owner', 'admin'), updateCanteen);
// router.delete('/:id', restrictTo('admin'), deleteCanteen);

export default router;
