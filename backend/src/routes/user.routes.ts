import { Router } from 'express';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  getUsersWithBalance,
  settleUserBalance,
  updateMyProfile,
  changeMyPassword
} from '../controllers/user.controller';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// 1. Todas las rutas de este archivo requieren estar logueado
router.use(authMiddleware);

// 2. Rutas de MI PERFIL (Cualquier usuario logueado puede actualizar su propio perfil)
router.put('/profile', updateMyProfile);
router.put('/change-password', changeMyPassword);

// 3. Rutas de DESCUADRES (Solo Admin y Manager pueden ver y cobrar deudas de cajeros)
router.get('/balances', roleMiddleware(['ADMIN', 'MANAGER']), getUsersWithBalance);
router.post('/:id/settle-balance', roleMiddleware(['ADMIN', 'MANAGER']), settleUserBalance);

// 4. Rutas de GESTIÓN DE USUARIOS (Solo Admin puede ver, crear, editar o desactivar cajeros)
router.get('/', roleMiddleware(['ADMIN']), getUsers);
router.post('/', roleMiddleware(['ADMIN']), createUser);
router.put('/:id', roleMiddleware(['ADMIN']), updateUser);
router.put('/:id/toggle-status', roleMiddleware(['ADMIN']), toggleUserStatus);
router.delete('/:id', roleMiddleware(['ADMIN']), deleteUser);

export default router;