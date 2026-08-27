import { Response } from 'express';
import { CustomRequest } from '../middlewares/auth.middleware';
import prisma from '../config/prisma';
import bcrypt from 'bcryptjs';

// 1. Abrir Caja (Forzando el saldo del último cierre)
export const openCashRegister = async (req: CustomRequest, res: Response) => {
  try {
    const { physicalBoxId, openingAmount } = req.body;
    const userId = req.user?.id!;

    const box = await prisma.physicalBox.findUnique({ where: { id: physicalBoxId } });
    if (!box)
      return res.status(404).json({ status: 'error', message: 'Caja física no encontrada' });

    const openRegister = await prisma.cashRegister.findFirst({ where: { userId, status: 'OPEN' } });
    if (openRegister)
      return res.status(400).json({ status: 'error', message: 'Ya tienes una caja abierta' });

    // El monto inicial SIEMPRE será el que el cajero cuente físicamente
    const realOpeningAmount = parseFloat(openingAmount) || 0;

    // Si el monto contado es diferente al saldo del sistema, actualizamos la caja física
    if (realOpeningAmount !== box.balance) {
      await prisma.physicalBox.update({
        where: { id: physicalBoxId },
        data: { balance: realOpeningAmount },
      });
      // Opcional: Aquí podrías crear un registro de "Ajuste de Caja" si quieres auditoría extrema,
      // pero actualizar el saldo es suficiente para que el cajero no herede el faltante.
    }

    const newRegister = await prisma.cashRegister.create({
      data: {
        openingAmount: realOpeningAmount,
        userId,
        physicalBoxId: box.id,
      },
    });

    return res.status(201).json({ status: 'success', data: newRegister });
  } catch (error) {
    console.error('Error opening cash register:', error);
    return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
  }
};

// 2. Obtener caja abierta actual
export const getCurrentCashRegister = async (req: CustomRequest, res: Response) => {
  try {
    const userId = req.user?.id!;

    const openCashRegister = await prisma.cashRegister.findFirst({
      where: { userId, status: 'OPEN' },
      include: {
        sales: { where: { paymentMethod: 'CASH' } },
        purchases: { where: { accountId: null } },
      },
    });

    if (openCashRegister) {
      const cashSalesTotal = openCashRegister.sales.reduce((acc, s) => acc + s.totalAmount, 0);
      const cashPurchasesTotal = openCashRegister.purchases.reduce(
        (acc, p) => acc + p.totalAmount,
        0
      );
      const expectedAmount =
        openCashRegister.openingAmount +
        cashSalesTotal -
        cashPurchasesTotal +
        (openCashRegister.manualInflows || 0) -
        (openCashRegister.manualOutflows || 0);

      return res
        .status(200)
        .json({ status: 'success', data: { ...openCashRegister, expectedAmount } });
    }

    const lastClosedRegister = await prisma.cashRegister.findFirst({
      where: { userId, status: 'CLOSED' },
      orderBy: { closedAt: 'desc' },
    });

    const suggested =
      lastClosedRegister && lastClosedRegister.closingAmount !== null
        ? lastClosedRegister.closingAmount
        : 0;

    return res.status(200).json({ status: 'success', data: null, suggestedOpening: suggested });
  } catch (error) {
    console.error('Error getting current cash register:', error);
    return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
  }
};

