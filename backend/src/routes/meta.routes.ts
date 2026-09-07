import { Router } from 'express';
import { getMetadata } from '../controllers/meta.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware); // Solo usuarios del sistema pueden ver los catálogos

/**
 * @swagger
 * /meta:
 *   get:
 *     summary: Obtener metadatos
 *     description: Obtiene catálogos rápidos (categorías, marcas, tallas, colores) para llenar selects en el frontend.
 *     security:
 *       - bearerAuth: []
 */
router.get('/', getMetadata);

export default router;