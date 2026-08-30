import { Response } from 'express';
import { CustomRequest } from '../middlewares/auth.middleware';
import prisma from '../config/prisma';
import { logAction } from '../utils/audit'; // ✅ IMPORTADO

export const createPurchase = async (req: CustomRequest, res: Response) => {
  try {
    const { items, vendorId, accountId, paymentMethod } = req.body; // ✅ Agregamos paymentMethod
    const userId = req.user?.id!;

    let cashRegister = null;

    // Si es de contado en efectivo, buscamos la caja abierta
    if (paymentMethod === 'CASH' && !accountId) {
      cashRegister = await prisma.cashRegister.findFirst({
        where: { userId, status: 'OPEN' },
      });
      if (!cashRegister) {
        return res.status(400).json({
          status: 'error',
          message: 'Debes abrir caja para pagar en efectivo o selecciona una cuenta bancaria.',
        });
      }
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ status: 'error', message: 'La compra no tiene items.' });
    }

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

          await tx.inventoryMovement.create({
            data: {
              productVariantId: variant.id,
              userId,
              type: 'PURCHASE',
              quantityChange: item.quantity,
              reason: `Compra a proveedor`,
            },
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

        // LÓGICA DE PAGO
        if (paymentMethod === 'CREDIT') {
          // ✅ Si es a crédito, sumamos deuda al proveedor
          if (!vendorId) throw new Error('Debes seleccionar un proveedor para compras a crédito');
          await tx.vendor.update({
            where: { id: vendorId },
            data: { balance: { increment: totalAmount } },
          });
        } else {
          // Si es de contado, descontamos dinero
          if (accountId) {
            const account = await tx.account.findUnique({ where: { id: accountId } });
            if (!account) throw new Error('Cuenta no encontrada');
            if (account.balance < totalAmount)
              throw new Error('Saldo insuficiente en la cuenta seleccionada');

            await tx.account.update({
              where: { id: accountId },
              data: { balance: { decrement: totalAmount } },
            });
            await tx.transaction.create({
              data: {
                amount: totalAmount,
                type: 'EXPENSE',
                concept: `Compra a proveedor (Contado)`,
                accountId,
              },
            });
          } else if (cashRegister) {
            await tx.cashRegister.update({
              where: { id: cashRegister.id },
              data: { manualOutflows: { increment: totalAmount } },
            });
          }
        }

        const newPurchase = await tx.purchase.create({
          data: {
            totalAmount,
            vendorId,
            userId,
            cashRegisterId: cashRegister?.id || null,
            accountId: accountId || null,
            items: { create: purchaseItemsData },
          },
          include: { items: true },
        });

        return newPurchase;
      },
      { timeout: 10000 }
    );

    await logAction(
      userId,
      'CREATE_PURCHASE',
      'Purchase',
      purchase.id,
      `Compra registrada por ${purchase.totalAmount}. Pago: ${paymentMethod}.`
    );

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
