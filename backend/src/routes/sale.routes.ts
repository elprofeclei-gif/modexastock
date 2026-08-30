import { Router } from 'express';
import { getSales, voidSale } from '../controllers/sale.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();
router.use(authMiddleware);

router.get('/', getSales);
router.post('/:id/void', voidSale);

export default router;
