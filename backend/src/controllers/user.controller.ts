import { Response } from 'express';
import { CustomRequest } from '../middlewares/auth.middleware';
import prisma from '../config/prisma';
import bcrypt from 'bcryptjs';

export const getUsers = async (req: CustomRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: { 
        id: true, 
        name: true, 
        email: true, 
        role: true, 
        createdAt: true,
        isActive: true // <-- AÑADE ESTO
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.status(200).json({ status: 'success', data: users });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Error interno' });
  }
};

export const createUser = async (req: CustomRequest, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    // Validación estricta
    if (!name || !email || !password || !role) {
      return res
        .status(400)
        .json({ status: 'error', message: 'Todos los campos son obligatorios' });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ status: 'error', message: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ status: 'error', message: 'El correo ya está registrado' });
    }

    // Hashear contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Crear usuario
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
      },
      select: { id: true, name: true, email: true, role: true },
    });

    return res.status(201).json({ status: 'success', data: newUser });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return res
      .status(500)
      .json({ status: 'error', message: error.message || 'Error interno del servidor' });
  }
};
// Actualizar usuario (ej. cambiar rol)
export const updateUser = async (req: CustomRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, role } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        name: name || undefined,
        role: role || undefined,
      },
      select: { id: true, name: true, email: true, role: true },
    });

    return res.status(200).json({ status: 'success', data: updatedUser });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Error al actualizar usuario' });
  }
};

// Eliminar usuario (Requiere Autorización de Admin)
export const deleteUser = async (req: CustomRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { adminEmail, adminPassword } = req.body;

    // 1. Validar que el que autoriza sea Admin
    const adminUser = await prisma.user.findFirst({
      where: { email: adminEmail, role: 'ADMIN', isActive: true }
    });

    if (!adminUser) {
      return res.status(403).json({ status: 'error', message: 'Correo de administrador no válido o sin permisos.' });
    }

    const isMatch = await bcrypt.compare(adminPassword, adminUser.password);
    if (!isMatch) {
      return res.status(403).json({ status: 'error', message: 'Contraseña de autorización incorrecta.' });
    }

    // 2. Validar que no se elimine a sí mismo
    if (id === req.user?.id) {
      return res.status(400).json({ status: 'error', message: 'No puedes eliminar tu propia cuenta' });
    }

    if (id === adminUser.id) {
      return res.status(400).json({ status: 'error', message: 'No puedes eliminar la cuenta que está autorizando.' });
    }

    // 3. Eliminar
    await prisma.user.delete({ where: { id } });
    return res.status(204).send();
  } catch (error: any) {
    console.error('Error al eliminar usuario:', error);
    return res.status(500).json({ status: 'error', message: 'Error al eliminar usuario' });
  }
};
// Cambiar estado activo/inactivo
export const toggleUserStatus = async (req: CustomRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) return res.status(404).json({ status: 'error', message: 'Usuario no encontrado' });
    if (id === req.user?.id)
      return res
        .status(400)
        .json({ status: 'error', message: 'No puedes desactivar tu propia cuenta' });

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });

    return res.status(200).json({ status: 'success', data: updatedUser });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Error al cambiar estado' });
  }
};
