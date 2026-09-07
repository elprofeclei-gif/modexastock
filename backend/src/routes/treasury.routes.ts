import { Router } from 'express';
import {
  getAccounts,
  createAccount,
  getExpenseCategories,
  createExpenseCategory,
  createExpense,
  getExpenses,
  getTransactions,
  createManualTransaction,
} from '../controllers/treasury.controller';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * /treasury/accounts:
 *   get:
 *     summary: Listar cuentas de tesorería
 *     description: Obtiene las cuentas de bancos y caja fuerte con sus saldos actuales.
 *     security:
 *       - bearerAuth: []
 */
router.get('/accounts', getAccounts);

/**
 * @swagger
 * /treasury/accounts:
 *   post:
 *     summary: Crear cuenta
 *     description: Crea una nueva cuenta de tesorería (Banco o Caja Fuerte). Requiere Admin/Manager.
 *     security:
 *       - bearerAuth: []
 */
router.post('/accounts', roleMiddleware(['ADMIN', 'MANAGER']), createAccount);

/**
 * @swagger
 * /treasury/expenses/categories:
 *   get:
 *     summary: Listar categorías de gastos
 *     security:
 *       - bearerAuth: []
 */
router.get('/expenses/categories', getExpenseCategories);

/**
 * @swagger
 * /treasury/expenses/categories:
 *   post:
 *     summary: Crear categoría de gasto
 *     security:
 *       - bearerAuth: []
 */
router.post('/expenses/categories', roleMiddleware(['ADMIN', 'MANAGER']), createExpenseCategory);

/**
 * @swagger
 * /treasury/expenses:
 *   get:
 *     summary: Listar gastos
 *     security:
 *       - bearerAuth: []
 *   post:
 *     summary: Crear gasto
 *     description: Registra un egreso operativo. Requiere Admin/Manager.
 *     security:
 *       - bearerAuth: []
 */
router.get('/expenses', getExpenses);
router.post('/expenses', roleMiddleware(['ADMIN', 'MANAGER']), createExpense);

/**
 * @swagger
 * /treasury/transactions:
 *   get:
 *     summary: Listar movimientos
 *     description: Obtiene el historial de transacciones de tesorería.
 *     security:
 *       - bearerAuth: []
 *   post:
 *     summary: Crear movimiento manual
 *     description: Crea un depósito o retiro manual en una cuenta. Requiere Admin/Manager.
 *     security:
 *       - bearerAuth: []
 */
router.get('/transactions', getTransactions);
router.post('/transactions', roleMiddleware(['ADMIN', 'MANAGER']), createManualTransaction);

export default router;
