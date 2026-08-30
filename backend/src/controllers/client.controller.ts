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
      return res.status(403).json({
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
      return res.status(400).json({
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
      return res.status(400).json({
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

// REGISTRAR ABONO DE CLIENTE
export const addClientPayment = async (req: CustomRequest, res: Response) => {
  try {
    const { id } = req.params; // ID del cliente
    const { amount, paymentMethod, reference, accountId } = req.body;
    const userId = req.user?.id!;
    const parsedAmount = parseFloat(amount) || 0;

    if (parsedAmount <= 0)
      return res.status(400).json({ status: 'error', message: 'El monto debe ser mayor a 0' });

    const client = await prisma.client.findUnique({ where: { id } });
    if (!client) return res.status(404).json({ status: 'error', message: 'Cliente no encontrado' });

    const result = await prisma.$transaction(async (tx) => {
      // 1. Reducir la deuda del cliente
      await tx.client.update({
        where: { id },
        data: { balance: { decrement: parsedAmount } },
      });

      // 2. Crear el registro de auditoría del pago
      const payment = await tx.clientPayment.create({
        data: {
          amount: parsedAmount,
          paymentMethod,
          reference,
          clientId: id,
          userId,
          accountId: paymentMethod === 'CARD' || paymentMethod === 'TRANSFER' ? accountId : null,
        },
      });

      // 3. Sumar el dinero a la Caja Física o Cuenta Bancaria
      if (paymentMethod === 'CASH') {
        const openCashRegister = await tx.cashRegister.findFirst({
          where: { userId, status: 'OPEN' },
        });
        if (!openCashRegister)
          throw new Error('No tienes una caja abierta para registrar el pago en efectivo.');

        await tx.cashRegister.update({
          where: { id: openCashRegister.id },
          data: { manualInflows: { increment: parsedAmount } }, // Sube el efectivo al arqueo
        });

        // Conectamos el pago a la caja para la auditoría
        await tx.clientPayment.update({
          where: { id: payment.id },
          data: { cashRegisterId: openCashRegister.id },
        });
      } else if (paymentMethod === 'CARD' || paymentMethod === 'TRANSFER') {
        if (!accountId) throw new Error('Debes seleccionar una cuenta bancaria.');

        await tx.account.update({
          where: { id: accountId },
          data: { balance: { increment: parsedAmount } },
        });

        await tx.transaction.create({
          data: {
            amount: parsedAmount,
            type: 'DEPOSIT',
            concept: `Abono de cliente ${client.name} (${paymentMethod})`,
            accountId,
          },
        });
      }

      return payment;
    });

    return res.status(201).json({ status: 'success', data: result });
  } catch (error: any) {
    console.error('Error adding payment:', error);
    return res
      .status(500)
      .json({ status: 'error', message: error.message || 'Error interno del servidor' });
  }
};

// Buscar clientes para el POS
export const searchClients = async (req: CustomRequest, res: Response) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(200).json({ status: 'success', data: [] });

    const clients = await prisma.client.findMany({
      where: {
        OR: [
          { name: { contains: query as string, mode: 'insensitive' } },
          { document: { contains: query as string, mode: 'insensitive' } },
          { phone: { contains: query as string, mode: 'insensitive' } },
        ],
      },
      // ✅ Traemos hasta 10 resultados para que el cajero tenga dónde elegir
      take: 10,
    });

    return res.status(200).json({ status: 'success', data: clients });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Error interno' });
  }
};
