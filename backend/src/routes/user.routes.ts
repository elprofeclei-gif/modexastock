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
  changeMyPassword,
} from '../controllers/user.controller';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware';

const router = Router();

// 1. Todas las rutas de este archivo requieren estar logueado
router.use(authMiddleware);

/**
 * @swagger
 * /users/profile:
 *   put:
 *     summary: Actualizar mi perfil
 *     description: El usuario autenticado actualiza su nombre, email o teléfono.
 *     security:
 *       - bearerAuth: []
 */
router.put('/profile', updateMyProfile);

/**
 * @swagger
 * /users/change-password:
 *   put:
 *     summary: Cambiar mi contraseña
 *     description: El usuario autenticado cambia su contraseña. Debe proporcionar la contraseña actual.
 *     security:
 *       - bearerAuth: []
 */
router.put('/change-password', changeMyPassword);

/**
 * @swagger
 * /users/balances:
 *   get:
 *     summary: Listar descuadres de cajeros
 *     description: Obtiene usuarios con balance != 0 (faltantes o sobrantes). Requiere Admin/Manager.
 *     security:
 *       - bearerAuth: []
 */
router.get('/balances', roleMiddleware(['ADMIN', 'MANAGER']), getUsersWithBalance);

/**
 * @swagger
 * /users/{id}/settle-balance:
 *   post:
 *     summary: Cobrar descuadre a cajero
 *     description: Registra el pago de un descuadre por parte de un cajero. Requiere Admin/Manager.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.post('/:id/settle-balance', roleMiddleware(['ADMIN', 'MANAGER']), settleUserBalance);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Listar usuarios
 *     description: Obtiene todos los usuarios del sistema. Requiere rol ADMIN.
 *     security:
 *       - bearerAuth: []
 *   post:
 *     summary: Crear usuario
 *     description: Crea un nuevo usuario. Requiere rol ADMIN.
 *     security:
 *       - bearerAuth: []
 */
router.get('/', roleMiddleware(['ADMIN']), getUsers);
router.post('/', roleMiddleware(['ADMIN']), createUser);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Actualizar usuario
 *     description: Actualiza datos de un usuario. Requiere rol ADMIN.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.put('/:id', roleMiddleware(['ADMIN']), updateUser);

/**
 * @swagger
 * /users/{id}/toggle-status:
 *   put:
 *     summary: Activar/Desactivar usuario
 *     description: Cambia el estado de un usuario. Requiere rol ADMIN.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.put('/:id/toggle-status', roleMiddleware(['ADMIN']), toggleUserStatus);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Eliminar usuario
 *     description: Elimina a un usuario del sistema. Requiere rol ADMIN.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.delete('/:id', roleMiddleware(['ADMIN']), deleteUser);

export default router;
