import { Response } from 'express';
import { CustomRequest } from '../middlewares/auth.middleware';
import prisma from '../config/prisma';
import { logAction } from '../utils/audit'; // ✅

export const getPhysicalBoxes = async (req: CustomRequest, res: Response) => {
  try {
    const boxes = await prisma.physicalBox.findMany();
    return res.status(200).json({ status: 'success', data: boxes });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Error interno' });
  }
};

// ✅ Crear caja física
export const createPhysicalBox = async (req: CustomRequest, res: Response) => {
  try {
    const { name, openingBalance } = req.body;
    if (!name) return res.status(400).json({ status: 'error', message: 'El nombre es obligatorio' });

    const box = await prisma.physicalBox.create({
      data: { name, balance: parseFloat(openingBalance) || 0 }
    });

    await logAction(req.user?.id, 'CREATE_PHYSICAL_BOX', 'PhysicalBox', box.id, `Caja física creada: ${name} con saldo ${box.balance}`);

    return res.status(201).json({ status: 'success', data: box });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Error interno' });
  }
};