//3. Cerrar Caja (Arqueo con Caja Física y Descuadre al Usuario)
export const closeCashRegister = async (req: CustomRequest, res: Response) => {
  try {
    const { countedAmount, depositAmount, depositAccountId } = req.body;
    const userId = req.user?.id!;

    const cashRegister = await prisma.cashRegister.findFirst({
      where: { userId, status: 'OPEN' },
      include: {
        sales: { where: { paymentMethod: 'CASH' } },
        purchases: { where: { accountId: null } },
      },
    });

    if (!cashRegister) {
      return res.status(400).json({ status: 'error', message: 'No hay caja abierta para cerrar' });
    }

    const cashSalesTotal = cashRegister.sales.reduce((acc, sale) => acc + sale.totalAmount, 0);
    const cashPurchasesTotal = cashRegister.purchases.reduce(
      (acc, purchase) => acc + purchase.totalAmount,
      0
    );

    const expectedAmount =
      cashRegister.openingAmount +
      cashSalesTotal -
      cashPurchasesTotal +
      (cashRegister.manualInflows || 0) -
      (cashRegister.manualOutflows || 0);
    const realAmount = parseFloat(countedAmount) || 0;

    // EL DESCUADRE (Faltante o Sobrante)
    const difference = realAmount - expectedAmount;

    const requestedDeposit = parseFloat(depositAmount) || 0;
    const actualDeposit = requestedDeposit;
    const finalClosingAmount = realAmount - actualDeposit;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Cerrar el turno
      const closedRegister = await tx.cashRegister.update({
        where: { id: cashRegister.id },
        data: {
          status: 'CLOSED',
          closingAmount: finalClosingAmount,
          depositAmount: actualDeposit,
          depositAccountId: depositAccountId || null,
          closedAt: new Date(),
        },
      });

      // 2. Actualizar el saldo de la Caja Física con lo que quedó en el cajón
      if (cashRegister.physicalBoxId) {
        await tx.physicalBox.update({
          where: { id: cashRegister.physicalBoxId },
          data: { balance: finalClosingAmount },
        });
      }

      // 3. APLICAR DESCUADRE AL USUARIO
      // Si la diferencia es negativa (faltante), se resta de su balance (queda debiendo).
      // Si es positiva (sobrante), se suma a su balance.
      await tx.user.update({
        where: { id: userId },
        data: { balance: { increment: difference } },
      });

      // 4. Depositar en Caja Fuerte si aplica
      if (actualDeposit > 0 && depositAccountId) {
        await tx.account.update({
          where: { id: depositAccountId },
          data: { balance: { increment: actualDeposit } },
        });

        await tx.transaction.create({
          data: {
            amount: actualDeposit,
            type: 'DEPOSIT',
            concept: `Depósito de Caja (Cierre #${cashRegister.id.substring(0, 8)})`,
            accountId: depositAccountId,
          },
        });
      }

      return closedRegister;
    });

    return res.status(200).json({
      status: 'success',
      data: {
        register: result,
        summary: {
          openingAmount: cashRegister.openingAmount,
          cashSalesTotal,
          cashPurchasesTotal,
          expectedAmount,
          realAmount,
          difference,
          deposit: actualDeposit,
          finalClosingAmount,
        },
      },
    });
  } catch (error) {
    console.error('Error closing cash register:', error);
    return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
  }
};

// 4. Buscar producto
export const searchProduct = async (req: CustomRequest, res: Response) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(400).json({ status: 'error', message: 'Query es requerido' });

    const products = await prisma.product.findMany({
      where: {
        OR: [
          { sku: { contains: query as string, mode: 'insensitive' } },
          { name: { contains: query as string, mode: 'insensitive' } },
        ],
      },
      include: { variants: { include: { size: true, color: true }, where: { stock: { gt: 0 } } } },
      take: 10,
    });

    return res.status(200).json({ status: 'success', data: products });
  } catch (error) {
    console.error('Error searching product:', error);
    return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
  }
};

