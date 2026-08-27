import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';

export interface CustomRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export const authMiddleware = async (req: CustomRequest, res: Response, next: NextFunction) => {
  // 1. Leer el token de las cookies
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ status: 'error', message: 'Token no proporcionado' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as {
      id: string;
      role: string;
    };

    // 2. VERIFICACIÓN EN TIEMPO REAL: Consultar la BD para ver si el usuario sigue activo
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user || !user.isActive) {
      // Si fue desactivado, limpiamos la cookie y lanzamos error 401
      res.clearCookie('token');
      return res
        .status(401)
        .json({ status: 'error', message: 'Tu sesión ha sido cerrada por un administrador.' });
    }

    // 3. Inyectamos el usuario en la request
    req.user = { id: user.id, role: user.role };
    next();
  } catch (error) {
    return res.status(401).json({ status: 'error', message: 'Token inválido o expirado' });
  }
};

export const roleMiddleware = (roles: string[]) => {
  return (req: CustomRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ status: 'error', message: 'Acceso denegado. No tienes permisos suficientes.' });
    }
    next();
  };
};
