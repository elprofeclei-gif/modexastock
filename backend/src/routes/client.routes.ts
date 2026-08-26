import { Router } from 'express';
import {
  getClients,
  createClient,
  updateClient,
  deleteClient,
  payClientDebt,
} from '../controllers/client.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Todas las rutas requieren autenticación, pero cualquier usuario (incluido cajero) puede acceder
router.use(authMiddleware);

router.get('/', getClients);
router.post('/', createClient); // <-- Esta es la ruta que se está llamando
router.put('/:id', updateClient);
router.delete('/:id', deleteClient);
router.post('/:id/pay-debt', payClientDebt);

export default router;
