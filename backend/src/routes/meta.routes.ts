import { Router } from 'express';
import { getMetadata } from '../controllers/meta.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware); // Solo usuarios del sistema pueden ver los catálogos

router.get('/', getMetadata);

export default router;
