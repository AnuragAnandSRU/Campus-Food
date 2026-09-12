import { Request, Response } from 'express';
import User, { IUser } from '../models/User.model';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { signToken } from '../utils/jwt';
import { generateRawToken, hashToken } from '../utils/crypto';
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from '../services/email.service';

/** Maps a Mongoose user document to the safe shape returned to clients. */
const sanitizeUser = (user: IUser) => ({
  _id: String(user._id),
  email: user.email,
  name: user.name,
  role: user.role,
  phone: user.phone,
  hostelBlock: user.hostelBlock,
  roomNumber: user.roomNumber,
  canteenId: user.canteenId ? String(user.canteenId) : undefined,
  isVerified: user.isVerified,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const normalizeEmail = (email: string): string => email.toLowerCase().trim();

/**
 * POST /api/auth/register
 * Creates an account, emails a verification link, and returns a JWT so the
 * user is signed in immediately (ordering can be gated on isVerified later).
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, name, phone, role, hostelBlock, roomNumber, canteenId } =
    req.body;

  const normalizedEmail = normalizeEmail(email);
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    throw new AppError('An account with this email already exists', 409);
  }

  const rawToken = generateRawToken();
  const user = await User.create({
    email: normalizedEmail,
    password,
    name,
    phone,
    role: role || 'student',
    hostelBlock,
    roomNumber,
    canteenId,
    verificationToken: hashToken(rawToken),
  });

  await sendVerificationEmail(user.email, user.name, rawToken);

  const token = signToken({ userId: String(user._id), role: user.role });
  res.status(201).json({ user: sanitizeUser(user), token });
});

/**
 * POST /api/auth/login
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: normalizeEmail(email) }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }

  const token = signToken({ userId: String(user._id), role: user.role });
  res.json({ user: sanitizeUser(user), token });
});

/**
 * POST /api/auth/verify-email
 */
export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.body;
  if (!token) {
    throw new AppError('Verification token is required', 400);
  }

  const user = await User.findOne({ verificationToken: hashToken(token) });
  if (!user) {
    throw new AppError('Invalid or expired verification link', 400);
  }

  user.isVerified = true;
  user.verificationToken = undefined;
  await user.save({ validateBeforeSave: false });

  res.json({ success: true, message: 'Email verified successfully' });
});

/**
 * POST /api/auth/forgot-password
 * Always responds with success to avoid leaking which emails are registered.
 */
export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  const user = await User.findOne({ email: normalizeEmail(email) });

  if (user) {
    const rawToken = generateRawToken();
    user.resetPasswordToken = hashToken(rawToken);
    user.resetPasswordExpire = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save({ validateBeforeSave: false });
    await sendPasswordResetEmail(user.email, user.name, rawToken);
  }

  res.json({
    success: true,
    message: 'If an account with that email exists, a reset link has been sent',
  });
});

/**
 * POST /api/auth/reset-password
 */
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, password } = req.body;

  const user = await User.findOne({
    resetPasswordToken: hashToken(token),
    resetPasswordExpire: { $gt: new Date() },
  });
  if (!user) {
    throw new AppError('Invalid or expired reset link', 400);
  }

  user.password = password; // hashed by the pre-save hook
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  res.json({ success: true, message: 'Password reset successfully' });
});

/**
 * GET /api/auth/me
 */
export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user!.userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  res.json(sanitizeUser(user));
});

/**
 * POST /api/auth/logout
 * JWT is stateless, so logout is handled client-side by discarding the token.
 * Endpoint exists for symmetry and future token-blacklist support.
 */
export const logout = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ success: true, message: 'Logged out successfully' });
});
