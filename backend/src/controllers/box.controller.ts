import { Response } from 'express';
import { CustomRequest } from '../middlewares/auth.middleware';
import prisma from '../config/prisma';

export const getPhysicalBoxes = async (req: CustomRequest, res: Response) => {
  try {
    const boxes = await prisma.physicalBox.findMany();
    return res.status(200).json({ status: 'success', data: boxes });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Error interno' });
  }
};
