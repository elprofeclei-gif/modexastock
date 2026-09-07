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

/**
 * @swagger
 * /clients:
 *   get:
 *     summary: Listar clientes
 *     description: Obtiene todos los clientes registrados con su balance de deuda actual.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de clientes
 */
router.get('/', getClients);

/**
 * @swagger
 * /clients/search:
 *   get:
 *     summary: Buscar clientes (POS)
 *     description: Busca clientes por nombre, documento o teléfono para el autocompletado del POS.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         required: true
 *         description: Texto a buscar
 */
router.get('/search', searchClients);

/**
 * @swagger
 * /clients/{id}/payments:
 *   post:
 *     summary: Registrar abono de cliente
 *     description: Registra un pago para descontar de la deuda de un cliente. El dinero va directo a la caja o banco correspondiente.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Abono registrado
 */
router.post('/:id/payments', addClientPayment);

/**
 * @swagger
 * /clients:
 *   post:
 *     summary: Crear cliente
 *     description: Crea un nuevo cliente en el sistema.
 *     security:
 *       - bearerAuth: []
 */
router.post('/', roleMiddleware(['ADMIN', 'MANAGER', 'USER']), createClient);

/**
 * @swagger
 * /clients/{id}:
 *   put:
 *     summary: Actualizar cliente
 *     description: Actualiza los datos de un cliente existente.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.put('/:id', roleMiddleware(['ADMIN', 'MANAGER', 'USER']), updateClient);

/**
 * @swagger
 * /clients/{id}:
 *   delete:
 *     summary: Eliminar cliente
 *     description: Elimina un cliente del sistema. Requiere rol ADMIN o MANAGER.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.delete('/:id', roleMiddleware(['ADMIN', 'MANAGER']), deleteClient);

export default router;