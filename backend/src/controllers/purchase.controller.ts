import { Response } from 'express';
import { CustomRequest } from '../middlewares/auth.middleware';
import prisma from '../config/prisma';

export const createPurchase = async (req: CustomRequest, res: Response) => {
  try {
    const { items, vendorId, accountId } = req.body;
    const userId = req.user?.id!;

    let cashRegister = null;

    // Si no se selecciona una cuenta de tesorería, intentamos usar la caja actual
    if (!accountId) {
      cashRegister = await prisma.cashRegister.findFirst({
        where: { userId, status: 'OPEN' },
      });

      if (!cashRegister) {
        return res
          .status(400)
          .json({
            status: 'error',
            message: 'Debes abrir caja o seleccionar una cuenta de tesorería para pagar.',
          });
      }
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ status: 'error', message: 'La compra no tiene items.' });
    }

    // AUMENTAMOS EL TIMEOUT A 10 SEGUNDOS (10000 ms)
    const purchase = await prisma.$transaction(
      async (tx) => {
        let totalAmount = 0;
        const purchaseItemsData = [];

        for (const item of items) {
          const variant = await tx.productVariant.findUnique({
            where: { id: item.productVariantId },
          });

          if (!variant) throw new Error(`Variante no encontrada`);

          await tx.productVariant.update({
            where: { id: variant.id },
            data: { stock: { increment: item.quantity } },
          });

          const unitCost = parseFloat(item.unitCost) || 0;
          const subtotal = unitCost * item.quantity;
          totalAmount += subtotal;

          purchaseItemsData.push({
            productVariantId: variant.id,
            quantity: item.quantity,
            unitCost,
            subtotal,
          });
        }

        if (accountId) {
          const account = await tx.account.findUnique({ where: { id: accountId } });
          if (!account) throw new Error('Cuenta no encontrada');

          if (account.balance < totalAmount) {
            throw new Error('Saldo insuficiente en la cuenta seleccionada');
          }

          await tx.account.update({
            where: { id: accountId },
            data: { balance: { decrement: totalAmount } },
          });

          await tx.transaction.create({
            data: {
              amount: totalAmount,
              type: 'EXPENSE',
              concept: `Compra a proveedor`,
              accountId,
            },
          });
        }

        // Si hay caja abierta, la usamos. Si no (compra de banco), queda null.
        const newPurchase = await tx.purchase.create({
          data: {
            totalAmount,
            vendorId,
            userId,
            cashRegisterId: cashRegister?.id || null, // <-- Si es de banco, queda null
            accountId: accountId || null,
            items: { create: purchaseItemsData },
          },
          include: { items: true },
        });

        return newPurchase;
      },
      { timeout: 10000 }
    ); // <-- AQUI ESTÁ EL CAMBIO CLAVE DEL TIMEOUT

    return res.status(201).json({ status: 'success', data: purchase });
  } catch (error: any) {
    console.error('Error creating purchase:', error);
    return res.status(400).json({ status: 'error', message: error.message });
  }
};

export const getPurchases = async (req: CustomRequest, res: Response) => {
  try {
    const purchases = await prisma.purchase.findMany({
      include: {
        vendor: { select: { name: true } },
        user: { select: { name: true } },
        account: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return res.status(200).json({ status: 'success', data: purchases });
  } catch (error) {
    console.error('Error getting purchases:', error);
    return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
  }
};
