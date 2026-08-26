import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extendemos la interfaz Request de Express para incluir nuestro usuario
export interface CustomRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}
// Middleware para verificar Auth
export const authMiddleware = (req: CustomRequest, res: Response, next: NextFunction) => {
  // Leer el token de las cookies en lugar de los headers
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ status: 'error', message: 'Token no proporcionado' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as {
      id: string;
      role: string;
    };
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ status: 'error', message: 'Token inválido o expirado' });
  }
};

// Middleware para verificar roles específicos
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
