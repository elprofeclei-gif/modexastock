import { Router } from 'express';
import { getPhysicalBoxes } from '../controllers/box.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
router.use(authMiddleware);

router.get('/', getPhysicalBoxes);

export default router;