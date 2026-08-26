import { Router } from 'express';
import { createVendor, getVendors } from '../controllers/vendor.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
router.use(authMiddleware);

router.post('/', createVendor);
router.get('/', getVendors);

export default router;
