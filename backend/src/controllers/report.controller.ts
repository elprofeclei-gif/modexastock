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
    let todayCOGS = 0; // ✅ NUEVO: Costo de mercancía vendida hoy
    let netProfit = 0; // ✅ NUEVO: Utilidad neta hoy
    let todayVoidedSales = 0;

    const accounts = await prisma.account.findMany();
    bankBalance = accounts.reduce((acc, accData) => acc + accData.balance, 0);

    if (role === 'ADMIN' || role === 'MANAGER') {
      // ✅ En lugar de aggregate, traemos las ventas con sus items para poder sumar el costo
      const todaySalesData = await prisma.sale.findMany({
        where: { createdAt: { gte: today }, isVoided: false },
        select: {
          totalAmount: true,
          items: {
            select: {
              quantity: true,
              productVariant: { select: { product: { select: { cost: true } } } },
            },
          },
        },
      });

      todaySalesCount = todaySalesData.length;

      // ✅ Calculamos el total de ventas y el costo de esa mercancía
      todaySalesData.forEach((sale) => {
        todaySalesTotal += sale.totalAmount;
        sale.items.forEach((item) => {
          todayCOGS += item.quantity * (item.productVariant?.product?.cost || 0);
        });
      });
      // ✅ 3. AGREGAR ESTO NUEVO AQUÍ DEBAJO (Para contar las anuladas)
      todayVoidedSales = await prisma.sale.count({
        where: {
          voidedAt: { gte: today },
          isVoided: true,
        },
      });

      const yesterdaySales = await prisma.sale.aggregate({
        _sum: { totalAmount: true },
        where: { createdAt: { gte: yesterday, lt: today }, isVoided: false },
      });
      yesterdaySalesTotal = yesterdaySales._sum.totalAmount || 0;

      salesVariation =
        yesterdaySalesTotal > 0
          ? ((todaySalesTotal - yesterdaySalesTotal) / yesterdaySalesTotal) * 100
          : 0;
      avgTicket = todaySalesCount > 0 ? todaySalesTotal / todaySalesCount : 0;

      const allOpenRegisters = await prisma.cashRegister.findMany({
        where: { status: 'OPEN' },
        include: {
          user: { select: { name: true } },
          sales: {
            select: { totalAmount: true, paymentMethod: true, receivedAmount: true, change: true },
          },
          purchases: { where: { accountId: null }, select: { totalAmount: true } },
        },
      });

      allOpenRegisters.forEach((reg) => {
        // ✅ FÓRMULA MIXTA: Sumar recibido menos cambio solo si incluye CASH
        const salesTotal = reg.sales
          .filter((s) => s.paymentMethod.includes('CASH'))
          .reduce((acc, s) => acc + ((s.receivedAmount || 0) - (s.change || 0)), 0);

        const purchasesTotal = reg.purchases.reduce((acc, p) => acc + p.totalAmount, 0);
        const expectedCash =
          reg.openingAmount +
          salesTotal -
          purchasesTotal +
          (reg.manualInflows || 0) -
          (reg.manualOutflows || 0);

        openCashRegister += expectedCash;
        cashiersData.push({
          name: reg.user.name,
          totalSales: reg.sales.length,
          cashInDrawer: expectedCash,
          startTime: reg.openedAt,
        });
      });

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
      const todaySales = await prisma.sale.aggregate({
        _sum: { totalAmount: true },
        _count: true,
        where: { createdAt: { gte: today }, userId, isVoided: false },
      });
      todaySalesTotal = todaySales._sum.totalAmount || 0;
      todaySalesCount = todaySales._count || 0;

      const myOpenRegister = await prisma.cashRegister.findFirst({
        where: { status: 'OPEN', userId },
        include: {
          sales: {
            where: { paymentMethod: { contains: 'CASH' } },
            select: { receivedAmount: true, change: true },
          },
          purchases: { where: { accountId: null }, select: { totalAmount: true } },
        },
      });

      if (myOpenRegister) {
        const salesTotal = myOpenRegister.sales.reduce(
          (acc, s) => acc + ((s.receivedAmount || 0) - (s.change || 0)),
          0
        );
        const purchasesTotal = myOpenRegister.purchases.reduce((acc, p) => acc + p.totalAmount, 0);
        openCashRegister =
          myOpenRegister.openingAmount +
          salesTotal -
          purchasesTotal +
          (myOpenRegister.manualInflows || 0) -
          (myOpenRegister.manualOutflows || 0);
      }
    }

    // Inventario
    const totalProducts = await prisma.product.count();
    const totalVariants = await prisma.productVariant.count();

    const inventory = await prisma.productVariant.findMany({ include: { product: true } });
    const totalStockUnits = inventory.reduce((acc, v) => acc + v.stock, 0);
    const inventoryValue = inventory.reduce((acc, v) => acc + v.stock * v.product.price, 0);

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

    const activeCashiers = await prisma.cashRegister.count({ where: { status: 'OPEN' } });
    const clientsData = await prisma.client.aggregate({ _sum: { balance: true }, _count: true });

    // ✅ NUEVO: Calcular total de deudas con proveedores
    const vendorsData = await prisma.vendor.aggregate({ _sum: { balance: true } });

    const todayExpenses = await prisma.expense.aggregate({
      _sum: { amount: true },
      where: { date: { gte: today } },
    });

    // Gráfica de Ventas
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const last7DaysSales = await prisma.sale.findMany({
      where: { createdAt: { gte: sevenDaysAgo }, isVoided: false },
      select: { totalAmount: true, createdAt: true },
    });

    const salesByDay = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayTotal = last7DaysSales
        .filter((s) => s.createdAt >= date && s.createdAt < nextDate)
        .reduce((acc, s) => acc + s.totalAmount, 0);

      salesByDay.push({
        date: date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
        total: dayTotal,
      });
    }
    salesByDay.reverse();

    // ✅ Calcular Utilidad Neta (Ventas - Costo - Gastos)
    const todayExpensesTotal = todayExpenses._sum.amount || 0;
    netProfit = todaySalesTotal - todayCOGS - todayExpensesTotal;

    return res.status(200).json({
      status: 'success',
      data: {
        todaySalesTotal,
        todaySalesCount,
        salesVariation,
        avgTicket,
        openCashRegister,
        bankBalance,
        todayExpenses: todayExpensesTotal,
        todayCOGS,
        netProfit,
        voidedSalesToday: todayVoidedSales,
        totalProducts,
        totalVariants,
        totalStockUnits,
        inventoryValue,
        accountsReceivable: clientsData._sum.balance || 0,
        accountsPayable: vendorsData._sum.balance || 0,
        totalClients: clientsData._count,
        activeCashiers,

        cashiersData,
        topProducts,
        salesByDay,

        lowStockVariants,
        criticalCount,
        lowCount,
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

// REPORTE DE UTILIDADES Y RENTABILIDAD (P&G)
export const getProfitLoss = async (req: CustomRequest, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    // Fechas por defecto (Mes actual)
    const start = startDate
      ? new Date(startDate as string)
      : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate as string) : new Date();

    // Asegurar que la fecha final cubra hasta el último segundo del día
    end.setHours(23, 59, 59, 999);

    // 1. Buscar todas las ventas del periodo (no anuladas)
    const sales = await prisma.sale.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        isVoided: false,
      },
      include: {
        items: {
          include: {
            productVariant: { include: { product: true } },
          },
        },
      },
    });

    // 2. Calcular Ingresos y COGS (Costo de Mercancía Vendida)
    let totalRevenue = 0;
    let totalCOGS = 0;

    sales.forEach((sale) => {
      totalRevenue += sale.totalAmount;
      sale.items.forEach((item) => {
        // Costo del producto en el momento de la venta
        totalCOGS += item.quantity * (item.productVariant.product.cost || 0);
      });
    });

    const grossProfit = totalRevenue - totalCOGS;

    // 3. Calcular Gastos Operativos del periodo
    const expensesData = await prisma.expense.aggregate({
      _sum: { amount: true },
      where: {
        date: { gte: start, lte: end },
      },
    });
    const totalExpenses = Math.abs(expensesData._sum.amount || 0); // Usar abs porque los sobrantes se guardan en negativo

    // 4. Utilidad Neta
    const netProfit = grossProfit - totalExpenses;

    // 5. Margen de Rentabilidad (%)
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return res.status(200).json({
      status: 'success',
      data: {
        totalRevenue,
        totalCOGS,
        grossProfit,
        totalExpenses,
        netProfit,
        profitMargin: parseFloat(profitMargin.toFixed(2)),
      },
    });
  } catch (error) {
    console.error('Error getting P&L report:', error);
    return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
  }
};

