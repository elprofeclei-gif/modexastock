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
} from '../controllers/pos.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/cash-register/current', getCurrentCashRegister);
router.get('/cash-register/history', getCashRegisterHistory);
router.post('/cash-register/open', openCashRegister);
router.post('/cash-register/close', closeCashRegister);
router.post('/cash-register/transfer-in', transferToCashRegister);
router.post('/cash-register/withdraw', withdrawFromCashRegister); // <-- NUEVO

router.get('/products/search', searchProduct);
router.post('/sales', processSale);

export default router;
