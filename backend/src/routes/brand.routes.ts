import { Router } from 'express';
import { getBrands, createBrand, toggleBrandStatus } from '../controllers/brand.controller';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware); // Todo requiere login

// Cualquier usuario logueado puede ver las marcas
router.get('/', getBrands);

// Solo Admin y Manager pueden crear o desactivar marcas
router.post('/', roleMiddleware(['ADMIN', 'MANAGER']), createBrand);
router.patch('/:id/toggle-status', roleMiddleware(['ADMIN', 'MANAGER']), toggleBrandStatus);

export default router;
