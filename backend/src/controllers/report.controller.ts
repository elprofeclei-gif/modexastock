import { Response } from 'express';
import { CustomRequest } from '../middlewares/auth.middleware';
import prisma from '../config/prisma';

export const getDashboardStats = async (req: CustomRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let todaySalesTotal = 0;
    let todaySalesCount = 0;
    let yesterdaySalesTotal = 0;
    let salesVariation = 0;
    let avgTicket = 0;
    let openCashRegister = 0;
    let bankBalance = 0;
    let cashiersData: any[] = [];
    let topProducts: any[] = [];

    const accounts = await prisma.account.findMany();
    bankBalance = accounts.reduce((acc, accData) => acc + accData.balance, 0);

    if (role === 'ADMIN' || role === 'MANAGER') {
      // Ventas de Hoy
      const todaySales = await prisma.sale.aggregate({
        _sum: { totalAmount: true },
        _count: true,
        where: { createdAt: { gte: today } },
      });
      todaySalesTotal = todaySales._sum.totalAmount || 0;
      todaySalesCount = todaySales._count || 0;

      // Ventas de Ayer (para variación)
      const yesterdaySales = await prisma.sale.aggregate({
        _sum: { totalAmount: true },
        where: { createdAt: { gte: yesterday, lt: today } },
      });
      yesterdaySalesTotal = yesterdaySales._sum.totalAmount || 0;

      // Cálculos de variación y ticket promedio
      salesVariation =
        yesterdaySalesTotal > 0
          ? ((todaySalesTotal - yesterdaySalesTotal) / yesterdaySalesTotal) * 100
          : 0;
      avgTicket = todaySalesCount > 0 ? todaySalesTotal / todaySalesCount : 0;

      // Cajeros en Turno
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
          totalSales: reg.sales.length,
          cashInDrawer: expectedCash,
          startTime: reg.openedAt,
        });
      });

      // Top 5 Productos Más Vendidos (Hoy)
      const topItems = await prisma.saleItem.groupBy({
        by: ['productVariantId'],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
        where: { sale: { createdAt: { gte: today } } },
      });

      const variantIds = topItems.map((t) => t.productVariantId);
      const variants = await prisma.productVariant.findMany({
        where: { id: { in: variantIds } },
        include: { product: { select: { name: true, imageUrl: true } } },
      });

      topProducts = topItems.map((t) => {
        const v = variants.find((v) => v.id === t.productVariantId);
        return {
          name: v?.product.name || 'Desconocido',
          imageUrl: v?.product.imageUrl,
          quantity: t._sum.quantity,
        };
      });
    } else {
      // Lógica para USER (Cajero)
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
        openCashRegister =
          myOpenRegister.openingAmount +
          salesTotal -
          purchasesTotal +
          (myOpenRegister.manualInflows || 0) -
          (myOpenRegister.manualOutflows || 0);
      }
    }

    // Inventario y Alertas Detalladas
    const totalProducts = await prisma.product.count();
    const totalVariants = await prisma.productVariant.count();

    // Alertas Críticas (<=2) y Bajas (<=10)
    const lowStockVariantsRaw = await prisma.productVariant.findMany({
      where: { stock: { lte: 10 } },
      include: { product: true, size: true, color: true },
      orderBy: { stock: 'asc' },
      take: 5,
    });

    const lowStockVariants = lowStockVariantsRaw.map((v) => ({
      id: v.id,
      name: v.product.name,
      size: v.size.name,
      color: v.color.name,
      stock: v.stock,
      severity: v.stock <= 2 ? 'critical' : 'low',
    }));

    const criticalCount = lowStockVariantsRaw.filter((v) => v.stock <= 2).length;
    const lowCount = lowStockVariantsRaw.filter((v) => v.stock > 2 && v.stock <= 10).length;

    const inventory = await prisma.productVariant.findMany({ include: { product: true } });
    const inventoryValue = inventory.reduce((acc, v) => acc + v.stock * v.product.price, 0);

    const activeCashiers = await prisma.cashRegister.count({ where: { status: 'OPEN' } });
    const totalUsers = await prisma.user.count({ where: { isActive: true } });
    const clientsData = await prisma.client.aggregate({ _sum: { balance: true }, _count: true });
    const todayExpenses = await prisma.expense.aggregate({
      _sum: { amount: true },
      where: { date: { gte: today } },
    });

    return res.status(200).json({
      status: 'success',
      data: {
        // KPIs Financieros
        todaySalesTotal,
        todaySalesCount,
        salesVariation, // NUEVO
        avgTicket, // NUEVO
        openCashRegister,
        bankBalance,
        todayExpenses: todayExpenses._sum.amount || 0,

        // KPIs Operativos
        totalProducts,
        totalVariants,
        inventoryValue,
        accountsReceivable: clientsData._sum.balance || 0,
        totalClients: clientsData._count,
        totalUsers,
        activeCashiers,

        // Tablas del Dashboard
        cashiersData,
        topProducts, // NUEVO

        // Alertas
        lowStockVariants, // NUEVO (Array de objetos)
        criticalCount, // NUEVO
        lowCount, // NUEVO
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
