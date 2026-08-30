import { Response } from 'express';
import { CustomRequest } from '../middlewares/auth.middleware';
import prisma from '../config/prisma';
import bcrypt from 'bcryptjs';
import { logAction } from '../utils/audit';

// Obtener historial de ventas (Con filtros avanzados)
export const getSales = async (req: CustomRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;
    const { search, startDate, endDate } = req.query;

    // Si es USER, filtra por su ID. Si es ADMIN/MANAGER, trae todas.
    const whereClause: any = role === 'USER' ? { userId } : {};

    // ✅ Filtro por nombre de cliente o Folio (ID de la venta)
    if (search) {
      whereClause.OR = [
        { client: { name: { contains: search as string, mode: 'insensitive' } } },
        { id: { contains: search as string, mode: 'insensitive' } }, // Buscar por Folio
      ];
    }

    // ✅ Filtro por rango de fechas exacto
    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(new Date(endDate as string).setHours(23, 59, 59, 999)),
      };
    }

    const sales = await prisma.sale.findMany({
      where: whereClause,
      include: {
        user: { select: { name: true } },
        client: { select: { name: true, document: true } }, // ✅ Traemos el cliente
        items: {
          include: {
            productVariant: {
              include: {
                product: true,
                size: true,
                color: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 200, // Limitamos a 200 para no colapsar el navegador
    });

    return res.status(200).json({ status: 'success', data: sales });
  } catch (error) {
    console.error('Error getting sales:', error);
    return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
  }
};

// ANULAR VENTA (Requiere Auth de Admin)
export const voidSale = async (req: CustomRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { adminEmail, adminPassword, reason } = req.body;
    const userId = req.user?.id!;

    // 1. Verificar credenciales del Administrador
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

    // 2. Buscar la venta original
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!sale) return res.status(404).json({ status: 'error', message: 'Venta no encontrada' });
    if (sale.isVoided)
      return res.status(400).json({ status: 'error', message: 'Esta venta ya está anulada.' });

    // 3. Transacción para revertir todo
    await prisma.$transaction(async (tx) => {
      // A. Devolver inventario y registrar en Kardex
      for (const item of sale.items) {
        await tx.productVariant.update({
          where: { id: item.productVariantId },
          data: { stock: { increment: item.quantity } },
        });

        // ✅ REGISTRO EN KARDEX (Devolución por anulación)
        await tx.inventoryMovement.create({
          data: {
            productVariantId: item.productVariantId,
            userId: adminUser.id,
            type: 'VOID_SALE',
            quantityChange: item.quantity, // Positivo porque es entrada (devolución)
            reason: `Anulación de venta #${sale.id.substring(0, 8)}`,
          },
        });
      }

      // B. Revertir dinero
      if (sale.paymentMethod === 'CREDIT' && sale.clientId) {
        await tx.client.update({
          where: { id: sale.clientId },
          data: { balance: { decrement: sale.totalAmount } },
        });
      } else if (sale.paymentMethod === 'CASH') {
        const openCashRegister = await tx.cashRegister.findFirst({
          where: { userId, status: 'OPEN' },
        });

        if (openCashRegister) {
          await tx.cashRegister.update({
            where: { id: openCashRegister.id },
            data: { manualOutflows: { increment: sale.totalAmount } },
          });
        } else {
          await tx.expense.create({
            data: {
              amount: sale.totalAmount,
              concept: `Reembolso por anulación de venta #${sale.id.substring(0, 8)}`,
              accountId: null,
              userId: adminUser.id,
            },
          });
        }
      } else if (sale.paymentMethod === 'CARD' || sale.paymentMethod === 'TRANSFER') {
        await tx.expense.create({
          data: {
            amount: sale.totalAmount,
            concept: `Reembolso por anulación de venta #${sale.id.substring(0, 8)} (${sale.paymentMethod})`,
            accountId: null,
            userId: adminUser.id,
          },
        });
      }

      // C. Marcar la venta como anulada
      await tx.sale.update({
        where: { id: sale.id },
        data: {
          isVoided: true,
          voidedAt: new Date(),
          voidedById: adminUser.id,
          voidedReason: reason || 'Sin motivo especificado',
        },
      });
    });

    // ✅ REGISTRO EN LA BITÁCORA DEL SISTEMA (AUDITORÍA)
    await logAction(
      adminUser.id,
      'VOID_SALE',
      'Sale',
      sale.id,
      `Venta anulada por ${reason}. Total revertido: ${sale.totalAmount}.`
    );

    return res.status(200).json({
      status: 'success',
      message: 'Venta anulada correctamente. Inventario y dinero revertidos.',
    });
  } catch (error: any) {
    console.error('Error voiding sale:', error);
    return res
      .status(500)
      .json({ status: 'error', message: error.message || 'Error interno del servidor' });
  }
};
