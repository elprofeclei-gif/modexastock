import { Response } from 'express';
import { CustomRequest } from '../middlewares/auth.middleware';
import prisma from '../config/prisma';
import { logAction } from '../utils/audit'; // ✅ IMPORTADO

export const createVendor = async (req: CustomRequest, res: Response) => {
  try {
    const { name, phone, email } = req.body;
    if (!name)
      return res.status(400).json({ status: 'error', message: 'El nombre es obligatorio' });

    const vendor = await prisma.vendor.create({
      data: { name, phone, email },
    });
    return res.status(201).json({ status: 'success', data: vendor });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Error interno' });
  }
};

export const getVendors = async (req: CustomRequest, res: Response) => {
  try {
    const vendors = await prisma.vendor.findMany({ orderBy: { name: 'asc' } });
    return res.status(200).json({ status: 'success', data: vendors });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Error interno' });
  }
};

// ✅ NUEVA FUNCIÓN: PAGAR DEUDA A PROVEEDOR
export const payVendor = async (req: CustomRequest, res: Response) => {
  try {
    const { id } = req.params; // ID del proveedor
    const { amount, accountId, paymentMethod } = req.body;
    const userId = req.user?.id!;
    const parsedAmount = parseFloat(amount) || 0;

    if (parsedAmount <= 0) return res.status(400).json({ status: 'error', message: 'El monto debe ser mayor a 0' });

    const vendor = await prisma.vendor.findUnique({ where: { id } });
    if (!vendor) return res.status(404).json({ status: 'error', message: 'Proveedor no encontrado' });

    let cashRegister = null;

    // Si pagan en efectivo, buscamos la caja del usuario actual
    if (paymentMethod === 'CASH') {
      cashRegister = await prisma.cashRegister.findFirst({ where: { userId, status: 'OPEN' } });
      if (!cashRegister) return res.status(400).json({ status: 'error', message: 'No tienes caja abierta para pagar en efectivo.' });
    } else if (!accountId) {
      return res.status(400).json({ status: 'error', message: 'Debes seleccionar una cuenta bancaria.' });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Reducir la deuda del proveedor
      await tx.vendor.update({
        where: { id },
        data: { balance: { decrement: parsedAmount } }
      });

      // 2. Descontar el dinero
      if (paymentMethod === 'CASH' && cashRegister) {
        await tx.cashRegister.update({
          where: { id: cashRegister.id },
          data: { manualOutflows: { increment: parsedAmount } }
        });
      } else if (accountId) {
        const account = await tx.account.findUnique({ where: { id: accountId } });
        if (!account) throw new Error('Cuenta no encontrada');
        if (account.balance < parsedAmount) throw new Error('Saldo insuficiente en la cuenta');

        await tx.account.update({
          where: { id: accountId },
          data: { balance: { decrement: parsedAmount } }
        });

        await tx.transaction.create({
          data: {
            amount: parsedAmount,
            type: 'EXPENSE',
            concept: `Pago de deuda a proveedor ${vendor.name}`,
            accountId
          }
        });
      }
    });

    // 3. Registro en Bitácora
    await logAction(userId, 'PAY_VENDOR', 'Vendor', id, `Pago de ${parsedAmount} a proveedor ${vendor.name}.`);

    return res.status(200).json({ status: 'success', message: 'Pago a proveedor registrado correctamente.' });
  } catch (error: any) {
    console.error('Error paying vendor:', error);
    return res.status(500).json({ status: 'error', message: error.message || 'Error interno del servidor' });
  }
};