import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import { authLimiter, emailLimiter } from '../middleware/rateLimiter';
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

// Strict rate-limited authentication endpoints (15 attempts / 15 mins)
router.post('/register', authLimiter, registerValidator, validate, register);
router.post('/login', authLimiter, loginValidator, validate, login);
router.post('/accept-invite', authLimiter, acceptInviteValidator, validate, acceptInvite);

// Email & verification endpoints (5 requests / hour)
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', protect, emailLimiter, resendVerificationEmail);
router.post('/forgot-password', emailLimiter, forgotPasswordValidator, validate, forgotPassword);
router.post('/reset-password', resetPasswordValidator, validate, resetPassword);

// User profile & session
router.get('/me', protect, getMe);
router.patch('/profile', protect, updateProfileValidator, validate, updateProfile);
router.post('/change-password', protect, changePasswordValidator, validate, changePassword);

// Favorites endpoints
router.get('/favorites', protect, getFavorites);
router.post('/favorites/:menuItemId', protect, toggleFavorite);

router.post('/logout', protect, logout);

export default router;
