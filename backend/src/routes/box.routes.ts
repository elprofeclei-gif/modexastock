import { Router } from 'express';
import { getPhysicalBoxes, createPhysicalBox } from '../controllers/box.controller';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Cualquier usuario logueado puede ver las cajas disponibles
router.get('/', getPhysicalBoxes);

// Solo ADMIN y MANAGER pueden crear cajas físicas
router.post('/', roleMiddleware(['ADMIN', 'MANAGER']), createPhysicalBox);

export default router;