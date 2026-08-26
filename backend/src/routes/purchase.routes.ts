import { Router } from 'express';
import { createPurchase, getPurchases } from '../controllers/purchase.controller';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Aplicamos autenticación, y luego solo ADMIN y MANAGER pueden acceder a estas rutas
router.use(authMiddleware, roleMiddleware(['ADMIN', 'MANAGER']));

router.post('/', createPurchase);
router.get('/', getPurchases);

export default router;
