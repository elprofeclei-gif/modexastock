import { Router } from 'express';
import {
  getClients,
  createClient,
  updateClient,
  deleteClient,
  addClientPayment,
  searchClients,
} from '../controllers/client.controller';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware'; // ✅ Importado roleMiddleware

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Rutas accesibles para todos (Cajeros pueden ver clientes y registrar abonos)
router.get('/', getClients);
router.get('/search', searchClients);
router.post('/:id/payments', addClientPayment);

// ✅ Rutas protegidas (Solo ADMIN y MANAGER pueden crear, editar o eliminar)
router.post('/', roleMiddleware(['ADMIN', 'MANAGER', 'USER']), createClient);
router.put('/:id', roleMiddleware(['ADMIN', 'MANAGER', 'USER']), updateClient);
router.delete('/:id', roleMiddleware(['ADMIN', 'MANAGER']), deleteClient);

export default router;
