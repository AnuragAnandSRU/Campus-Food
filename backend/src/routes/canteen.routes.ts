import { Router } from 'express';
// import { protect, restrictTo } from '../middleware/auth.middleware';
import { getAllCanteens, getCanteenById } from '../controllers/canteen.controller';

const router = Router();

// Public routes — student browse
router.get('/', getAllCanteens);
router.get('/:id', getCanteenById);

// TODO (admin/owner step): protected create/update/delete
// router.use(protect);
// router.post('/', restrictTo('admin'), createCanteen);
// router.put('/:id', restrictTo('owner', 'admin'), updateCanteen);
// router.delete('/:id', restrictTo('admin'), deleteCanteen);

export default router;
