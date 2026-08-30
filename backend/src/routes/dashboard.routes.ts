import { Router } from 'express';
import multer from 'multer';
import { importProducts, downloadBackup, downloadInventoryReport, downloadSalesReport } from '../controllers/data.controller';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() }); // Guarda el archivo en memoria temporalmente

// El acceso a datos maestros y backups es EXCLUSIVO de ADMIN
router.use(authMiddleware, roleMiddleware(['ADMIN']));

// Subir Excel de productos
router.post('/import-products', upload.single('file'), importProducts);

// Descargar Backup JSON
router.get('/backup', downloadBackup);

// Descargar Reportes CSV
router.get('/reports/inventory', downloadInventoryReport);
router.get('/reports/sales', downloadSalesReport);

export default router;