import { Router } from 'express';
import { login, updateProfile, logout } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { loginLimiter } from '../middlewares/rateLimiter.middleware'; // ✅ Importar de aquí

const router = Router();

// Aplicamos el limitador de intentos aquí
router.post('/login', loginLimiter, login);
router.post('/logout', logout);

router.put('/profile', authMiddleware, updateProfile);

export default router;
