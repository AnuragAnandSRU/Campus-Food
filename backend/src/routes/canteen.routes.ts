import { Router } from 'express';
import { protect, restrictTo } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate';
import {
  createCanteenValidator,
  updateCanteenValidator,
} from '../validators/canteen.validator';
import {
  getAllCanteens,
  getCanteenById,
  listCanteensForAdmin,
  createCanteen,
  updateCanteen,
} from '../controllers/canteen.controller';

const router = Router();

// Public routes — student browse
router.get('/', getAllCanteens);

// Admin management. Specific paths are declared before '/:id' so they are not
// captured by the id param route.
router.get('/admin/all', protect, restrictTo('admin'), listCanteensForAdmin);
router.post('/', protect, restrictTo('admin'), createCanteenValidator, validate, createCanteen);
router.patch('/:id', protect, restrictTo('admin'), updateCanteenValidator, validate, updateCanteen);

router.get('/:id', getCanteenById);

export default router;
