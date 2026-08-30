import { Response } from 'express';
import { CustomRequest } from '../middlewares/auth.middleware';
import prisma from '../config/prisma';
import { logAction } from '../utils/audit'; // ✅ Importado

export const createCategory = async (req: CustomRequest, res: Response) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ status: 'error', message: 'El nombre es obligatorio' });

    const category = await prisma.category.create({ data: { name } });
    
    await logAction(req.user?.id, 'CREATE_CATEGORY', 'Category', category.id, `Categoría creada: ${name}`); // ✅
    
    return res.status(201).json({ status: 'success', data: category });
  } catch (error: any) {
    if (error.code === 'P2002') return res.status(400).json({ status: 'error', message: 'Esta categoría ya existe' });
    return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
  }
};

// ✅ NUEVA FUNCIÓN: Desactivar en lugar de borrar
export const toggleCategoryStatus = async (req: CustomRequest, res: Response) => {
  try {
    const { id } = req.params;
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) return res.status(404).json({ status: 'error', message: 'Categoría no encontrada' });

    const updated = await prisma.category.update({
      where: { id },
      data: { isActive: !category.isActive }
    });

    await logAction(req.user?.id, 'TOGGLE_CATEGORY', 'Category', id, `Categoría ${updated.isActive ? 'activada' : 'desactivada'}: ${updated.name}`);

    return res.status(200).json({ status: 'success', data: updated });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
  }
};