import { Router } from 'express';
import { createVendor, getVendors, payVendor } from '../controllers/vendor.controller';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware); // Todo requiere login

/**
 * @swagger
 * /vendors:
 *   get:
 *     summary: Listar proveedores
 *     description: Obtiene todos los proveedores con su balance de deuda actual.
 *     security:
 *       - bearerAuth: []
 */
router.get('/', getVendors);

/**
 * @swagger
 * /vendors:
 *   post:
 *     summary: Crear proveedor
 *     description: Crea un nuevo proveedor. Requiere rol ADMIN o MANAGER.
 *     security:
 *       - bearerAuth: []
 */
router.post('/', roleMiddleware(['ADMIN', 'MANAGER']), createVendor);

/**
 * @swagger
 * /vendors/{id}/pay:
 *   post:
 *     summary: Pagar deuda a proveedor
 *     description: Registra un pago que descuenta de la deuda del proveedor y saca el dinero de caja/banco. Requiere Admin/Manager.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.post('/:id/pay', roleMiddleware(['ADMIN', 'MANAGER']), payVendor);

export default router;
