import { Router } from 'express';
import { getMyNotifications } from '../controllers/notification.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
router.use(authMiddleware);
router.get('/', getMyNotifications);

export default router;
