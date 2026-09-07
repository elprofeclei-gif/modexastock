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

/**
 * @swagger
 * /data/import/products:
 *   post:
 *     summary: Importar productos desde Excel
 *     description: Sube un archivo Excel/CSV para crear o actualizar productos masivamente. Requiere multipart/form-data.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 */
router.post('/import/products', upload.single('file'), importProducts);

/**
 * @swagger
 * /data/backup:
 *   get:
 *     summary: Descargar Backup de Base de Datos
 *     description: Genera y descarga un archivo JSON con toda la información de la base de datos.
 *     security:
 *       - bearerAuth: []
 */
router.get('/backup', downloadBackup);

/**
 * @swagger
 * /data/reports/inventory:
 *   get:
 *     summary: Reporte de Inventario (CSV)
 *     description: Exporta el stock actual desglosado por variante.
 *     security:
 *       - bearerAuth: []
 */
router.get('/reports/inventory', downloadInventoryReport);

/**
 * @swagger
 * /data/reports/sales:
 *   get:
 *     summary: Reporte de Ventas (CSV)
 *     description: Exporta todas las facturas con cajero, método de pago y totales.
 *     security:
 *       - bearerAuth: []
 */
router.get('/reports/sales', downloadSalesReport);

/**
 * @swagger
 * /data/reports/audit-logs:
 *   get:
 *     summary: Reporte de Bitácora (CSV)
 *     description: Exporta el registro de auditoría del sistema.
 *     security:
 *       - bearerAuth: []
 */
router.get('/reports/audit-logs', downloadAuditLogReport);

/**
 * @swagger
 * /data/reports/cash-history:
 *   get:
 *     summary: Reporte de Historial de Cajas (CSV)
 *     description: Exporta el historial de arqueos, faltantes y sobrantes.
 *     security:
 *       - bearerAuth: []
 */
router.get('/reports/cash-history', downloadCashHistoryReport);

/**
 * @swagger
 * /data/reports/treasury:
 *   get:
 *     summary: Reporte de Tesorería (CSV)
 *     description: Exporta los movimientos de bancos y gastos operativos.
 *     security:
 *       - bearerAuth: []
 */
router.get('/reports/treasury', downloadTreasuryReport);

/**
 * @swagger
 * /data/reports/kardex:
 *   get:
 *     summary: Reporte Kardex General (CSV)
 *     description: Exporta el historial completo de movimientos de inventario.
 *     security:
 *       - bearerAuth: []
 */
router.get('/reports/kardex', downloadKardexReport);

/**
 * @swagger
 * /data/reports/profit-loss:
 *   get:
 *     summary: Estado de Resultados / Utilidades (CSV)
 *     description: Calcula Ingresos, COGS y Gastos para obtener la Utilidad Neta.
 *     security:
 *       - bearerAuth: []
 */
router.get('/reports/profit-loss', downloadProfitLossReport);

/**
 * @swagger
 * /data/reports/clients-debt:
 *   get:
 *     summary: Cartera de Clientes (CSV)
 *     description: Exporta la lista de clientes con sus deudas actuales.
 *     security:
 *       - bearerAuth: []
 */
router.get('/reports/clients-debt', downloadClientsDebtReport);

/**
 * @swagger
 * /data/reports/cashiers-balance:
 *   get:
 *     summary: Descuadres de Cajeros (CSV)
 *     description: Exporta la lista de cajeros con faltantes o sobrantes pendientes.
 *     security:
 *       - bearerAuth: []
 */
router.get('/reports/cashiers-balance', downloadCashiersBalanceReport);

/**
 * @swagger
 * /data/reports/low-stock:
 *   get:
 *     summary: Productos Agotados / Bajo Stock (CSV)
 *     description: Exporta los productos que requieren reabastecimiento urgente.
 *     security:
 *       - bearerAuth: []
 */
router.get('/reports/low-stock', downloadLowStockReport);

/**
 * @swagger
 * /data/reports/sales-ranking:
 *   get:
 *     summary: Ranking de Ventas y Rentabilidad (CSV)
 *     description: Analiza qué productos generan más ingresos y ganancias.
 *     security:
 *       - bearerAuth: []
 */
router.get('/reports/sales-ranking', downloadSalesRankingReport);

export default router;