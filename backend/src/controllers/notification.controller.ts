import { Response } from 'express';
import { CustomRequest } from '../middlewares/auth.middleware';
import prisma from '../config/prisma';

export const getMyNotifications = async (req: CustomRequest, res: Response) => {
  try {
    const userId = req.user?.id!;
    const role = req.user?.role!;
    const notifications: any[] = [];

    // 1. ALERTAS DE INVENTARIO (Solo Admin y Manager)
    if (role === 'ADMIN' || role === 'MANAGER') {
      const lowStock = await prisma.productVariant.findMany({
        where: { stock: { lte: prisma.productVariant.fields.minStock } },
        include: { product: true, size: true, color: true },
        take: 5,
      });
      lowStock.forEach((item) => {
        notifications.push({
          type: 'STOCK',
          icon: 'AlertTriangle',
          color: 'amber',
          title: 'Bajo Stock',
          message: `${item.product.name} (${item.size.name}/${item.color.name}) - Quedan ${item.stock}`,
          link: '/inventory',
        });
      });

      // 2. ALERTAS DE CAJEROS CON DESCUADRES (Solo Admin y Manager)
      const cashiersWithDebt = await prisma.user.findMany({
        where: { balance: { not: 0 } },
      });
      cashiersWithDebt.forEach((c) => {
        notifications.push({
          type: 'DEBT',
          icon: 'AlertCircle',
          color: 'red',
          title: 'Descuadre Pendiente',
          message: `${c.name} tiene un balance de ${c.balance} (Faltante/Sobrante)`,
          link: '/settlements',
        });
      });
    }

    // 3. ALERTAS DE TESORERÍA (Solo Admin y Manager)
    if (role === 'ADMIN' || role === 'MANAGER') {
      const voidedToday = await prisma.sale.count({
        where: { isVoided: true, voidedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
      });
      if (voidedToday > 0) {
        notifications.push({
          type: 'VOID',
          icon: 'Ban',
          color: 'red',
          title: 'Ventas Anuladas Hoy',
          message: `Se han anulado ${voidedToday} ventas hoy. Revisar bitácora.`,
          link: '/audit-logs',
        });
      }
    }

    // 4. ALERTAS PERSONALES PARA EL CAJERO (Deudas propias)
    const myBalance = await prisma.user.findUnique({ where: { id: userId } });
    if (myBalance && myBalance.balance < 0) {
      notifications.push({
        type: 'MY_DEBT',
        icon: 'Wallet',
        color: 'red',
        title: 'Tienes un Faltante',
        message: `Tienes un descuadre pendiente de ${myBalance.balance}. Acércate a administración.`,
        link: '/profile',
      });
    }

    return res.status(200).json({ status: 'success', data: notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return res.status(500).json({ status: 'error', message: 'Error interno' });
  }
};
