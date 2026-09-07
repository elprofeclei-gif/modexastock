import { Router } from 'express';
import {
  openCashRegister,
  searchProduct,
  processSale,
  closeCashRegister,
  getCurrentCashRegister,
  getCashRegisterHistory,
  transferToCashRegister,
  withdrawFromCashRegister,
  forceCloseCashRegister,
  suspendSale,
  getSuspendedSales,
  deleteSuspendedSale,
} from '../controllers/pos.controller';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * /pos/cash-register/current:
 *   get:
 *     summary: Obtener caja abierta actual
 *     description: Obtiene la información de la caja que el usuario autenticado tiene abierta actualmente, incluyendo el cálculo del efectivo esperado.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Información de la caja actual.
 *       404:
 *         description: No hay caja abierta.
 */
router.get('/cash-register/current', getCurrentCashRegister);

/**
 * @swagger
 * /pos/cash-register/history:
 *   get:
 *     summary: Historial de cajas
 *     description: Obtiene el historial de aperturas y cierres de caja del usuario.
 *     security:
 *       - bearerAuth: []
 */
router.get('/cash-register/history', getCashRegisterHistory);

/**
 * @swagger
 * /pos/cash-register/open:
 *   post:
 *     summary: Abrir turno de caja
 *     description: Inicia un turno de caja para el usuario autenticado. Si hay faltantes o sobrantes, requiere credenciales de administrador.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               physicalBoxId:
 *                 type: string
 *               openingAmount:
 *                 type: number
 *               adminEmail:
 *                 type: string
 *               adminPassword:
 *                 type: string
 *               originAccountId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Caja abierta correctamente
 */
router.post('/cash-register/open', openCashRegister);

/**
 * @swagger
 * /pos/cash-register/close:
 *   post:
 *     summary: Cerrar turno de caja (Arqueo)
 *     description: Realiza el arqueo de caja, calcula descuadres y los aplica al balance del usuario.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Caja cerrada correctamente
 */
router.post('/cash-register/close', closeCashRegister);

/**
 * @swagger
 * /pos/cash-register/transfer-in:
 *   post:
 *     summary: Inyectar fondo a caja
 *     description: Transfiere dinero desde una cuenta bancaria hacia la caja física actual. Requiere autorización de administrador.
 *     security:
 *       - bearerAuth: []
 */
router.post('/cash-register/transfer-in', transferToCashRegister);

/**
 * @swagger
 * /pos/cash-register/withdraw:
 *   post:
 *     summary: Retirar fondo de caja (Sangría)
 *     description: Retira dinero de la caja física actual hacia una cuenta bancaria o como gasto. Requiere autorización de administrador.
 *     security:
 *       - bearerAuth: []
 */
router.post('/cash-register/withdraw', withdrawFromCashRegister);

/**
 * @swagger
 * /pos/products/search:
 *   get:
 *     summary: Buscar producto para POS
 *     description: Busca productos por nombre o SKU para agregarlos rápidamente al carrito.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         required: true
 *         description: Texto a buscar (SKU o Nombre)
 */
router.get('/products/search', searchProduct);

/**
 * @swagger
 * /pos/sales:
 *   post:
 *     summary: Procesar venta POS
 *     description: Registra una venta, descuenta inventario y registra el movimiento en Kardex. Soporta pagos mixtos.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Venta procesada exitosamente
 */
router.post('/sales', processSale);

/**
 * @swagger
 * /pos/sales/suspend:
 *   post:
 *     summary: Suspender venta
 *     description: Guarda el carrito actual en la base de datos para liberar la pantalla del POS.
 *     security:
 *       - bearerAuth: []
 */
router.post('/sales/suspend', suspendSale);

/**
 * @swagger
 * /pos/sales/suspended:
 *   get:
 *     summary: Listar ventas suspendidas
 *     description: Obtiene las ventas pausadas del usuario autenticado.
 *     security:
 *       - bearerAuth: []
 */
router.get('/sales/suspended', getSuspendedSales);

/**
 * @swagger
 * /pos/sales/suspended/{id}:
 *   delete:
 *     summary: Eliminar venta suspendida
 *     description: Borra una venta suspendida de la base de datos (al recuperarla o cancelarla).
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.delete('/sales/suspended/:id', deleteSuspendedSale);

/**
 * @swagger
 * /pos/cash-register/{id}/force-close:
 *   post:
 *     summary: Forzar cierre de caja
 *     description: Permite a un Administrador o Gerente forzar el cierre de una caja abierta por otro usuario. El descuadre se aplica al cajero original.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.post(
  '/cash-register/:id/force-close',
  roleMiddleware(['ADMIN', 'MANAGER']),
  forceCloseCashRegister
);

export default router;