// 5. Procesar Venta
export const processSale = async (req: CustomRequest, res: Response) => {
  try {
    const { items, paymentMethod, receivedAmount, clientId, reference, accountId } = req.body;
    const userId = req.user?.id!;

    const cashRegister = await prisma.cashRegister.findFirst({ where: { userId, status: 'OPEN' } });
    if (!cashRegister)
      return res
        .status(400)
        .json({ status: 'error', message: 'No hay caja abierta. Abre una caja primero.' });
    if (paymentMethod === 'CREDIT' && !clientId)
      return res
        .status(400)
        .json({ status: 'error', message: 'Para venta a crédito, debes seleccionar un cliente.' });
    if ((paymentMethod === 'CARD' || paymentMethod === 'TRANSFER') && !accountId)
      return res.status(400).json({
        status: 'error',
        message: 'Selecciona la cuenta bancaria donde ingresó el dinero.',
      });

    const sale = await prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      const saleItemsData = [];

      for (const item of items) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.productVariantId },
          include: { product: true },
        });
        if (!variant) throw new Error(`Variante no encontrada`);
        if (variant.stock < item.quantity)
          throw new Error(`Stock insuficiente para ${variant.product.name}`);

        await tx.productVariant.update({
          where: { id: variant.id },
          data: { stock: { decrement: item.quantity } },
        });

        const unitPrice = variant.product.price;
        const subtotal = unitPrice * item.quantity;
        totalAmount += subtotal;

        saleItemsData.push({
          productVariantId: variant.id,
          quantity: item.quantity,
          unitPrice,
          subtotal,
        });
      }

      const received = paymentMethod === 'CASH' ? parseFloat(receivedAmount) || 0 : totalAmount;
      const change = paymentMethod === 'CASH' ? Math.max(0, received - totalAmount) : 0;

      const newSale = await tx.sale.create({
        data: {
          totalAmount,
          receivedAmount: received,
          change: change,
          reference: reference || null,
          paymentMethod,
          userId,
          cashRegisterId: cashRegister.id,
          clientId: paymentMethod === 'CREDIT' ? clientId : null,
          items: { create: saleItemsData },
        },
        include: { items: true },
      });

      if (paymentMethod === 'CREDIT' && clientId) {
        await tx.client.update({
          where: { id: clientId },
          data: { balance: { increment: totalAmount } },
        });
      }

      if ((paymentMethod === 'CARD' || paymentMethod === 'TRANSFER') && accountId) {
        await tx.account.update({
          where: { id: accountId },
          data: { balance: { increment: totalAmount } },
        });
        await tx.transaction.create({
          data: {
            amount: totalAmount,
            type: 'DEPOSIT',
            concept: `Venta POS (${paymentMethod}) - Ref: ${reference || 'N/A'}`,
            accountId,
          },
        });
      }

      return newSale;
    });

    return res.status(201).json({ status: 'success', data: sale });
  } catch (error: any) {
    console.error('Error processing sale:', error);
    return res
      .status(400)
      .json({ status: 'error', message: error.message || 'Error al procesar la venta' });
  }
};

// 6. Transferir dinero de Tesorería a la Caja Actual (Inyección)
export const transferToCashRegister = async (req: CustomRequest, res: Response) => {
  try {
    const { accountId, amount, adminEmail, adminPassword } = req.body;
    const userId = req.user?.id!;

    const adminUser = await prisma.user.findFirst({
      where: { email: adminEmail, role: { in: ['ADMIN', 'MANAGER'] }, isActive: true },
    });
    if (!adminUser)
      return res
        .status(403)
        .json({ status: 'error', message: 'Correo de administrador no válido o sin permisos.' });

    const isMatch = await bcrypt.compare(adminPassword, adminUser.password);
    if (!isMatch)
      return res
        .status(403)
        .json({ status: 'error', message: 'Contraseña de autorización incorrecta.' });

    const cashRegister = await prisma.cashRegister.findFirst({ where: { userId, status: 'OPEN' } });
    if (!cashRegister)
      return res.status(400).json({ status: 'error', message: 'No hay caja abierta' });

    const result = await prisma.$transaction(async (tx) => {
      const account = await tx.account.findUnique({ where: { id: accountId } });
      if (!account) throw new Error('Cuenta de tesorería no encontrada');
      if (account.balance < amount) throw new Error('Saldo insuficiente en la cuenta de origen');

      await tx.account.update({
        where: { id: accountId },
        data: { balance: { decrement: amount } },
      });
      await tx.transaction.create({
        data: {
          amount,
          type: 'WITHDRAWAL',
          concept: `Transferencia a Caja POS (Aut: ${adminUser.name})`,
          accountId,
        },
      });
      const updatedReg = await tx.cashRegister.update({
        where: { id: cashRegister.id },
        data: { manualInflows: { increment: amount } },
      });

      return updatedReg;
    });

    return res.status(200).json({ status: 'success', data: result });
  } catch (error: any) {
    return res.status(400).json({ status: 'error', message: error.message });
  }
};

