import { Response } from 'express';
import { CustomRequest } from '../middlewares/auth.middleware';
import prisma from '../config/prisma';

export const getMetadata = async (req: CustomRequest, res: Response) => {
  try {
    const [categories, brands, sizes, colors] = await Promise.all([
      prisma.category.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
      prisma.brand.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
      prisma.size.findMany({ orderBy: { name: 'asc' } }),
      prisma.color.findMany({ orderBy: { name: 'asc' } }),
    ]);

    return res.status(200).json({
      status: 'success',
      data: { categories, brands, sizes, colors },
    });
  } catch (error) {
    console.error('Error al obtener metadatos:', error);
    return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
  }
};
