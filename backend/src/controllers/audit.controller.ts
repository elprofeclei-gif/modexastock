import { Response } from 'express';
import { CustomRequest } from '../middlewares/auth.middleware';
import prisma from '../config/prisma';

// Obtener historial de la bitácora (Con filtros y paginación)
export const getAuditLogs = async (req: CustomRequest, res: Response) => {
  try {
    const { action, entity, startDate, endDate, page = '1', limit = '50' } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 50;

    // Construir el filtro dinámicamente
    const where: any = {};
    if (action) {
      where.action = { contains: action as string, mode: 'insensitive' };
    }
    if (entity) {
      where.entity = entity as string;
    }
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(new Date(endDate as string).setHours(23, 59, 59, 999)), // Incluye todo el día final
      };
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { name: true } }, // Sabemos quién hizo la acción
        },
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return res.status(200).json({
      status: 'success',
      data: logs,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
  }
};
