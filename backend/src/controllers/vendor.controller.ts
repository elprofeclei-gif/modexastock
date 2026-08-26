import { Response } from 'express';
import { CustomRequest } from '../middlewares/auth.middleware';
import prisma from '../config/prisma';

export const createVendor = async (req: CustomRequest, res: Response) => {
  try {
    const { name, phone, email } = req.body;
    if (!name)
      return res.status(400).json({ status: 'error', message: 'El nombre es obligatorio' });

    const vendor = await prisma.vendor.create({
      data: { name, phone, email },
    });
    return res.status(201).json({ status: 'success', data: vendor });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Error interno' });
  }
};

export const getVendors = async (req: CustomRequest, res: Response) => {
  try {
    const vendors = await prisma.vendor.findMany({ orderBy: { name: 'asc' } });
    return res.status(200).json({ status: 'success', data: vendors });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Error interno' });
  }
};
