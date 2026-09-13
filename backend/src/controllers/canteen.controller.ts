import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Canteen from '../models/Canteen.model';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../middleware/errorHandler';

/**
 * GET /api/canteens  (public)
 * Lists active canteens for students to browse, newest-rated first.
 */
export const getAllCanteens = asyncHandler(async (_req: Request, res: Response) => {
  const canteens = await Canteen.find({ isActive: true }).sort({ rating: -1, name: 1 });
  res.json({ success: true, data: canteens });
});

/**
 * GET /api/canteens/:id  (public)
 */
export const getCanteenById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError('Canteen not found', 404);
  }

  const canteen = await Canteen.findById(id);
  if (!canteen) {
    throw new AppError('Canteen not found', 404);
  }

  res.json({ success: true, data: canteen });
});
