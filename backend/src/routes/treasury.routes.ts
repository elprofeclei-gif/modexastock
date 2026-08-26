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

router.get('/accounts', getAccounts);
router.post('/accounts', roleMiddleware(['ADMIN', 'MANAGER']), createAccount);

router.get('/expenses/categories', getExpenseCategories);
router.post('/expenses/categories', roleMiddleware(['ADMIN', 'MANAGER']), createExpenseCategory);

router.get('/expenses', getExpenses);
router.post('/expenses', roleMiddleware(['ADMIN', 'MANAGER']), createExpense);

router.get('/transactions', getTransactions);
router.post('/transactions', roleMiddleware(['ADMIN', 'MANAGER']), createManualTransaction);

export default router;
