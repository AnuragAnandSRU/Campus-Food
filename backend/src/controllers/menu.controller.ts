import { Request, Response } from 'express';
import mongoose from 'mongoose';
import MenuItem from '../models/MenuItem.model';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../middleware/errorHandler';

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

  const items = await MenuItem.find(filter).sort({ category: 1, name: 1 });
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

  const item = await MenuItem.findById(id);
  if (!item) {
    throw new AppError('Menu item not found', 404);
  }

  res.json({ success: true, data: item });
});
