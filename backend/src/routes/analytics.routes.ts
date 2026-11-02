import { Router } from 'express';
import { protect, AuthRequest } from '../middleware/auth.middleware';
import User from '../models/User.model';
import {
  getDashboardStats,
  getSalesAnalytics,
  getPopularItems,
  getOrdersTimeline,
} from '../controllers/analytics.controller';

const router = Router();

// All analytics routes require authentication
router.use(protect);

// Role & Permission guard:
// - Platform admins and canteen owners have full access.
// - Canteen staff are admitted only if they have the 'view_analytics' permission granted.
router.use(async (req, res, next) => {
  const user = (req as AuthRequest).user;
  if (!user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  if (user.role === 'admin' || user.role === 'owner') {
    return next();
  }

  if (user.role === 'staff') {
    const dbUser = await User.findById(user.userId).select('permissions');
    if (dbUser?.permissions?.includes('view_analytics')) {
      return next();
    }
  }

  return res.status(403).json({
    success: false,
    message: 'You do not have permission to view analytics.',
  });
});

router.get('/dashboard', getDashboardStats);
router.get('/sales', getSalesAnalytics);
router.get('/popular-items', getPopularItems);
router.get('/orders-timeline', getOrdersTimeline);

export default router;
