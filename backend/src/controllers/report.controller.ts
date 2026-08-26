import { Response } from 'express';
import { CustomRequest } from '../middlewares/auth.middleware';
import prisma from '../config/prisma';

export const getDashboardStats = async (req: CustomRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let todaySalesTotal = 0;
    let todaySalesCount = 0;
    let openCashRegister = 0;
    let bankBalance = 0;
    let cashiersData: any[] = [];

    const accounts = await prisma.account.findMany();
    bankBalance = accounts.reduce((acc, accData) => acc + accData.balance, 0);

    if (role === 'ADMIN' || role === 'MANAGER') {
      const todaySales = await prisma.sale.aggregate({
        _sum: { totalAmount: true },
        _count: true,
        where: { createdAt: { gte: today } },
      });
      todaySalesTotal = todaySales._sum.totalAmount || 0;
      todaySalesCount = todaySales._count || 0;

      const allOpenRegisters = await prisma.cashRegister.findMany({
        where: { status: 'OPEN' },
        include: {
          user: { select: { name: true } },
          sales: { select: { totalAmount: true, paymentMethod: true } },
          purchases: { where: { accountId: null }, select: { totalAmount: true } },
        },
      });

      allOpenRegisters.forEach((reg) => {
        const salesTotal = reg.sales
          .filter((s) => s.paymentMethod === 'CASH')
          .reduce((acc, s) => acc + s.totalAmount, 0);
        const purchasesTotal = reg.purchases.reduce((acc, p) => acc + p.totalAmount, 0);

        // FÓRMULA CORREGIDA: Se restan los retiros (manualOutflows)
        const expectedCash =
          reg.openingAmount +
          salesTotal -
          purchasesTotal +
          (reg.manualInflows || 0) -
          (reg.manualOutflows || 0);
        const totalSalesRegister = reg.sales.reduce((acc, s) => acc + s.totalAmount, 0);

        openCashRegister += expectedCash;
        cashiersData.push({
          name: reg.user.name,
          totalSales: totalSalesRegister,
          cashInDrawer: expectedCash,
        });
      });
    } else {
      const todaySales = await prisma.sale.aggregate({
        _sum: { totalAmount: true },
        _count: true,
        where: { createdAt: { gte: today }, userId: userId },
      });
      todaySalesTotal = todaySales._sum.totalAmount || 0;
      todaySalesCount = todaySales._count || 0;

      const myOpenRegister = await prisma.cashRegister.findFirst({
        where: { status: 'OPEN', userId: userId },
        include: {
          sales: { where: { paymentMethod: 'CASH' }, select: { totalAmount: true } },
          purchases: { where: { accountId: null }, select: { totalAmount: true } },
        },
      });

      if (myOpenRegister) {
        const salesTotal = myOpenRegister.sales.reduce((acc, s) => acc + s.totalAmount, 0);
        const purchasesTotal = myOpenRegister.purchases.reduce((acc, p) => acc + p.totalAmount, 0);
        // FÓRMULA CORREGIDA: Se restan los retiros (manualOutflows)
        openCashRegister =
          myOpenRegister.openingAmount +
          salesTotal -
          purchasesTotal +
          (myOpenRegister.manualInflows || 0) -
          (myOpenRegister.manualOutflows || 0);
      }
    }

    const totalProducts = await prisma.product.count();
    const activeCashiers = await prisma.cashRegister.count({ where: { status: 'OPEN' } });
    const totalUsers = await prisma.user.count({ where: { isActive: true } });

    const clientsData = await prisma.client.aggregate({ _sum: { balance: true }, _count: true });
    const todayExpenses = await prisma.expense.aggregate({
      _sum: { amount: true },
      where: { date: { gte: today } },
    });

    const inventory = await prisma.productVariant.findMany({ include: { product: true } });
    const inventoryValue = inventory.reduce((acc, v) => acc + v.stock * v.product.price, 0);
    const allVariants = await prisma.productVariant.findMany({
      select: { stock: true, minStock: true },
    });
    const lowStockVariants = allVariants.filter((v) => v.stock <= v.minStock).length;

    return res.status(200).json({
      status: 'success',
      data: {
        todaySalesTotal,
        todaySalesCount,
        openCashRegister,
        bankBalance,
        cashiersData,
        inventoryValue,
        lowStockVariants,
        totalProducts,
        totalClients: clientsData._count,
        accountsReceivable: clientsData._sum.balance || 0,
        todayExpenses: todayExpenses._sum.amount || 0,
        activeCashiers,
        totalUsers,
      },
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
  }
};

export const downloadSalesReport = async (req: CustomRequest, res: Response) => {
  try {
    const sales = await prisma.sale.findMany({
      include: {
        user: { select: { name: true } },
        items: { include: { productVariant: { include: { product: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const headers = ['Folio', 'Fecha', 'Cajero', 'Metodo de Pago', 'Total', 'Productos Vendidos'];
    const rows = sales.map((s) => {
      const date = new Date(s.createdAt).toLocaleString('es-ES');
      const itemsStr = s.items
        .map((i) => `${i.quantity}x ${i.productVariant.product.name}`)
        .join(' | ');
      return [
        s.id.substring(0, 8).toUpperCase(),
        `"${date}"`,
        `"${s.user.name}"`,
        s.paymentMethod,
        s.totalAmount.toFixed(2),
        `"${itemsStr}"`,
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="reporte_ventas_modexastock.csv"');
    return res.status(200).send(csv);
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Error al generar el reporte' });
  }
};
