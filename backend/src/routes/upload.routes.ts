import { Router } from 'express';
import multer from 'multer';
import { uploadImage } from '../controllers/upload.controller';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Solo Admin y Manager pueden subir archivos al servidor
router.use(authMiddleware, roleMiddleware(['ADMIN', 'MANAGER']));

router.post('/image', upload.single('file'), uploadImage);

export default router;