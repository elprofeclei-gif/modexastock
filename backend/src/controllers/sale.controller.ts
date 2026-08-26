import { Response } from 'express';
import { CustomRequest } from '../middlewares/auth.middleware';
import prisma from '../config/prisma';

// Obtener historial de ventas
export const getSales = async (req: CustomRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const role = req.user?.role;

    // Si es USER, filtra por su ID. Si es ADMIN/MANAGER, trae todas.
    const whereClause = role === 'USER' ? { userId } : {};

    const sales = await prisma.sale.findMany({
      where: whereClause,
      include: {
        user: { select: { name: true } },
        items: { 
          include: { 
            productVariant: { 
              include: { 
                product: true,
                size: true,   // <-- ASEGÚRATE DE QUE ESTÉ
                color: true   // <-- ASEGÚRATE DE QUE ESTÉ
              } 
            } 
          } 
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return res.status(200).json({ status: 'success', data: sales });
  } catch (error) {
    console.error('Error getting sales:', error);
    return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
  }
};