import { Response } from 'express';
import { CustomRequest } from '../middlewares/auth.middleware';
import prisma from '../config/prisma';
import bcrypt from 'bcryptjs';
import { logAction } from '../utils/audit';

export const getUsers = async (req: CustomRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        isActive: true, // <-- AÑADE ESTO
      },
      orderBy: { createdAt: 'desc' },
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
      where: { email: adminEmail, role: 'ADMIN', isActive: true },
    });

    if (!adminUser) {
      return res
        .status(403)
        .json({ status: 'error', message: 'Correo de administrador no válido o sin permisos.' });
    }

    const isMatch = await bcrypt.compare(adminPassword, adminUser.password);
    if (!isMatch) {
      return res
        .status(403)
        .json({ status: 'error', message: 'Contraseña de autorización incorrecta.' });
    }

    // 2. Validar que no se elimine a sí mismo
    if (id === req.user?.id) {
      return res
        .status(400)
        .json({ status: 'error', message: 'No puedes eliminar tu propia cuenta' });
    }

    if (id === adminUser.id) {
      return res
        .status(400)
        .json({ status: 'error', message: 'No puedes eliminar la cuenta que está autorizando.' });
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

// OBTENER CAJEROS CON DESCUADRES PENDIENTES
export const getUsersWithBalance = async (req: CustomRequest, res: Response) => {
  try {
    // Buscamos usuarios cuyo balance NO sea 0
    const users = await prisma.user.findMany({
      where: {
        balance: { not: 0 },
        role: 'USER', // Solo cajeros, admins no deberían tener deudas
      },
      select: {
        id: true,
        name: true,
        email: true,
        balance: true,
      },
      orderBy: { balance: 'asc' }, // Los que más deben aparecen primero
    });

    return res.status(200).json({ status: 'success', data: users });
  } catch (error) {
    console.error('Error getting users with balance:', error);
    return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
  }
};

// COBRAR DESCUADRE A CAJERO
export const settleUserBalance = async (req: CustomRequest, res: Response) => {
  try {
    const { id } = req.params; // ID del usuario cajero
    const { amount, paymentMethod, accountId, physicalBoxId } = req.body;
    const adminId = req.user?.id!;
    const parsedAmount = parseFloat(amount) || 0;

    if (parsedAmount <= 0)
      return res.status(400).json({ status: 'error', message: 'El monto debe ser mayor a 0' });

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return res.status(404).json({ status: 'error', message: 'Cajero no encontrado' });

    // No podemos cobrarle más de lo que debe (si el balance es negativo)
    // Si el balance es -50, y paga 50, el nuevo balance es 0.
    const newBalance = user.balance + parsedAmount;

    await prisma.$transaction(async (tx) => {
      // 1. Reducir la deuda del cajero (acercar el balance a 0)
      await tx.user.update({
        where: { id },
        data: { balance: { increment: parsedAmount } },
      });

      // 2. Sumar el dinero a donde el admin lo recibió
      if (paymentMethod === 'CASH' && physicalBoxId) {
        await tx.physicalBox.update({
          where: { id: physicalBoxId },
          data: { balance: { increment: parsedAmount } },
        });
      } else if ((paymentMethod === 'CARD' || paymentMethod === 'TRANSFER') && accountId) {
        await tx.account.update({
          where: { id: accountId },
          data: { balance: { increment: parsedAmount } },
        });

        await tx.transaction.create({
          data: {
            amount: parsedAmount,
            type: 'DEPOSIT',
            concept: `Pago de descuadre de ${user.name}`,
            accountId,
          },
        });
      } else {
        throw new Error('Debes seleccionar el origen del dinero (Caja física o Banco)');
      }
    });

    // 3. Registrar en bitácora
    await logAction(
      adminId,
      'SETTLE_USER_BALANCE',
      'User',
      id,
      `Descuadre cobrado a ${user.name}. Monto: ${parsedAmount}. Nuevo balance: ${newBalance}.`
    );

    return res.status(200).json({ status: 'success', message: 'Descuadre cobrado correctamente.' });
  } catch (error: any) {
    console.error('Error settling balance:', error);
    return res
      .status(500)
      .json({ status: 'error', message: error.message || 'Error interno del servidor' });
  }
};

// ACTUALIZAR PERFIL PROPIO
export const updateMyProfile = async (req: CustomRequest, res: Response) => {
  try {
    const userId = req.user?.id!;
    const { name, phone, email } = req.body;

    if (!name) return res.status(400).json({ status: 'error', message: 'El nombre es obligatorio' });

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { name, phone, email },
      select: { id: true, name: true, email: true, phone: true, role: true }
    });

    return res.status(200).json({ status: 'success', data: updatedUser, message: 'Perfil actualizado correctamente' });
  } catch (error: any) {
    return res.status(500).json({ status: 'error', message: error.message || 'Error interno del servidor' });
  }
};

// CAMBIAR CONTRASEÑA PROPIA
export const changeMyPassword = async (req: CustomRequest, res: Response) => {
  try {
    const userId = req.user?.id!;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ status: 'error', message: 'Debes proporcionar la contraseña actual y la nueva' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ status: 'error', message: 'La nueva contraseña debe tener al menos 6 caracteres' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ status: 'error', message: 'Usuario no encontrado' });

    // Verificar que la contraseña actual sea correcta
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(403).json({ status: 'error', message: 'La contraseña actual es incorrecta' });
    }

    // Encriptar y guardar la nueva
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    // Registro en bitácora
    await logAction(userId, 'CHANGE_PASSWORD', 'User', userId, 'El usuario cambió su propia contraseña.');

    return res.status(200).json({ status: 'success', message: 'Contraseña actualizada correctamente' });
  } catch (error: any) {
    return res.status(500).json({ status: 'error', message: error.message || 'Error interno del servidor' });
  }
};