// EXPORTAR INVENTARIO A CSV
export const downloadInventoryReport = async (req: CustomRequest, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        brand: true,
        variants: { include: { size: true, color: true } },
      },
      orderBy: { name: 'asc' },
    });

    const headers = [
      'SKU',
      'Nombre',
      'Categoría',
      'Marca',
      'Talla',
      'Color',
      'Stock Actual',
      'Costo Unit.',
      'Precio Venta',
      'Valor Inventario',
    ];
    const rows = products.flatMap((p) =>
      p.variants.map((v) =>
        [
          p.sku,
          `"${p.name}"`, // Comillas para evitar que Excel rompa si hay comas
          `"${p.category.name}"`,
          `"${p.brand.name}"`,
          v.size.name,
          v.color.name,
          v.stock,
          (p.cost || 0).toFixed(2),
          p.price.toFixed(2),
          (v.stock * p.price).toFixed(2), // Valor total de esa variante
        ].join(',')
      )
    );

    const csv = [headers.join(','), ...rows].join('\n');

    // BOM al inicio para que Excel reconozca los acentos y la ñ
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="inventario_modexastock.csv"');
    return res.status(200).send('\ufeff' + csv); // \ufeff es el BOM
  } catch (error) {
    console.error('Error generating inventory report:', error);
    return res.status(500).json({ status: 'error', message: 'Error al generar el reporte' });
  }
};
