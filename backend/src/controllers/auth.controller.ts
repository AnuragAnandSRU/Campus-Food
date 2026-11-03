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
  staffDuties: user.staffDuties,
  permissions: user.permissions,
  isVerified: user.isVerified,
  isActive: user.isActive,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const normalizeEmail = (email: string): string => email.toLowerCase().trim();

/**
 * POST /api/auth/register
 * PUBLIC self-registration is restricted to STUDENTS only. Staff/owner/admin
 * accounts are created by an admin via the provisioning flow (invite link),
 * so `role` and `canteenId` from the request body are deliberately ignored
 * here — a public caller can never mint a privileged account.
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, name, phone, hostelBlock, roomNumber } = req.body;

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
    role: 'student',
    hostelBlock,
    roomNumber,
    verificationToken: hashToken(rawToken),
  });

  await sendVerificationEmail(user.email, user.name, rawToken);

  const token = signToken({ userId: String(user._id), role: user.role });
  res.status(201).json({ user: sanitizeUser(user), token });
});

/** Each entrance ("door") only admits certain roles — see auth `audience`. */
const AUDIENCE_ROLES: Record<'student' | 'business' | 'admin', IUser['role'][]> = {
  student: ['student'],
  business: ['staff', 'owner'],
  admin: ['admin'],
};

/** Shown when someone signs in at the wrong door for their account's role. */
const WRONG_DOOR_MESSAGE: Record<'student' | 'business' | 'admin', string> = {
  student:
    'This is the student sign-in. Canteen staff and owners should use the partner portal.',
  business:
    'This is the partner portal for canteen staff and owners. Students should use the student sign-in.',
  admin: 'This account is not an administrator account.',
};

/**
 * POST /api/auth/login
 * When an `audience` is supplied (the door the request came through), a login
 * is refused if the account's role doesn't belong to that door — this keeps the
 * student, partner, and admin entrances hard-separated even though they share
 * one backend and one User collection.
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, audience } = req.body as {
    email: string;
    password: string;
    audience?: 'student' | 'business' | 'admin';
  };

  const user = await User.findOne({ email: normalizeEmail(email) }).select('+password');
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  // A provisioned staff/owner account stays inactive until the invitee sets a
  // password via their invite link. They can't know the random placeholder
  // password, so check activation first to return an actionable message.
  if (!user.isActive) {
    throw new AppError(
      'This account has not been activated yet. Please use the invitation link sent to your email to set a password.',
      403
    );
  }

  if (!(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }

  // Enforce the door: a valid account still can't enter through the wrong one.
  if (audience && !AUDIENCE_ROLES[audience].includes(user.role)) {
    throw new AppError(WRONG_DOOR_MESSAGE[audience], 403);
  }

  const token = signToken({ userId: String(user._id), role: user.role });
  res.json({ user: sanitizeUser(user), token });
});

/**
 * POST /api/auth/accept-invite
 * Completes provisioning: an invitee sets their password using the one-time
 * token from their invitation link. This activates the account and signs them
 * in immediately. The token is single-use and time-limited.
 */
export const acceptInvite = asyncHandler(async (req: Request, res: Response) => {
  const { token, password } = req.body;

  const user = await User.findOne({
    invitationToken: hashToken(token),
    invitationExpire: { $gt: new Date() },
  });
  if (!user) {
    throw new AppError('Invalid or expired invitation link', 400);
  }

  user.password = password; // hashed by the pre-save hook
  user.isActive = true;
  user.isVerified = true; // accepting the emailed invite proves email ownership
  user.invitationToken = undefined;
  user.invitationExpire = undefined;
  await user.save();

  const authToken = signToken({ userId: String(user._id), role: user.role });
  res.json({ user: sanitizeUser(user), token: authToken });
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
 * POST /api/auth/resend-verification
 * Resends a fresh email verification link to the logged-in user.
 */
export const resendVerificationEmail = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = (req as AuthRequest).user!;
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (user.isVerified) {
    return res.json({ success: true, message: 'Your email is already verified.' });
  }

  const rawToken = generateRawToken();
  user.verificationToken = hashToken(rawToken);
  await user.save({ validateBeforeSave: false });

  await sendVerificationEmail(user.email, user.name, rawToken);

  res.json({ success: true, message: 'Verification email resent successfully. Please check your inbox.' });
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
