import { Router } from 'express';
import { createBrand } from '../controllers/brand.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
router.use(authMiddleware);

router.post('/', createBrand);

export default router;
