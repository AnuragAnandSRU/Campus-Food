import { Router } from 'express';
import { protect, restrictTo } from '../middleware/auth.middleware';
import { uploadSingleImage } from '../middleware/upload.middleware';
import { uploadImage } from '../controllers/upload.controller';

const router = Router();

// Staff, owners, and admins can upload dish and canteen photos to S3
router.post(
  '/',
  protect,
  restrictTo('staff', 'owner', 'admin'),
  uploadSingleImage,
  uploadImage
);

export default router;
