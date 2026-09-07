import { Response } from 'express';
import { CustomRequest } from '../middlewares/auth.middleware';
import prisma from '../config/prisma';

export const getMyNotifications = async (req: CustomRequest, res: Response) => {
  try {
    const userId = req.user?.id!;
    const role = req.user?.role!;
    const groups: any[] = [];
    let totalAlerts = 0;

    if (role === 'ADMIN' || role === 'MANAGER') {
      // 1. GRUPO DE INVENTARIO
      // A) Productos Totalmente Agotados (Stock = 0)
      const outOfStockCount = await prisma.productVariant.count({
        where: { stock: 0 },
      });

      if (outOfStockCount > 0) {
        totalAlerts += outOfStockCount;
        const outOfStockItems = await prisma.productVariant.findMany({
          where: { stock: 0 },
          include: { product: true, size: true, color: true },
          take: 20,
        });
        groups.push({
          id: 'OUT_OF_STOCK',
          title: 'Productos Agotados',
          icon: 'XCircle',
          color: 'red',
          count: outOfStockCount,
          items: outOfStockItems.map((item) => ({
            message: `${item.product.name} (${item.size.name}/${item.color.name}) - ¡SIN STOCK!`,
          })),
        });
      }

      // B) Productos con Bajo Stock (Stock > 0 pero <= minStock)
      const lowStockCount = await prisma.productVariant.count({
        where: {
          stock: { gt: 0, lte: prisma.productVariant.fields.minStock },
        },
      });

      if (lowStockCount > 0) {
        totalAlerts += lowStockCount;
        const lowStockItems = await prisma.productVariant.findMany({
          where: {
            stock: { gt: 0, lte: prisma.productVariant.fields.minStock },
          },
          include: { product: true, size: true, color: true },
          take: 20,
        });
        groups.push({
          id: 'STOCK',
          title: 'Productos Bajo Stock',
          icon: 'AlertTriangle',
          color: 'amber',
          count: lowStockCount,
          items: lowStockItems.map((item) => ({
            message: `${item.product.name} (${item.size.name}/${item.color.name}) - Quedan ${item.stock}`,
          })),
        });
      }

      // 2. GRUPO DE DESCUADRES DE CAJEROS
      const cashiersWithDebtCount = await prisma.user.count({
        where: { balance: { not: 0 } },
      });

      if (cashiersWithDebtCount > 0) {
        totalAlerts += cashiersWithDebtCount;
        const cashiersWithDebt = await prisma.user.findMany({
          where: { balance: { not: 0 } },
          take: 20,
        });
        groups.push({
          id: 'DEBT',
          title: 'Descuadres de Cajeros',
          icon: 'AlertCircle',
          color: 'red',
          count: cashiersWithDebtCount,
          items: cashiersWithDebt.map((c) => ({
            message: `${c.name} tiene un balance de ${c.balance} (Faltante/Sobrante)`,
          })),
        });
      }

      // 3. GRUPO DE VENTAS ANULADAS HOY
      const voidedToday = await prisma.sale.count({
        where: { isVoided: true, voidedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      });

      if (voidedToday > 0) {
        totalAlerts += voidedToday;
        const voidedSales = await prisma.sale.findMany({
          where: { isVoided: true, voidedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
          take: 20,
        });
        groups.push({
          id: 'VOID',
          title: 'Ventas Anuladas Hoy',
          icon: 'Ban',
          color: 'red',
          count: voidedToday,
          items: voidedSales.map((s) => ({
            message: `Folio #${s.id.substring(0, 8)} - Total: ${s.totalAmount}`,
          })),
        });
      }
    }

    // 4. ALERTA PERSONAL PARA EL CAJERO
    const myBalance = await prisma.user.findUnique({ where: { id: userId } });
    if (myBalance && myBalance.balance < 0) {
      totalAlerts += 1;
      groups.push({
        id: 'MY_DEBT',
        title: 'Tienes un Faltante',
        icon: 'Wallet',
        color: 'red',
        count: 1,
        items: [
          {
            message: `Tienes un descuadre pendiente de ${myBalance.balance}. Acércate a administración.`,
          },
        ],
      });
    }

    return res.status(200).json({ status: 'success', data: groups, total: totalAlerts });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ status: 'error', message: 'Error interno' });
  }
};
