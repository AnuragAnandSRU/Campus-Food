import { Router } from 'express';
import { protect, restrictTo } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { provisionUserValidator } from '../validators/user.validator';
import {
  provisionUser,
  listProvisionedUsers,
  resendInvite,
} from '../controllers/user.controller';

const router = Router();

// All routes require authentication
router.use(protect);

// Admin: provision and manage staff/owner accounts (invite-link flow)
router.get('/', restrictTo('admin'), listProvisionedUsers);
router.post('/', restrictTo('admin'), provisionUserValidator, validate, provisionUser);
router.post('/:id/resend-invite', restrictTo('admin'), resendInvite);

export default router;
