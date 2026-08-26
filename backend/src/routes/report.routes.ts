import { Router } from 'express';
import { getDashboardStats, downloadSalesReport } from '../controllers/report.controller';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.get('/dashboard', authMiddleware, roleMiddleware(['ADMIN', 'MANAGER']), getDashboardStats);
router.get('/sales/csv', authMiddleware, roleMiddleware(['ADMIN', 'MANAGER']), downloadSalesReport); // <-- Nuevo

export default router;
