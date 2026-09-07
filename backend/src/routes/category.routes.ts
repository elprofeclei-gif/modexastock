import { Router } from 'express';
import { createCategory, toggleCategoryStatus } from '../controllers/category.controller';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware); // Todo requiere login

/**
 * @swagger
 * /categories:
 *   post:
 *     summary: Crear categoría
 *     description: Crea una nueva categoría. Requiere rol ADMIN o MANAGER.
 *     security:
 *       - bearerAuth: []
 */
router.post('/', roleMiddleware(['ADMIN', 'MANAGER']), createCategory);

/**
 * @swagger
 * /categories/{id}/toggle-status:
 *   patch:
 *     summary: Activar/Desactivar categoría
 *     description: Cambia el estado de una categoría (Soft delete). Requiere rol ADMIN o MANAGER.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.patch('/:id/toggle-status', roleMiddleware(['ADMIN', 'MANAGER']), toggleCategoryStatus);

export default router;
