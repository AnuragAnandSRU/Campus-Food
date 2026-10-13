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

/**
 * GET /api/canteens/admin/all  (admin)
 * Lists every canteen — including inactive and owner-less ones — for the
 * admin console, with the assigned owner's name/email populated.
 */
export const listCanteensForAdmin = asyncHandler(async (_req: Request, res: Response) => {
  const canteens = await Canteen.find()
    .sort({ createdAt: -1 })
    .populate('ownerId', 'name email');
  res.json({ success: true, data: canteens });
});

/**
 * POST /api/canteens  (admin)
 * Creates a canteen unassigned (no owner). An owner is linked later via the
 * provisioning flow. Canteen is active by default so it appears to students.
 */
export const createCanteen = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, location, image, openingHours } = req.body;

  const existing = await Canteen.findOne({ name: name.trim() });
  if (existing) {
    throw new AppError('A canteen with this name already exists', 409);
  }

  const canteen = await Canteen.create({
    name,
    description,
    location,
    image,
    openingHours,
  });

  res.status(201).json({ success: true, data: canteen });
});

/**
 * PATCH /api/canteens/:id  (admin)
 * Updates canteen details or toggles its active state.
 */
export const updateCanteen = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError('Canteen not found', 404);
  }

  const canteen = await Canteen.findById(id);
  if (!canteen) {
    throw new AppError('Canteen not found', 404);
  }

  const { name, description, location, image, openingHours, isActive } = req.body;
  if (name !== undefined) canteen.name = name;
  if (description !== undefined) canteen.description = description;
  if (location !== undefined) canteen.location = location;
  if (image !== undefined) canteen.image = image;
  if (openingHours !== undefined) canteen.openingHours = openingHours;
  if (isActive !== undefined) canteen.isActive = isActive;
  await canteen.save();

  res.json({ success: true, data: canteen });
});