// 7. NUEVO: Retirar dinero de la Caja Actual hacia Tesorería o Gasto (Sangría)
export const withdrawFromCashRegister = async (req: CustomRequest, res: Response) => {
  try {
    const { accountId, amount, adminEmail, adminPassword, concept } = req.body;
    const userId = req.user?.id!;

    const adminUser = await prisma.user.findFirst({
      where: { email: adminEmail, role: { in: ['ADMIN', 'MANAGER'] }, isActive: true },
    });
    if (!adminUser)
      return res
        .status(403)
        .json({ status: 'error', message: 'Correo de administrador no válido o sin permisos.' });

    const isMatch = await bcrypt.compare(adminPassword, adminUser.password);
    if (!isMatch)
      return res
        .status(403)
        .json({ status: 'error', message: 'Contraseña de autorización incorrecta.' });

    const cashRegister = await prisma.cashRegister.findFirst({ where: { userId, status: 'OPEN' } });
    if (!cashRegister)
      return res.status(400).json({ status: 'error', message: 'No hay caja abierta' });

    const result = await prisma.$transaction(async (tx) => {
      // Si se selecciona una cuenta, el dinero va a la Caja Fuerte/Banco
      if (accountId) {
        const account = await tx.account.findUnique({ where: { id: accountId } });
        if (!account) throw new Error('Cuenta de destino no encontrada');

        await tx.account.update({
          where: { id: accountId },
          data: { balance: { increment: amount } },
        });
        await tx.transaction.create({
          data: {
            amount,
            type: 'DEPOSIT',
            concept: `Retiro de Caja POS hacia ${account.name} (Aut: ${adminUser.name})`,
            accountId,
          },
        });
      } else {
        await tx.expense.create({
          data: {
            amount,
            concept: concept || 'Retiro de efectivo de caja',
            accountId: null, // <-- ASEGÚRATE DE QUE DIGA null AQUÍ
            userId: adminUser.id,
          },
        });
      }
      // Descontar de la caja del cajero para no afectar su arqueo
      const updatedReg = await tx.cashRegister.update({
        where: { id: cashRegister.id },
        data: { manualOutflows: { increment: amount } },
      });

      return updatedReg;
    });

    return res.status(200).json({ status: 'success', data: result });
  } catch (error: any) {
    return res.status(400).json({ status: 'error', message: error.message });
  }
};

