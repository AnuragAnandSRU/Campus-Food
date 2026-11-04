import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import {
  registerValidator,
  loginValidator,
  acceptInviteValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  updateProfileValidator,
  changePasswordValidator,
} from '../validators/auth.validator';
import {
  register,
  login,
  acceptInvite,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile,
  changePassword,
  getFavorites,
  toggleFavorite,
  logout,
} from '../controllers/auth.controller';

const router = Router();

router.post('/register', registerValidator, validate, register);
router.post('/login', loginValidator, validate, login);
router.post('/accept-invite', acceptInviteValidator, validate, acceptInvite);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', protect, resendVerificationEmail);
router.post('/forgot-password', forgotPasswordValidator, validate, forgotPassword);
router.post('/reset-password', resetPasswordValidator, validate, resetPassword);
router.get('/me', protect, getMe);
router.patch('/profile', protect, updateProfileValidator, validate, updateProfile);
router.post('/change-password', protect, changePasswordValidator, validate, changePassword);

// Favorites endpoints
router.get('/favorites', protect, getFavorites);
router.post('/favorites/:menuItemId', protect, toggleFavorite);

router.post('/logout', protect, logout);

export default router;
