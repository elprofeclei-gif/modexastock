import { Router } from 'express';
import { createPurchase, getPurchases } from '../controllers/purchase.controller';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Aplicamos autenticación, y luego solo ADMIN y MANAGER pueden acceder a estas rutas
router.use(authMiddleware, roleMiddleware(['ADMIN', 'MANAGER']));

/**
 * @swagger
 * /purchases:
 *   post:
 *     summary: Registrar compra
 *     description: Registra una entrada de inventario y genera un egreso de dinero o deuda con proveedor. Requiere Admin/Manager.
 *     security:
 *       - bearerAuth: []
 */
router.post('/', createPurchase);

/**
 * @swagger
 * /purchases:
 *   get:
 *     summary: Listar compras
 *     description: Obtiene el historial de compras registradas.
 *     security:
 *       - bearerAuth: []
 */
router.get('/', getPurchases);

export default router;
