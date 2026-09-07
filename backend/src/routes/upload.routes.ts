import { Router } from 'express';
import multer from 'multer';
import { uploadImage } from '../controllers/upload.controller';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Solo Admin y Manager pueden subir archivos al servidor
router.use(authMiddleware, roleMiddleware(['ADMIN', 'MANAGER']));

/**
 * @swagger
 * /upload/image:
 *   post:
 *     summary: Subir imagen a Cloudinary
 *     description: Sube un archivo de imagen y devuelve la URL segura. Requiere multipart/form-data. Admin/Manager.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 */
router.post('/image', upload.single('file'), uploadImage);

export default router;
