import { Router } from 'express';
import { getAuditLogs } from '../controllers/audit.controller';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// ✅ Doble seguridad: Todo requiere estar logueado Y ser Admin/Manager
router.use(authMiddleware, roleMiddleware(['ADMIN', 'MANAGER']));

/**
 * @swagger
 * /audit:
 *   get:
 *     summary: Obtener bitácora del sistema
 *     description: Consulta el registro inmutable de acciones críticas (anulaciones, ajustes, cierres forzosos).
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de registros de auditoría
 */
router.get('/', getAuditLogs);

export default router;