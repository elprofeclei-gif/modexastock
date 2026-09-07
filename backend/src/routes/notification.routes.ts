import { Router } from 'express';
import { getMyNotifications } from '../controllers/notification.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
router.use(authMiddleware);

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Obtener notificaciones del usuario
 *     description: Obtiene alertas agrupadas por categoría (bajo stock, descuadres, etc.) según el rol del usuario.
 *     security:
 *       - bearerAuth: []
 */
router.get('/', getMyNotifications);

export default router;
