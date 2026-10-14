import { Router } from 'express';
import { protect, restrictTo } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { provisionUserValidator } from '../validators/user.validator';
import {
  provisionUser,
  listProvisionedUsers,
  resendInvite,
  removeUser,
} from '../controllers/user.controller';

const router = Router();

// All routes require authentication
router.use(protect);

// Admin: all staff/owner accounts. Owner: their own canteen's staff only
// (scoping enforced in each controller).
router.get('/', restrictTo('admin', 'owner'), listProvisionedUsers);
router.post('/', restrictTo('admin', 'owner'), provisionUserValidator, validate, provisionUser);
router.post('/:id/resend-invite', restrictTo('admin', 'owner'), resendInvite);
router.delete('/:id', restrictTo('admin', 'owner'), removeUser);

export default router;
