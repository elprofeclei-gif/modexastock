import { Response } from 'express';
import { CustomRequest } from '../middlewares/auth.middleware';
import prisma from '../config/prisma';

export const getDashboardStats = async (req: CustomRequest, res: Response) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // Fecha de hace 7 días para la gráfica
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6); // 6 días atrás + hoy = 7 días
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // 1. Ventas de Hoy (Excluyendo anuladas)
    const todaySales = await prisma.sale.aggregate({
      _sum: { totalAmount: true },
      where: { 
        createdAt: { gte: startOfDay, lte: endOfDay },
        isVoided: false 
      }
    });

    // 2. Efectivo total en cajas físicas
    const physicalBoxes = await prisma.physicalBox.aggregate({
      _sum: { balance: true }
    });

    // 3. Total por cobrar (Deudas de clientes)
    const clientsDebt = await prisma.client.aggregate({
      _sum: { balance: true }
    });

    // 4. Productos con bajo stock (para alertas)
    const lowStockVariants = await prisma.productVariant.findMany({
      where: { stock: { lte: 5 } }, // 5 o menos
      include: { product: { select: { name: true } } },
      take: 5
    });

    // 5. Ventas de los últimos 7 días (para la gráfica)
    const last7DaysSales = await prisma.sale.findMany({
      where: { 
        createdAt: { gte: sevenDaysAgo },
        isVoided: false 
      },
      select: { totalAmount: true, createdAt: true }
    });

    // Agrupar por día
    const salesByDay = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0,0,0,0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayTotal = last7DaysSales
        .filter(s => s.createdAt >= date && s.createdAt < nextDate)
        .reduce((acc, s) => acc + s.totalAmount, 0);

      salesByDay.push({
        date: date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
        total: dayTotal
      });
    }
    salesByDay.reverse(); // Para que la gráfica vaya de izquierda a derecha

    // 6. Top 5 productos más vendidos (Histórico)
    const topProductsRaw = await prisma.saleItem.groupBy({
      by: ['productVariantId'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5
    });

    const topProducts = await Promise.all(
      topProductsRaw.map(async (item) => {
        const variant = await prisma.productVariant.findUnique({
          where: { id: item.productVariantId },
          include: { product: { select: { name: true } } }
        });
        return {
          name: variant?.product.name || 'Desconocido',
          quantity: item._sum.quantity
        };
      })
    );

    return res.status(200).json({
      status: 'success',
      data: {
        todaySales: todaySales._sum.totalAmount || 0,
        cashInBoxes: physicalBoxes._sum.balance || 0,
        pendingDebt: clientsDebt._sum.balance || 0,
        lowStockCount: lowStockVariants.length,
        salesByDay,
        topProducts,
        lowStockVariants
      }
    });

  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
  }
};