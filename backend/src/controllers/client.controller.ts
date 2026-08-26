import { Response } from 'express';
import { CustomRequest } from '../middlewares/auth.middleware';
import prisma from '../config/prisma';
import bcrypt from 'bcryptjs';

// Obtener todos los clientes
export const getClients = async (req: CustomRequest, res: Response) => {
  try {
    const clients = await prisma.client.findMany({ orderBy: { name: 'asc' } });
    return res.status(200).json({ status: 'success', data: clients });
  } catch (error) {
    console.error('Error getting clients:', error);
    return res.status(500).json({ status: 'error', message: 'Error interno' });
  }
};

// Crear un nuevo cliente
export const createClient = async (req: CustomRequest, res: Response) => {
  try {
    const { name, phone, document, email } = req.body;
    if (!name)
      return res.status(400).json({ status: 'error', message: 'El nombre es obligatorio' });

    const client = await prisma.client.create({
      data: { name, phone, document, email },
    });

    return res.status(201).json({ status: 'success', data: client });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res
        .status(400)
        .json({ status: 'error', message: 'El email o documento ya está registrado' });
    }
    console.error('Error creating client:', error);
    return res.status(500).json({ status: 'error', message: 'Error al crear cliente' });
  }
};

// Actualizar un cliente
export const updateClient = async (req: CustomRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, phone, document, email } = req.body;

    const updated = await prisma.client.update({
      where: { id },
      data: { name, phone, document, email },
    });

    return res.status(200).json({ status: 'success', data: updated });
  } catch (error) {
    console.error('Error updating client:', error);
    return res.status(500).json({ status: 'error', message: 'Error al actualizar' });
  }
};

// Eliminar un cliente (Requiere Autorización de Admin y que no tenga deudas)
export const deleteClient = async (req: CustomRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { adminEmail, adminPassword } = req.body;

    // 1. Validar credenciales del administrador
    const adminUser = await prisma.user.findFirst({
      where: { email: adminEmail, role: { in: ['ADMIN', 'MANAGER'] }, isActive: true },
    });

    if (!adminUser) {
      return res
        .status(403)
        .json({
          status: 'error',
          message: 'Correo de administrador/gerente no válido o sin permisos.',
        });
    }

    const isMatch = await bcrypt.compare(adminPassword, adminUser.password);
    if (!isMatch) {
      return res
        .status(403)
        .json({ status: 'error', message: 'Contraseña de autorización incorrecta.' });
    }

    // 2. Validar que el cliente NO tenga deuda activa
    const client = await prisma.client.findUnique({ where: { id } });
    if (!client) {
      return res.status(404).json({ status: 'error', message: 'Cliente no encontrado' });
    }

    if (client.balance > 0) {
      return res
        .status(400)
        .json({
          status: 'error',
          message: `No se puede eliminar. El cliente tiene una deuda pendiente de ${client.balance}.`,
        });
    }

    // 3. Eliminar
    await prisma.client.delete({ where: { id } });
    return res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting client:', error);
    // Error de Prisma si el cliente tiene ventas asociadas (Foreign Key)
    if (error.code === 'P2003') {
      return res
        .status(400)
        .json({
          status: 'error',
          message: 'No se puede eliminar el cliente porque tiene historial de ventas registrado.',
        });
    }
    return res.status(500).json({ status: 'error', message: 'Error al eliminar cliente' });
  }
};

// Pagar deuda (Abono a la cuenta por cobrar)
export const payClientDebt = async (req: CustomRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, accountId } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      const client = await tx.client.update({
        where: { id },
        data: { balance: { decrement: parseFloat(amount) } },
      });

      if (accountId) {
        await tx.account.update({
          where: { id: accountId },
          data: { balance: { increment: parseFloat(amount) } },
        });

        await tx.transaction.create({
          data: {
            amount: parseFloat(amount),
            type: 'DEPOSIT',
            concept: `Abono deuda cliente: ${client.name}`,
            accountId,
          },
        });
      } else {
        const cashRegister = await tx.cashRegister.findFirst({
          where: { userId: req.user?.id!, status: 'OPEN' },
        });

        if (!cashRegister) throw new Error('No hay caja abierta para recibir el efectivo.');

        await tx.sale.create({
          data: {
            totalAmount: parseFloat(amount),
            receivedAmount: parseFloat(amount),
            change: 0,
            paymentMethod: 'CASH',
            userId: req.user?.id!,
            cashRegisterId: cashRegister.id,
            clientId: id,
          },
        });
      }

      return client;
    });

    return res.status(200).json({ status: 'success', data: result });
  } catch (error: any) {
    console.error('Error paying client debt:', error);
    return res
      .status(400)
      .json({ status: 'error', message: error.message || 'Error al registrar pago' });
  }
};
