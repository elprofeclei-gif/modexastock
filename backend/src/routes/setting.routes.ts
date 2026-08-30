import { Router } from 'express';
import {
  getSettings,
  updateSettings,
  getCatalogs,
  createCatalogItem,
  deleteCatalogItem,
  cleanupEmptyCatalogs,
} from '../controllers/setting.controller';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware';

const router = Router();
router.use(authMiddleware); // Todo requiere login

// Cualquier usuario logueado necesita leer la configuración (para imprimir tickets con el nombre de la empresa)
router.get('/', getSettings);
router.get('/catalogs', getCatalogs);

// Solo Admin y Manager pueden alterar la configuración y los catálogos
router.put('/', roleMiddleware(['ADMIN', 'MANAGER']), updateSettings);
router.post('/catalogs', roleMiddleware(['ADMIN', 'MANAGER']), createCatalogItem);
router.delete('/catalogs/:type/:id', roleMiddleware(['ADMIN', 'MANAGER']), deleteCatalogItem);
router.delete('/catalogs/cleanup', roleMiddleware(['ADMIN', 'MANAGER']), cleanupEmptyCatalogs);

export default router;
