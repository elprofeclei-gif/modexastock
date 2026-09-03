import { Response } from 'express';
import { CustomRequest } from '../middlewares/auth.middleware';
import prisma from '../config/prisma';
import bcrypt from 'bcryptjs';
import { logAction } from '../utils/audit';

// 1. Abrir Caja (Forzando el saldo del último cierre)
export const openCashRegister = async (req: CustomRequest, res: Response) => {
  try {
    const { physicalBoxId, openingAmount, adminEmail, adminPassword, originAccountId } = req.body;
    const userId = req.user?.id!;

    const box = await prisma.physicalBox.findUnique({ where: { id: physicalBoxId } });
    if (!box)
      return res.status(404).json({ status: 'error', message: 'Caja física no encontrada' });

    const openRegister = await prisma.cashRegister.findFirst({ where: { userId, status: 'OPEN' } });
    if (openRegister)
      return res.status(400).json({
        status: 'error',
        message: 'Ya tienes una caja abierta activa. Debes cerrarla primero.',
      });

    const boxInUseByOther = await prisma.cashRegister.findFirst({
      where: { physicalBoxId, status: 'OPEN' },
      include: { user: true },
    });

    if (boxInUseByOther) {
      return res.status(400).json({
        status: 'error',
        message: `Esta caja física ya está en uso por ${boxInUseByOther.user.name}. Debe cerrar su turno primero.`,
      });
    }

    const realOpeningAmount = parseFloat(openingAmount) || 0;
    const difference = realOpeningAmount - box.balance;

    // Si hay diferencia (faltante o sobrante), exigimos autorización
    if (Math.abs(difference) > 0) {
      if (!adminEmail || !adminPassword) {
        return res.status(403).json({
          status: 'error',
          message:
            'Se requiere autorización de administrador para justificar el faltante/sobrante.',
        });
      }

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

      // ✅ NUEVO: Buscar quién fue el último cajero en cerrar esta caja
      const lastClosedRegister = await prisma.cashRegister.findFirst({
        where: { physicalBoxId: box.id, status: 'CLOSED' },
        orderBy: { closedAt: 'desc' },
        include: { user: true },
      });

      const responsibleCashier = lastClosedRegister?.user.name || 'Desconocido';
      const cashierId = lastClosedRegister?.userId || null;

      const result = await prisma.$transaction(async (tx) => {
        if (difference < 0) {
          // Faltante (Gasto/Pérdida)
          await tx.expense.create({
            data: {
              amount: Math.abs(difference),
              // ✅ Registramos la caja y el cajero responsable en el concepto
              concept: `Faltante en Caja [${box.name}]. Último cajero: ${responsibleCashier} (Aut: ${adminUser.name})`,
              accountId: null,
              userId: adminUser.id,
            },
          });
        } else {
          // Sobrante (Inyección de dinero)
          if (originAccountId) {
            const account = await tx.account.findUnique({ where: { id: originAccountId } });
            if (!account) throw new Error('La cuenta de origen (Caja Fuerte/Banco) no existe.');
            if (account.balance < difference)
              throw new Error(
                `Saldo insuficiente en ${account.name}. Faltan ${difference - account.balance}.`
              );

            await tx.account.update({
              where: { id: originAccountId },
              data: { balance: { decrement: difference } },
            });

            await tx.transaction.create({
              data: {
                amount: difference,
                type: 'WITHDRAWAL',
                concept: `Inyección de apertura a Caja Física [${box.name}] (Aut: ${adminUser.name})`,
                accountId: originAccountId,
              },
            });
          } else {
            await tx.expense.create({
              data: {
                amount: -difference,
                concept: `Sobrante en Caja [${box.name}] - Inyección de Capital (Aut: ${adminUser.name})`,
                accountId: null,
                userId: adminUser.id,
              },
            });
          }
        }

        return tx.physicalBox.update({
          where: { id: physicalBoxId },
          data: { balance: realOpeningAmount },
        });
      });

      // ✅ Bitácora detallada
      if (difference < 0) {
        await logAction(
          adminUser.id,
          'OPENING_SHORTAGE',
          'PhysicalBox',
          box.id,
          `Faltante de ${Math.abs(difference)} en Caja ${box.name}. Último cajero responsable: ${responsibleCashier}.`
        );
      } else {
        await logAction(
          adminUser.id,
          'OPENING_SURPLUS',
          'PhysicalBox',
          box.id,
          `Sobrante de ${difference} en Caja ${box.name}. Origen: ${originAccountId ? 'Cuenta Bancaria/Caja Fuerte' : 'Capital'}.`
        );
      }
    }

    const newRegister = await prisma.cashRegister.create({
      data: {
        openingAmount: realOpeningAmount,
        userId,
        physicalBoxId: box.id,
      },
    });

    await logAction(
      userId,
      'OPEN_CASH_REGISTER',
      'CashRegister',
      newRegister.id,
      `Caja abierta con fondo de ${realOpeningAmount}.`
    );

    return res.status(201).json({ status: 'success', data: newRegister });
  } catch (error: any) {
    console.error('Error opening cash register:', error);
    return res
      .status(500)
      .json({ status: 'error', message: error.message || 'Error interno del servidor' });
  }
};

