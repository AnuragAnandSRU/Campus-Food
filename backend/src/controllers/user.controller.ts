import { Request, Response } from 'express';
import mongoose from 'mongoose';
import User, { IUser } from '../models/User.model';
import Canteen from '../models/Canteen.model';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import { generateRawToken, hashToken } from '../utils/crypto';
import { sendInvitationEmail, buildInviteLink } from '../services/email.service';

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/** De-duplicates a list while preserving order (e.g. duties/permissions). */
const uniq = <T>(arr: T[] | undefined): T[] => [...new Set(arr ?? [])];

/** Safe shape returned for a single provisioned account. */
const sanitizeStaff = (user: IUser) => ({
  _id: String(user._id),
  email: user.email,
  name: user.name,
  role: user.role,
  phone: user.phone,
  canteenId: user.canteenId ? String(user.canteenId) : undefined,
  staffDuties: user.staffDuties,
  permissions: user.permissions,
  isActive: user.isActive,
  isVerified: user.isVerified,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

/**
 * POST /api/users  (admin)
 * Provisions a staff or owner account. The account is created INACTIVE with an
 * unusable random password; the invitee activates it by setting their own
 * password via the emailed invitation link. The raw link is also returned so
 * the admin can copy and share it directly (fallback when email is unreliable).
 */
export const provisionUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, name, phone, role, canteenId, staffDuties, permissions } = req.body;

  const normalizedEmail = String(email).toLowerCase().trim();
  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    throw new AppError('An account with this email already exists', 409);
  }

  const canteen = await Canteen.findById(canteenId);
  if (!canteen) {
    throw new AppError('Selected canteen not found', 404);
  }
  if (role === 'owner' && canteen.ownerId) {
    throw new AppError('This canteen already has an owner assigned', 409);
  }

  const rawToken = generateRawToken();
  const user = await User.create({
    email: normalizedEmail,
    // Random, unknowable password. The account cannot be used until the invitee
    // sets their own via accept-invite; this only satisfies the schema.
    password: generateRawToken(),
    name,
    phone,
    role,
    canteenId,
    staffDuties: uniq(staffDuties),
    permissions: role === 'staff' ? uniq(permissions) : [],
    isActive: false,
    invitationToken: hashToken(rawToken),
    invitationExpire: new Date(Date.now() + INVITE_TTL_MS),
  });

  // An owner is linked to the canteen they run.
  if (role === 'owner') {
    canteen.ownerId = user._id as mongoose.Types.ObjectId;
    await canteen.save();
  }

  await sendInvitationEmail(user.email, user.name, rawToken, {
    role,
    canteenName: canteen.name,
  });

  res.status(201).json({
    success: true,
    data: {
      user: sanitizeStaff(user),
      inviteLink: buildInviteLink(rawToken),
    },
  });
});

/**
 * GET /api/users  (admin)
 * Lists all staff/owner accounts with their canteen and activation status.
 */
export const listProvisionedUsers = asyncHandler(async (_req: Request, res: Response) => {
  const users = await User.find({ role: { $in: ['staff', 'owner'] } })
    .sort({ createdAt: -1 })
    .populate('canteenId', 'name');

  const data = users.map((u) => {
    const canteen = u.canteenId as unknown as
      | { _id: mongoose.Types.ObjectId; name: string }
      | null;
    return {
      _id: String(u._id),
      email: u.email,
      name: u.name,
      role: u.role,
      phone: u.phone,
      staffDuties: u.staffDuties,
      permissions: u.permissions,
      canteen: canteen ? { _id: String(canteen._id), name: canteen.name } : null,
      isActive: u.isActive,
      createdAt: u.createdAt,
    };
  });

  res.json({ success: true, data });
});

/**
 * POST /api/users/:id/resend-invite  (admin)
 * Regenerates an invitation for a not-yet-activated account and returns a fresh
 * link. Used when the original expired or the email never arrived.
 */
export const resendInvite = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError('User not found', 404);
  }

  const user = await User.findById(id).populate('canteenId', 'name');
  if (!user || (user.role !== 'staff' && user.role !== 'owner')) {
    throw new AppError('User not found', 404);
  }
  if (user.isActive) {
    throw new AppError('This account is already active', 400);
  }

  const rawToken = generateRawToken();
  user.invitationToken = hashToken(rawToken);
  user.invitationExpire = new Date(Date.now() + INVITE_TTL_MS);
  await user.save({ validateBeforeSave: false });

  const canteen = user.canteenId as unknown as { name: string } | null;
  await sendInvitationEmail(user.email, user.name, rawToken, {
    role: user.role,
    canteenName: canteen?.name,
  });

  res.json({ success: true, data: { inviteLink: buildInviteLink(rawToken) } });
});
