import { Router } from 'express';
import multer from 'multer';
import { importProducts, downloadBackup, downloadInventoryReport, downloadSalesReport } from '../controllers/data.controller';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Solo Admin y Manager pueden usar estas rutas
router.use(authMiddleware, roleMiddleware(['ADMIN', 'MANAGER']));

router.post('/import/products', upload.single('file'), importProducts);
router.get('/backup', downloadBackup);
router.get('/reports/inventory', downloadInventoryReport);
router.get('/reports/sales', downloadSalesReport); // <-- Nuevo reporte

export default router;