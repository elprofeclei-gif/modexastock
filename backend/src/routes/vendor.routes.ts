import { Router } from 'express';
import { createVendor, getVendors, payVendor } from '../controllers/vendor.controller';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware); // Todo requiere login

// Cualquier usuario logueado puede ver los proveedores (por si necesita buscar uno en una compra)
router.get('/', getVendors);

// Solo Admin y Manager pueden crear proveedores o pagarles deudas
router.post('/', roleMiddleware(['ADMIN', 'MANAGER']), createVendor);
router.post('/:id/pay', roleMiddleware(['ADMIN', 'MANAGER']), payVendor);

export default router;
