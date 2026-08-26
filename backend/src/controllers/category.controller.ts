import { Response } from 'express';
import { CustomRequest } from '../middlewares/auth.middleware';
import prisma from '../config/prisma';

export const createCategory = async (req: CustomRequest, res: Response) => {
  try {
    const { name } = req.body;
    if (!name)
      return res.status(400).json({ status: 'error', message: 'El nombre es obligatorio' });

    const category = await prisma.category.create({ data: { name } });
    return res.status(201).json({ status: 'success', data: category });
  } catch (error: any) {
    if (error.code === 'P2002')
      return res.status(400).json({ status: 'error', message: 'Esta categoría ya existe' });
    return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
  }
};
