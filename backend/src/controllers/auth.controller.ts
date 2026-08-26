import { Request, Response } from 'express';
import { CustomRequest } from '../middlewares/auth.middleware';
import prisma from '../config/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ status: 'error', message: 'Email y contraseña son obligatorios' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ status: 'error', message: 'Credenciales inválidas' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ status: 'error', message: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '8h' }
    );

    // GUARDAR TOKEN EN COOKIE HTTPONLY
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // true en producción (Render)
      sameSite: 'strict', // Previene CSRF
      maxAge: 8 * 60 * 60 * 1000, // 8 horas en milisegundos
    });

    return res.status(200).json({
      status: 'success',
      user: { id: user.id, name: user.name, email: user.email, role: user.role }, // Ya NO enviamos el token en el JSON
    });
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
  }
};

export const updateProfile = async (req: CustomRequest, res: Response) => {
  try {
    const userId = req.user?.id!;
    const { name, email, password } = req.body;

    const data: any = { name, email };

    // Si el usuario envía una nueva contraseña, la hasheamos
    if (password && password.length > 0) {
      const salt = await bcrypt.genSalt(10);
      data.password = await bcrypt.hash(password, salt);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, name: true, email: true, role: true },
    });

    return res.status(200).json({ status: 'success', data: updatedUser });
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({ status: 'error', message: 'Error al actualizar el perfil' });
  }
};

export const logout = async (req: Request, res: Response) => {
  res.clearCookie('token');
  return res.status(200).json({ status: 'success', message: 'Sesión cerrada' });
};
