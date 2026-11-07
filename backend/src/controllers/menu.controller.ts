import { Request, Response } from 'express';
import mongoose from 'mongoose';
import MenuItem from '../models/MenuItem.model';
import User, { IUser } from '../models/User.model';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';

/**
 * GET /api/menu/:canteenId  (public)
 * Returns a canteen's menu. Supports optional query filters that mirror the
 * shared MenuFilters type: category, isVeg, isAvailable, search.
 * Unavailable items are included by default so the UI can show them greyed
 * out; pass ?isAvailable=true to hide them.
 */
export const getMenuByCanteen = asyncHandler(async (req: Request, res: Response) => {
  const { canteenId } = req.params;
  if (!mongoose.isValidObjectId(canteenId)) {
    throw new AppError('Canteen not found', 404);
  }

  const filter: Record<string, unknown> = { canteenId };
  const { category, isVeg, isAvailable, search } = req.query;

  if (category) filter.category = category;
  if (isVeg !== undefined) filter.isVeg = isVeg === 'true';
  if (isAvailable !== undefined) filter.isAvailable = isAvailable === 'true';
  if (search) filter.$text = { $search: String(search) };

  const items = await MenuItem.find(filter).sort({ category: 1, name: 1 }).lean();
  res.json({ success: true, data: items });
});

/**
 * GET /api/menu/item/:id  (public)
 */
export const getMenuItemById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError('Menu item not found', 404);
  }

  const item = await MenuItem.findById(id).lean();
  if (!item) {
    throw new AppError('Menu item not found', 404);
  }

  res.json({ success: true, data: item });
});

// ---- Menu management (owner / permitted staff) -----------------------------

/**
 * Loads the acting owner/staff member for a menu write and enforces the
 * role-level gate:
 *  - admins are intentionally excluded (menus are the owner's turf);
 *  - inactive accounts are refused;
 *  - a staff member additionally needs the `manage_menu` grant when
 *    `needsManagePower` is true (add / edit / delete). Owners always may.
 * Availability toggles pass `false`, so any active owner/staff of the canteen
 * can flip stock without the grant. Returns the loaded user so the caller can
 * scope the action to that user's OWN canteen.
 */
async function loadMenuActor(userId: string, needsManagePower: boolean): Promise<IUser> {
  const actor = await User.findById(userId).select('canteenId permissions role isActive');
  if (!actor || !actor.isActive) {
    throw new AppError('Your account is not active', 403);
  }
  if (actor.role !== 'owner' && actor.role !== 'staff') {
    throw new AppError('You do not have permission to manage this menu', 403);
  }
  if (!actor.canteenId) {
    throw new AppError('Your account is not linked to a canteen', 403);
  }
  if (needsManagePower && actor.role === 'staff' && !actor.permissions.includes('manage_menu')) {
    throw new AppError('You need the “manage menu” permission to do this', 403);
  }
  return actor;
}

/** True when `actor` belongs to the same canteen as the item being changed. */
function ownsCanteen(actor: IUser, canteenId: mongoose.Types.ObjectId): boolean {
  return !!actor.canteenId && actor.canteenId.toString() === canteenId.toString();
}

/**
 * POST /api/menu  (owner / staff with manage_menu)
 * Creates a menu item under the actor's OWN canteen. Any canteenId in the body
 * is ignored — an item can only ever be filed under your own canteen.
 */
export const createMenuItem = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = (req as AuthRequest).user!;
  const actor = await loadMenuActor(userId, true);

  const { name, description, price, image, category, isVeg, preparationTime } = req.body;

  const item = await MenuItem.create({
    canteenId: actor.canteenId,
    name,
    description,
    price,
    image,
    category,
    isVeg,
    preparationTime,
  });

  res.status(201).json({ success: true, data: item });
});

/**
 * PUT /api/menu/:id  (owner / staff with manage_menu)
 * Field-by-field update. canteenId is deliberately never changed, so an item
 * can't be moved to another canteen.
 */
export const updateMenuItem = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId } = (req as AuthRequest).user!;

  if (!mongoose.isValidObjectId(id)) {
    throw new AppError('Menu item not found', 404);
  }
  const item = await MenuItem.findById(id);
  if (!item) {
    throw new AppError('Menu item not found', 404);
  }

  const actor = await loadMenuActor(userId, true);
  if (!ownsCanteen(actor, item.canteenId)) {
    throw new AppError('You can only manage your own canteen’s menu', 403);
  }

  const { name, description, price, image, category, isVeg, preparationTime, isAvailable } =
    req.body;
  if (name !== undefined) item.name = name;
  if (description !== undefined) item.description = description;
  if (price !== undefined) item.price = price;
  if (image !== undefined) item.image = image;
  if (category !== undefined) item.category = category;
  if (isVeg !== undefined) item.isVeg = isVeg;
  if (preparationTime !== undefined) item.preparationTime = preparationTime;
  if (isAvailable !== undefined) item.isAvailable = isAvailable;
  await item.save();

  res.json({ success: true, data: item });
});

/**
 * DELETE /api/menu/:id  (owner / staff with manage_menu)
 */
export const deleteMenuItem = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId } = (req as AuthRequest).user!;

  if (!mongoose.isValidObjectId(id)) {
    throw new AppError('Menu item not found', 404);
  }
  const item = await MenuItem.findById(id);
  if (!item) {
    throw new AppError('Menu item not found', 404);
  }

  const actor = await loadMenuActor(userId, true);
  if (!ownsCanteen(actor, item.canteenId)) {
    throw new AppError('You can only manage your own canteen’s menu', 403);
  }

  await item.deleteOne();
  res.json({ success: true, data: { _id: id } });
});

/**
 * PATCH /api/menu/:id/availability  (owner / any staff of the canteen)
 * Marks an item in or out of stock. This is an everyday operational lever, so
 * it does NOT require the manage_menu grant — any active owner/staff of the
 * canteen may flip it. Omit isAvailable in the body to toggle the current state.
 */
export const toggleAvailability = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId } = (req as AuthRequest).user!;

  if (!mongoose.isValidObjectId(id)) {
    throw new AppError('Menu item not found', 404);
  }
  const item = await MenuItem.findById(id);
  if (!item) {
    throw new AppError('Menu item not found', 404);
  }

  const actor = await loadMenuActor(userId, false);
  if (!ownsCanteen(actor, item.canteenId)) {
    throw new AppError('You can only manage your own canteen’s menu', 403);
  }

  const { isAvailable } = req.body as { isAvailable?: boolean };
  item.isAvailable = typeof isAvailable === 'boolean' ? isAvailable : !item.isAvailable;
  await item.save();

  res.json({ success: true, data: item });
});
