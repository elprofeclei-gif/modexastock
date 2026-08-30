import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';

// Extendemos la interfaz de Request para que TypeScript reconozca req.user
export interface CustomRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

// Middleware de autenticación (Verifica token y si el usuario sigue activo)
export const authMiddleware = async (req: CustomRequest, res: Response, next: NextFunction) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ status: 'error', message: 'Token no proporcionado' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as {
      id: string;
      role: string;
    };

    // VERIFICACIÓN EN TIEMPO REAL
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user || !user.isActive) {
      res.clearCookie('token');
      return res
        .status(401)
        .json({ status: 'error', message: 'Tu sesión ha sido cerrada por un administrador.' });
    }

    req.user = { id: user.id, role: user.role };
    next();
  } catch (error) {
    return res.status(401).json({ status: 'error', message: 'Token inválido o expirado' });
  }
};

// Middleware de autorización (Verifica roles)
export const roleMiddleware = (roles: string[]) => {
  return (req: CustomRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      // ✅ MEJORA PARA AUDITORÍA: Registrar el intento de acceso denegado
      const userId = req.user?.id || 'Desconocido';
      const route = req.originalUrl;
      console.warn(
        `[AUDITORÍA DE SEGURIDAD] Acceso denegado. Usuario ID: ${userId} intentó acceder a ${route}. Roles permitidos: ${roles.join(', ')}`
      );

      return res
        .status(403)
        .json({ status: 'error', message: 'Acceso denegado. No tienes permisos suficientes.' });
    }
    next();
  };
};
