import { Router } from 'express';
import { getPhysicalBoxes, createPhysicalBox } from '../controllers/box.controller';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

/**
 * @swagger
 * /boxes:
 *   get:
 *     summary: Listar cajas físicas
 *     description: Obtiene las cajas físicas disponibles para abrir turnos.
 *     security:
 *       - bearerAuth: []
 */
router.get('/', getPhysicalBoxes);

/**
 * @swagger
 * /boxes:
 *   post:
 *     summary: Crear caja física
 *     description: Crea una nueva caja física en el sistema. Requiere rol ADMIN o MANAGER.
 *     security:
 *       - bearerAuth: []
 */
router.post('/', roleMiddleware(['ADMIN', 'MANAGER']), createPhysicalBox);

export default router;