import { Router } from 'express';
import { getMetadata } from '../controllers/meta.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authMiddleware, getMetadata);

export default router;
