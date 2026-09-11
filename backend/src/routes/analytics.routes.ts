import { Router } from 'express';
import { protect, restrictTo } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication and owner/admin role
router.use(protect);
router.use(restrictTo('owner', 'admin'));

// TODO: Implement analytics controllers
// router.get('/sales', getSalesAnalytics);
// router.get('/popular-items', getPopularItems);
// router.get('/orders-timeline', getOrdersTimeline);
// router.get('/dashboard', getDashboardStats);

export default router;
