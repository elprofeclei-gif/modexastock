import { Router } from 'express';
import { createCategory } from '../controllers/category.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
router.use(authMiddleware);

router.post('/', createCategory);

export default router;
