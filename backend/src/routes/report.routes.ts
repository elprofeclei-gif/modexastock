import { Router } from 'express';
import {
  getDashboardStats,
  downloadSalesReport,
  getProfitLoss,
  downloadInventoryReport,
} from '../controllers/report.controller';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.get('/dashboard', authMiddleware, roleMiddleware(['ADMIN', 'MANAGER']), getDashboardStats);
router.get('/sales/csv', authMiddleware, roleMiddleware(['ADMIN', 'MANAGER']), downloadSalesReport); // <-- Nuevo
router.get('/profit-loss', authMiddleware, roleMiddleware(['ADMIN', 'MANAGER']), getProfitLoss);
router.get(
  '/inventory/csv',
  authMiddleware,
  roleMiddleware(['ADMIN', 'MANAGER']),
  downloadInventoryReport
);

export default router;
