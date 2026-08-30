import { Router } from 'express';
import { createCategory, toggleCategoryStatus } from '../controllers/category.controller';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware); // Todo requiere login

// Solo Admin y Manager pueden modificar catálogos
router.post('/', roleMiddleware(['ADMIN', 'MANAGER']), createCategory);
router.patch('/:id/toggle-status', roleMiddleware(['ADMIN', 'MANAGER']), toggleCategoryStatus);

export default router;