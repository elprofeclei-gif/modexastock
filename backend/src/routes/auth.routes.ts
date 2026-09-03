import { Router } from 'express';
import { login, updateProfile, logout } from '../controllers/auth.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { loginLimiter } from '../app'; // ✅ Importar el limitador

const router = Router();

// Rutas públicas
router.post('/login', loginLimiter, login);
router.post('/logout', logout);

// Rutas protegidas (requieren estar logueado)
router.put('/profile', authMiddleware, updateProfile);

export default router;