// 8. Obtener historial de aperturas y cierres
export const getCashRegisterHistory = async (req: CustomRequest, res: Response) => {
  try {
    const history = await prisma.cashRegister.findMany({
      include: {
        user: { select: { name: true } },
        depositAccount: { select: { name: true } },
        sales: { where: { paymentMethod: 'CASH' }, select: { totalAmount: true } },
        purchases: { where: { accountId: null }, select: { totalAmount: true } },
      },
      orderBy: { openedAt: 'desc' },
      take: 50,
    });

    const formattedHistory = history.map((reg) => {
      const cashSalesTotal = reg.sales.reduce((acc, s) => acc + s.totalAmount, 0);
      const cashPurchasesTotal = reg.purchases.reduce((acc, p) => acc + p.totalAmount, 0);
      const manualInflows = reg.manualInflows || 0;
      const manualOutflows = reg.manualOutflows || 0;

      const expectedAmount =
        reg.openingAmount + cashSalesTotal - cashPurchasesTotal + manualInflows - manualOutflows;
      const realAmountCounted =
        (reg.closingAmount !== null ? reg.closingAmount : 0) + (reg.depositAmount || 0);
      const difference = reg.status === 'CLOSED' ? realAmountCounted - expectedAmount : 0;

      return {
        id: reg.id,
        userName: reg.user.name,
        openingAmount: reg.openingAmount,
        manualInflows,
        manualOutflows,
        expectedAmount: reg.status === 'CLOSED' ? expectedAmount : null,
        realAmountCounted: reg.status === 'CLOSED' ? realAmountCounted : null,
        difference: reg.status === 'CLOSED' ? difference : null,
        depositAmount: reg.depositAmount,
        cashLeftInDrawer: reg.closingAmount,
        depositAccountName: reg.depositAccount?.name || null,
        status: reg.status,
        openedAt: reg.openedAt,
      };
    });

    return res.status(200).json({ status: 'success', data: formattedHistory });
  } catch (error) {
    console.error('Error getting cash register history:', error);
    return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
  }
};

// Cierre Forzoso por Administrador/Gerente
export const forceCloseCashRegister = async (req: CustomRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { countedAmount } = req.body;
    const adminRole = req.user?.role;

    // Solo ADMIN y MANAGER pueden forzar cierres
    if (adminRole !== 'ADMIN' && adminRole !== 'MANAGER') {
      return res
        .status(403)
        .json({ status: 'error', message: 'No autorizado para forzar cierres' });
    }

    const cashRegister = await prisma.cashRegister.findUnique({
      where: { id },
      include: {
        sales: { where: { paymentMethod: 'CASH' } },
        purchases: { where: { accountId: null } },
      },
    });

    if (!cashRegister || cashRegister.status === 'CLOSED') {
      return res
        .status(400)
        .json({ status: 'error', message: 'Caja no encontrada o ya está cerrada' });
    }

    const cashSalesTotal = cashRegister.sales.reduce((acc, s) => acc + s.totalAmount, 0);
    const cashPurchasesTotal = cashRegister.purchases.reduce((acc, p) => acc + p.totalAmount, 0);
    const expectedAmount =
      cashRegister.openingAmount +
      cashSalesTotal -
      cashPurchasesTotal +
      (cashRegister.manualInflows || 0) -
      (cashRegister.manualOutflows || 0);

    const realAmount = parseFloat(countedAmount) || 0;
    const difference = realAmount - expectedAmount;

    // En el cierre forzoso, asumimos que el admin no hace depósito a caja fuerte en este momento,
    // simplemente deja el dinero contado en el cajón para el siguiente turno.
    const finalClosingAmount = realAmount;

    await prisma.$transaction(async (tx) => {
      // 1. Cerrar el turno
      await tx.cashRegister.update({
        where: { id: cashRegister.id },
        data: {
          status: 'CLOSED',
          closingAmount: finalClosingAmount,
          depositAmount: 0,
          closedAt: new Date(),
        },
      });

      // 2. Actualizar el saldo de la Caja Física
      if (cashRegister.physicalBoxId) {
        await tx.physicalBox.update({
          where: { id: cashRegister.physicalBoxId },
          data: { balance: finalClosingAmount },
        });
      }

      // 3. APLICAR DESCUADRE AL USUARIO ORIGINAL (no al admin)
      await tx.user.update({
        where: { id: cashRegister.userId },
        data: { balance: { increment: difference } },
      });
    });

    return res.status(200).json({
      status: 'success',
      message: `Caja cerrada forzosamente. Descuadre de $${difference.toLocaleString('es-CO')} aplicado a la cuenta del cajero.`,
    });
  } catch (error) {
    console.error('Error force closing cash register:', error);
    return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
  }
};
