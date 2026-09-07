import { Router } from 'express';
import { getBrands, createBrand, toggleBrandStatus } from '../controllers/brand.controller';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware); // Todo requiere login

/**
 * @swagger
 * /brands:
 *   get:
 *     summary: Listar marcas
 *     description: Obtiene todas las marcas activas.
 *     security:
 *       - bearerAuth: []
 */
router.get('/', getBrands);

/**
 * @swagger
 * /brands:
 *   post:
 *     summary: Crear marca
 *     description: Crea una nueva marca. Requiere rol ADMIN o MANAGER.
 *     security:
 *       - bearerAuth: []
 */
router.post('/', roleMiddleware(['ADMIN', 'MANAGER']), createBrand);

/**
 * @swagger
 * /brands/{id}/toggle-status:
 *   patch:
 *     summary: Activar/Desactivar marca
 *     description: Cambia el estado de una marca (Soft delete). Requiere rol ADMIN o MANAGER.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.patch('/:id/toggle-status', roleMiddleware(['ADMIN', 'MANAGER']), toggleBrandStatus);

export default router;
