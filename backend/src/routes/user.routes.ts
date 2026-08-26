import { Router } from 'express';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
} from '../controllers/user.controller';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// Aplicamos autenticación y luego verificación de rol ADMIN
router.use(authMiddleware, roleMiddleware(['ADMIN']));

router.get('/', getUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.put('/:id/toggle-status', toggleUserStatus);
router.delete('/:id', deleteUser);

export default router;
