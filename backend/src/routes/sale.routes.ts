import { Router } from 'express';
import { getSales, voidSale } from '../controllers/sale.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
router.use(authMiddleware);

/**
 * @swagger
 * /sales:
 *   get:
 *     summary: Listar ventas
 *     description: Obtiene el historial de ventas. Si es cajero, trae solo las suyas. Si es Admin, trae todas.
 *     security:
 *       - bearerAuth: []
 */
router.get('/', getSales);

/**
 * @swagger
 * /sales/{id}/void:
 *   post:
 *     summary: Anular venta
 *     description: Anula una venta, devuelve el inventario y revierte el dinero. Requiere credenciales de Administrador en el body.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.post('/:id/void', voidSale);

export default router;
