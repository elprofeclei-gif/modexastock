import { Response } from 'express';
import { CustomRequest } from '../middlewares/auth.middleware';
import prisma from '../config/prisma';
import { logAction } from '../utils/audit'; // ✅ IMPORTADO

export const getAccounts = async (req: CustomRequest, res: Response) => {
  try {
    const accounts = await prisma.account.findMany({
      include: { _count: { select: { expenses: true } } },
    });
    return res.status(200).json({ status: 'success', data: accounts });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Error interno' });
  }
};

export const createAccount = async (req: CustomRequest, res: Response) => {
  try {
    const { name, type, initialBalance } = req.body;
    const account = await prisma.account.create({
      data: { name, type, balance: parseFloat(initialBalance) || 0 },
    });
    return res.status(201).json({ status: 'success', data: account });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Error al crear cuenta' });
  }
};

export const getExpenseCategories = async (req: CustomRequest, res: Response) => {
  try {
    const categories = await prisma.expenseCategory.findMany();
    return res.status(200).json({ status: 'success', data: categories });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Error interno' });
  }
};

export const createExpenseCategory = async (req: CustomRequest, res: Response) => {
  try {
    const { name } = req.body;
    const category = await prisma.expenseCategory.create({ data: { name } });
    return res.status(201).json({ status: 'success', data: category });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Error al crear categoría' });
  }
};

export const createExpense = async (req: CustomRequest, res: Response) => {
  try {
    const { amount, concept, accountId, categoryId } = req.body;
    const userId = req.user?.id!;

    if (!amount || !concept || !accountId) {
      return res.status(400).json({ status: 'error', message: 'Faltan campos obligatorios' });
    }

    const parsedAmount = parseFloat(amount) || 0;

    const result = await prisma.$transaction(async (tx) => {
      const account = await tx.account.findUnique({ where: { id: accountId } });
      if (!account) throw new Error('Cuenta no encontrada');

      // ✅ Usar el monto parseado para validar saldo
      if (account.balance < parsedAmount) {
        throw new Error('Saldo insuficiente en la cuenta seleccionada');
      }

      const expense = await tx.expense.create({
        data: {
          amount: parsedAmount, // ✅
          concept,
          accountId,
          categoryId: categoryId || null,
          userId,
        },
      });

      await tx.account.update({
        where: { id: accountId },
        data: { balance: { decrement: parsedAmount } }, // ✅
      });

      // Guardar en el historial de transacciones
      await tx.transaction.create({
        data: {
          amount: parsedAmount, // ✅
          type: 'EXPENSE',
          concept: `Gasto: ${concept}`,
          accountId,
        },
      });

      return expense;
    });

    // ✅ REGISTRO EN LA BITÁCORA DEL SISTEMA
    await logAction(
      userId,
      'CREATE_EXPENSE',
      'Expense',
      result.id,
      `Gasto registrado por ${parsedAmount}. Concepto: ${concept}.`
    );

    return res.status(201).json({ status: 'success', data: result });
  } catch (error: any) {
    return res.status(400).json({ status: 'error', message: error.message });
  }
};

export const getExpenses = async (req: CustomRequest, res: Response) => {
  try {
    const expenses = await prisma.expense.findMany({
      include: {
        account: { select: { name: true } },
        category: { select: { name: true } },
        user: { select: { name: true } },
      },
      orderBy: { date: 'desc' },
      take: 50,
    });
    return res.status(200).json({ status: 'success', data: expenses });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Error interno' });
  }
};

export const getTransactions = async (req: CustomRequest, res: Response) => {
  try {
    const transactions = await prisma.transaction.findMany({
      include: {
        account: { select: { name: true } },
      },
      orderBy: { date: 'desc' },
      take: 50,
    });
    return res.status(200).json({ status: 'success', data: transactions });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Error interno' });
  }
};

// Movimiento manual (Préstamo, Capital, Retiro de socio, etc.)
export const createManualTransaction = async (req: CustomRequest, res: Response) => {
  try {
    const { accountId, amount, type, concept } = req.body;
    const userId = req.user?.id!;

    if (!accountId || !amount || !type || !concept) {
      return res.status(400).json({ status: 'error', message: 'Faltan campos obligatorios' });
    }

    const parsedAmount = parseFloat(amount) || 0;

    const result = await prisma.$transaction(async (tx) => {
      const account = await tx.account.findUnique({ where: { id: accountId } });
      if (!account) throw new Error('Cuenta no encontrada');

      // Si es un retiro (egreso manual), validar que haya saldo
      if (type === 'WITHDRAWAL' && account.balance < parsedAmount) {
        // ✅
        throw new Error('Saldo insuficiente en la cuenta para este retiro');
      }

      // Actualizar saldo de la cuenta
      await tx.account.update({
        where: { id: accountId },
        data: {
          balance: type === 'DEPOSIT' ? { increment: parsedAmount } : { decrement: parsedAmount }, // ✅
        },
      });

      // Guardar en historial de transacciones
      const transaction = await tx.transaction.create({
        data: {
          amount: parsedAmount, // ✅
          type: type,
          concept,
          accountId,
        },
      });

      return transaction;
    });

    // ✅ REGISTRO EN LA BITÁCORA DEL SISTEMA
    await logAction(
      userId,
      'CREATE_MANUAL_TRANSACTION',
      'Transaction',
      result.id,
      `Movimiento manual de Tesorería (${type}) por ${parsedAmount}. Concepto: ${concept}.`
    );

    return res.status(201).json({ status: 'success', data: result });
  } catch (error: any) {
    return res.status(400).json({ status: 'error', message: error.message });
  }
};
