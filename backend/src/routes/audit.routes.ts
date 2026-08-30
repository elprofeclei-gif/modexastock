import { Router } from 'express';
import { getAuditLogs } from '../controllers/audit.controller';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// ✅ Doble seguridad: Todo requiere estar logueado Y ser Admin/Manager
router.use(authMiddleware, roleMiddleware(['ADMIN', 'MANAGER']));

// Obtener historial de la bitácora con filtros
router.get('/', getAuditLogs);

export default router;