// 2. Obtener caja abierta actual
export const getCurrentCashRegister = async (req: CustomRequest, res: Response) => {
  try {
    const userId = req.user?.id!;

    const openCashRegister = await prisma.cashRegister.findFirst({
      where: { userId, status: 'OPEN' },
      include: {
        // ✅ CORREGIDO: Quitamos cashRegisterId: undefined
        sales: {
          where: { paymentMethod: { contains: 'CASH' } },
        },
        purchases: {
          where: { accountId: null },
        },
      },
    });

    if (openCashRegister) {
      // ✅ Usamos la fórmula exacta: recibido menos cambio entregado
      const cashSalesTotal = openCashRegister.sales.reduce(
        (acc, s) => acc + ((s.receivedAmount || 0) - (s.change || 0)),
        0
      );

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

// 3. Cerrar Caja (Arqueo con Caja Física y Descuadre al Usuario)
export const closeCashRegister = async (req: CustomRequest, res: Response) => {
  try {
    const { countedAmount, depositAmount, depositAccountId } = req.body;
    const userId = req.user?.id!;

    const cashRegister = await prisma.cashRegister.findFirst({
      where: { userId, status: 'OPEN' },
      include: {
        sales: { where: { paymentMethod: { contains: 'CASH' } } },
        purchases: { where: { accountId: null } },
      },
    });

    if (!cashRegister) {
      return res.status(400).json({ status: 'error', message: 'No hay caja abierta para cerrar' });
    }

    const cashSalesTotal = cashRegister.sales.reduce(
      (acc, sale) => acc + ((sale.receivedAmount || 0) - (sale.change || 0)), // ✅ FÓRMULA EXACTA
      0
    );
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
    // ✅ LOG DE AUDITORÍA
    await logAction(
      userId,
      'CLOSE_CASH_REGISTER',
      'CashRegister',
      cashRegister.id,
      `Caja cerrada. Esperado: ${expectedAmount}, Real: ${realAmount}, Diferencia: ${difference}.`
    );

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
    const {
      items,
      clientId,
      discountAmount,
      payments,
    }: { items: any[]; clientId?: string; discountAmount?: number; payments: any[] } = req.body;
    const userId = req.user?.id!;

    const cashRegister = await prisma.cashRegister.findFirst({ where: { userId, status: 'OPEN' } });
    if (!cashRegister)
      return res
        .status(400)
        .json({ status: 'error', message: 'No hay caja abierta. Abre una caja primero.' });

    if (!payments || payments.length === 0)
      return res
        .status(400)
        .json({ status: 'error', message: 'Debe registrar al menos un método de pago.' });

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

        await tx.inventoryMovement.create({
          data: {
            productVariantId: item.productVariantId,
            userId,
            type: 'SALE',
            quantityChange: -item.quantity,
            reason: `Venta POS`,
          },
        });
      }

      // Aplicar descuento
      const parsedDiscount = Number(discountAmount) || 0;
      if (parsedDiscount > 0) {
        if (parsedDiscount > totalAmount)
          throw new Error('El descuento no puede ser mayor al total.');
        totalAmount -= parsedDiscount;
      }

      // Procesar pagos (Split Tender)
      let nonCashPaid = 0;
      let cashPaid = 0;
      let creditAmount = 0; // ✅ NUEVO
      let paymentMethodStr = '';
      let firstReference = '';

      for (const p of payments) {
        if (p.method === 'CASH') {
          cashPaid += p.amount;
        } else if (p.method === 'CARD' || p.method === 'TRANSFER') {
          const account = await tx.account.findUnique({ where: { id: p.accountId } });
          if (!account) throw new Error('Cuenta bancaria no encontrada');

          await tx.account.update({
            where: { id: p.accountId },
            data: { balance: { increment: p.amount } },
          });
          await tx.transaction.create({
            data: {
              amount: p.amount,
              type: 'DEPOSIT',
              concept: `Venta POS (${p.method}) - Ref: ${p.reference || 'N/A'}`,
              accountId: p.accountId,
            },
          });
          nonCashPaid += p.amount;
          if (!firstReference && p.reference) firstReference = p.reference;
        } else if (p.method === 'CREDIT') {
          creditAmount += p.amount; // ✅ Acumular el crédito
        }
        paymentMethodStr += (paymentMethodStr ? ' + ' : '') + p.method;
      }

      // ✅ El total pagado ahora SUMA el crédito, así que no dará error de monto menor
      const totalPaid = cashPaid + nonCashPaid + creditAmount;
      if (totalPaid < totalAmount)
        throw new Error(`El monto pagado (${totalPaid}) es menor al total (${totalAmount}).`);

      // El cambio se calcula restando al efectivo lo que NO fue crédito ni banco
      const change = Math.max(0, cashPaid - (totalAmount - nonCashPaid - creditAmount));
      const received = cashPaid;

      const newSale = await tx.sale.create({
        data: {
          totalAmount,
          discountAmount: parsedDiscount,
          receivedAmount: received,
          change: change,
          reference: firstReference || null,
          paymentMethod: paymentMethodStr,
          userId,
          cashRegisterId: cashRegister.id,
          clientId: clientId || null,
          items: { create: saleItemsData },
        },
        include: { items: true, client: { select: { name: true, document: true } } },
      });

      // ✅ Si hubo pago a CRÉDITO, se lo sumamos a la deuda del cliente
      if (clientId && creditAmount > 0) {
        await tx.client.update({
          where: { id: clientId },
          data: { balance: { increment: creditAmount } },
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
    const parsedAmount = parseFloat(amount) || 0;

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
      if (account.balance < parsedAmount)
        throw new Error('Saldo insuficiente en la cuenta de origen');

      await tx.account.update({
        where: { id: accountId },
        data: { balance: { decrement: parsedAmount } },
      });
      await tx.transaction.create({
        data: {
          amount: parsedAmount,
          type: 'WITHDRAWAL',
          concept: `Transferencia a Caja POS (Aut: ${adminUser.name})`,
          accountId,
        },
      });
      const updatedReg = await tx.cashRegister.update({
        where: { id: cashRegister.id },
        data: { manualInflows: { increment: parsedAmount } },
      });

      return updatedReg;
    });

    return res.status(200).json({ status: 'success', data: result });
  } catch (error: any) {
    return res.status(400).json({ status: 'error', message: error.message });
  }
};

// 7. Retirar dinero de la Caja Actual hacia Tesorería o Gasto (Sangría)
export const withdrawFromCashRegister = async (req: CustomRequest, res: Response) => {
  try {
    const { accountId, amount, adminEmail, adminPassword, concept } = req.body;
    const userId = req.user?.id!;
    const parsedAmount = parseFloat(amount) || 0;

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
      if (accountId) {
        const account = await tx.account.findUnique({ where: { id: accountId } });
        if (!account) throw new Error('Cuenta de destino no encontrada');

        await tx.account.update({
          where: { id: accountId },
          data: { balance: { increment: parsedAmount } },
        });
        await tx.transaction.create({
          data: {
            amount: parsedAmount,
            type: 'DEPOSIT',
            concept: `Retiro de Caja POS hacia ${account.name} (Aut: ${adminUser.name})`,
            accountId,
          },
        });
      } else {
        await tx.expense.create({
          data: {
            amount: parsedAmount,
            concept: concept || 'Retiro de efectivo de caja',
            accountId: null,
            userId: adminUser.id,
          },
        });
      }
      const updatedReg = await tx.cashRegister.update({
        where: { id: cashRegister.id },
        data: { manualOutflows: { increment: parsedAmount } },
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
        physicalBox: { select: { name: true } }, // ✅ AGREGADO para mostrar en el frontend
        depositAccount: { select: { name: true } },
        sales: {
          where: { paymentMethod: { contains: 'CASH' } },
          select: { receivedAmount: true, change: true }, // ✅ Traemos lo que nos interesa
        },
        purchases: {
          where: { accountId: null },
          select: { totalAmount: true },
        },
      },
      orderBy: { openedAt: 'desc' },
      take: 50,
    });

    const formattedHistory = history.map((reg) => {
      const cashSalesTotal = reg.sales.reduce(
        (acc, s) => acc + ((s.receivedAmount || 0) - (s.change || 0)), // ✅ FÓRMULA EXACTA
        0
      );
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
        physicalBoxName: reg.physicalBox?.name || 'N/A', // ✅ LISTO PARA USARSE
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
        closedAt: reg.closedAt,
      };
    });

    return res.status(200).json({ status: 'success', data: formattedHistory });
  } catch (error) {
    console.error('Error getting cash register history:', error);
    return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
  }
};

// 9. Cierre Forzoso por Administrador/Gerente
export const forceCloseCashRegister = async (req: CustomRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { countedAmount } = req.body;
    const adminRole = req.user?.role;
    const adminId = req.user?.id; // ✅ Capturamos el ID del admin que hace la acción

    // Solo ADMIN y MANAGER pueden forzar cierres
    if (adminRole !== 'ADMIN' && adminRole !== 'MANAGER') {
      return res
        .status(403)
        .json({ status: 'error', message: 'No autorizado para forzar cierres' });
    }

    const cashRegister = await prisma.cashRegister.findUnique({
      where: { id },
      include: {
        sales: { where: { paymentMethod: { contains: 'CASH' } } },
        purchases: { where: { accountId: null } },
      },
    });

    if (!cashRegister || cashRegister.status === 'CLOSED') {
      return res
        .status(400)
        .json({ status: 'error', message: 'Caja no encontrada o ya está cerrada' });
    }

    const cashSalesTotal = cashRegister.sales.reduce(
      (acc, s) => acc + ((s.receivedAmount || 0) - (s.change || 0)), // ✅ FÓRMULA EXACTA
      0
    );
    const cashPurchasesTotal = cashRegister.purchases.reduce((acc, p) => acc + p.totalAmount, 0);
    const expectedAmount =
      cashRegister.openingAmount +
      cashSalesTotal -
      cashPurchasesTotal +
      (cashRegister.manualInflows || 0) -
      (cashRegister.manualOutflows || 0);

    const realAmount = parseFloat(countedAmount) || 0;
    const difference = realAmount - expectedAmount;
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

    // ✅ REGISTRO EN LA BITÁCORA DEL SISTEMA (AUDITORÍA)
    await logAction(
      adminId,
      'FORCE_CLOSE_CASH_REGISTER',
      'CashRegister',
      cashRegister.id,
      `Caja forzosamente cerrada. Descuadre de ${difference} aplicado a la cuenta del cajero.`
    );

    return res.status(200).json({
      status: 'success',
      message: `Caja cerrada forzosamente. Descuadre de $${difference.toLocaleString('es-CO')} aplicado a la cuenta del cajero.`,
    });
  } catch (error) {
    console.error('Error force closing cash register:', error);
    return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
  }
};

// SUSPENDER VENTA
export const suspendSale = async (req: CustomRequest, res: Response) => {
  try {
    const { items, discount } = req.body; // ✅ Recibimos el descuento
    const userId = req.user?.id!;

    if (!items || items.length === 0) {
      return res.status(400).json({ status: 'error', message: 'El carrito está vacío' });
    }

    // ✅ Guardamos el carrito y el descuento juntos en el JSON
    const suspended = await prisma.suspendedSale.create({
      data: { userId, items: { cart: items, discount: discount || 0 } as any },
    });

    return res.status(201).json({ status: 'success', data: suspended });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Error al suspender venta' });
  }
};

// OBTENER VENTAS SUSPENDIDAS DEL CAJERO
export const getSuspendedSales = async (req: CustomRequest, res: Response) => {
  try {
    const userId = req.user?.id!;
    const sales = await prisma.suspendedSale.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20, // Últimas 20 ventas pausadas
    });
    return res.status(200).json({ status: 'success', data: sales });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Error al obtener ventas' });
  }
};

// ELIMINAR VENTA SUSPENDIDA (Al recuperarla o cancelarla)
export const deleteSuspendedSale = async (req: CustomRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.suspendedSale.delete({ where: { id } });
    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Error al eliminar' });
  }
};
