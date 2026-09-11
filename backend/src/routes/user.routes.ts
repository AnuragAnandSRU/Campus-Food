import { Router } from 'express';
import { protect, restrictTo } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(protect);

// TODO: Implement user controllers
// router.get('/profile', getProfile);
// router.put('/profile', updateProfile);
// router.put('/change-password', changePassword);

export default router;
