import { Router } from 'express';
import { login, updateProfile, logout } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.post('/login', login);
router.post('/logout', logout); // <-- Nueva ruta
router.put('/profile', authMiddleware, updateProfile);

export default router;
