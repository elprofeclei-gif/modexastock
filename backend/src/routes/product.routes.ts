import { Router } from 'express';
import {
  getProducts,
  createProduct,
  getProductById,
  updateProduct,
  deleteProduct,
  adjustStock,
  getProductKardex,
  getLowStockAlerts,
} from '../controllers/product.controller';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Todo requiere estar logueado
router.use(authMiddleware);

// Rutas accesibles para todos los usuarios (Cajeros, Vendedores)
router.get('/', getProducts);
router.get('/:id', getProductById);
router.get('/low-stock-alerts', getLowStockAlerts);

// Rutas protegidas (Solo ADMIN y MANAGER)
router.post('/', roleMiddleware(['ADMIN', 'MANAGER']), createProduct);
router.put('/:id', roleMiddleware(['ADMIN', 'MANAGER']), updateProduct);
router.delete('/:id', roleMiddleware(['ADMIN', 'MANAGER']), deleteProduct);

// Rutas de Auditoría (Solo ADMIN y MANAGER pueden ver el Kardex)
router.get('/variants/:variantId/kardex', roleMiddleware(['ADMIN', 'MANAGER']), getProductKardex);

// El ajuste de stock requiere admin, pero lo validamos dentro del controlador con bcrypt
router.post('/variants/:id/adjust', adjustStock);

export default router;
