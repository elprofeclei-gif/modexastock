import { Router } from 'express';
import { getSettings, updateSettings, getCatalogs, createCatalogItem, deleteCatalogItem } from '../controllers/setting.controller';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware';

const router = Router();
router.use(authMiddleware);

router.get('/', getSettings);
router.put('/', roleMiddleware(['ADMIN', 'MANAGER']), updateSettings);
router.get('/catalogs', getCatalogs);
router.post('/catalogs', roleMiddleware(['ADMIN', 'MANAGER']), createCatalogItem);
router.delete('/catalogs/:type/:id', roleMiddleware(['ADMIN', 'MANAGER']), deleteCatalogItem);

export default router;