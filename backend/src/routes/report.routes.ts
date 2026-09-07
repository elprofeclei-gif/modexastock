import { Router } from 'express';
import {
  getDashboardStats,
  downloadSalesReport,
  getProfitLoss,
  downloadInventoryReport,
} from '../controllers/report.controller';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware';

const router = Router();

/**
 * @swagger
 * /reports/dashboard:
 *   get:
 *     summary: Obtener métricas del Dashboard
 *     description: Calcula KPIs en tiempo real (Ventas hoy, utilidad, bajo stock, etc.) según el rol del usuario.
 *     security:
 *       - bearerAuth: []
 */
router.get('/dashboard', authMiddleware, roleMiddleware(['ADMIN', 'MANAGER']), getDashboardStats);

/**
 * @swagger
 * /reports/sales/csv:
 *   get:
 *     summary: Descargar reporte de ventas (CSV)
 *     description: Genera un archivo CSV con el historial de ventas.
 *     security:
 *       - bearerAuth: []
 */
router.get('/sales/csv', authMiddleware, roleMiddleware(['ADMIN', 'MANAGER']), downloadSalesReport);

/**
 * @swagger
 * /reports/profit-loss:
 *   get:
 *     summary: Reporte de Utilidades (P&G)
 *     description: Calcula el Estado de Resultados histórico (Ingresos - COGS - Gastos = Utilidad Neta).
 *     security:
 *       - bearerAuth: []
 */
router.get('/profit-loss', authMiddleware, roleMiddleware(['ADMIN', 'MANAGER']), getProfitLoss);

/**
 * @swagger
 * /reports/inventory/csv:
 *   get:
 *     summary: Descargar reporte de inventario (CSV)
 *     description: Genera un archivo CSV con el stock actual de productos.
 *     security:
 *       - bearerAuth: []
 */
router.get('/inventory/csv', authMiddleware, roleMiddleware(['ADMIN', 'MANAGER']), downloadInventoryReport);

export default router;