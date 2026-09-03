import rateLimit from 'express-rate-limit';

// Limitador para el login (previene fuerza bruta)
export const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 10, // Máximo 10 intentos de login cada 10 minutos por IP
  message: {
    status: 'error',
    message: 'Demasiados intentos fallidos. Cuenta bloqueada por 10 minutos.',
  },
});
