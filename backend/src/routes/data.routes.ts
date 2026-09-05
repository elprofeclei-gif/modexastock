import { Router } from 'express';
import multer from 'multer';
import {
  importProducts,
  downloadBackup,
  downloadInventoryReport,
  downloadSalesReport,
  downloadAuditLogReport,
  downloadCashHistoryReport,
  downloadTreasuryReport,
  downloadKardexReport,
  downloadProfitLossReport,
  downloadClientsDebtReport,
  downloadCashiersBalanceReport,
  downloadLowStockReport,
  downloadSalesRankingReport,
} from '../controllers/data.controller';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Solo Admin y Manager pueden usar estas rutas
router.use(authMiddleware, roleMiddleware(['ADMIN', 'MANAGER']));

router.post('/import/products', upload.single('file'), importProducts);
router.get('/backup', downloadBackup);
router.get('/reports/inventory', downloadInventoryReport);
router.get('/reports/sales', downloadSalesReport); // <-- Nuevo reporte
router.get('/reports/audit-logs', downloadAuditLogReport);
router.get('/reports/cash-history', downloadCashHistoryReport);
router.get('/reports/treasury', downloadTreasuryReport);
router.get('/reports/kardex', downloadKardexReport);
router.get('/reports/profit-loss', downloadProfitLossReport);
router.get('/reports/clients-debt', downloadClientsDebtReport);
router.get('/reports/cashiers-balance', downloadCashiersBalanceReport);
router.get('/reports/low-stock', downloadLowStockReport);
router.get('/reports/sales-ranking', downloadSalesRankingReport);

export default router;
