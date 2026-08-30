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

router.get('/cash-register/current', getCurrentCashRegister);
router.get('/cash-register/history', getCashRegisterHistory);
router.post('/cash-register/open', openCashRegister);
router.post('/cash-register/close', closeCashRegister);
router.post('/cash-register/transfer-in', transferToCashRegister);
router.post('/cash-register/withdraw', withdrawFromCashRegister);
router.get('/products/search', searchProduct);
router.post('/sales', processSale);
router.post('/sales/suspend', suspendSale);
router.get('/sales/suspended', getSuspendedSales);
router.delete('/sales/suspended/:id', deleteSuspendedSale);

// NUEVA RUTA: Solo ADMIN y MANAGER
router.post(
  '/cash-register/:id/force-close',
  roleMiddleware(['ADMIN', 'MANAGER']),
  forceCloseCashRegister
);

export default router;
