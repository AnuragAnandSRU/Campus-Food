import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { AppError } from '../middleware/errorHandler';
import { uploadImageToS3 } from '../services/s3.service';

/**
 * POST /api/upload
 * Accepts a multipart/form-data image, uploads directly to AWS S3, and returns the public CDN URL.
 */
export const uploadImage = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new AppError('Please select an image file to upload', 400);
  }

  const folder = req.body?.folder === 'canteens' ? 'canteens' : 'dishes';
  const url = await uploadImageToS3(req.file, folder);

  res.json({
    success: true,
    data: {
      url,
    },
    message: 'Image uploaded successfully to AWS S3',
  });
});
