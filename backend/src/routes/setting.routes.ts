import { Router } from 'express';
import {
  getSettings,
  updateSettings,
  getCatalogs,
  createCatalogItem,
  deleteCatalogItem,
  cleanupEmptyCatalogs,
} from '../controllers/setting.controller';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware';

const router = Router();
router.use(authMiddleware); // Todo requiere login

/**
 * @swagger
 * /settings:
 *   get:
 *     summary: Obtener configuración
 *     description: Obtiene la configuración de la empresa (nombre, NIT, mensajes de ticket, márgenes).
 *     security:
 *       - bearerAuth: []
 */
router.get('/', getSettings);

/**
 * @swagger
 * /settings/catalogs:
 *   get:
 *     summary: Obtener catálogos
 *     description: Lista categorías, marcas, tallas y colores.
 *     security:
 *       - bearerAuth: []
 */
router.get('/catalogs', getCatalogs);

/**
 * @swagger
 * /settings:
 *   put:
 *     summary: Actualizar configuración
 *     description: Actualiza los datos de la empresa. Requiere rol ADMIN o MANAGER.
 *     security:
 *       - bearerAuth: []
 */
router.put('/', roleMiddleware(['ADMIN', 'MANAGER']), updateSettings);

/**
 * @swagger
 * /settings/catalogs:
 *   post:
 *     summary: Crear item de catálogo
 *     description: Crea una nueva categoría, marca, talla o color. Requiere rol ADMIN o MANAGER.
 *     security:
 *       - bearerAuth: []
 */
router.post('/catalogs', roleMiddleware(['ADMIN', 'MANAGER']), createCatalogItem);

/**
 * @swagger
 * /settings/catalogs/{type}/{id}:
 *   delete:
 *     summary: Eliminar/Desactivar item de catálogo
 *     description: Realiza un Soft delete de una categoría o marca. Requiere rol ADMIN o MANAGER.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
router.delete('/catalogs/:type/:id', roleMiddleware(['ADMIN', 'MANAGER']), deleteCatalogItem);

/**
 * @swagger
 * /settings/catalogs/cleanup:
 *   delete:
 *     summary: Limpiar catálogos vacíos
 *     description: Elimina permanentemente las categorías y marcas que no tienen productos asociados.
 *     security:
 *       - bearerAuth: []
 */
router.delete('/catalogs/cleanup', roleMiddleware(['ADMIN', 'MANAGER']), cleanupEmptyCatalogs);

export default router;