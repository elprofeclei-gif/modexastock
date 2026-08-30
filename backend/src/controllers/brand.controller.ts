import { Response } from 'express';
import { CustomRequest } from '../middlewares/auth.middleware';
import prisma from '../config/prisma';
import { logAction } from '../utils/audit'; // ✅ Importado

// Obtener todas las marcas (Para panel de configuración)
export const getBrands = async (req: CustomRequest, res: Response) => {
  try {
    const brands = await prisma.brand.findMany({
      orderBy: { name: 'asc' },
    });
    return res.status(200).json({ status: 'success', data: brands });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
  }
};

// Crear una nueva marca
export const createBrand = async (req: CustomRequest, res: Response) => {
  try {
    const { name } = req.body;
    if (!name)
      return res.status(400).json({ status: 'error', message: 'El nombre es obligatorio' });

    const brand = await prisma.brand.create({ data: { name, isActive: true } });

    // ✅ Registro en bitácora
    await logAction(req.user?.id, 'CREATE_BRAND', 'Brand', brand.id, `Marca creada: ${name}`);

    return res.status(201).json({ status: 'success', data: brand });
  } catch (error: any) {
    if (error.code === 'P2002')
      return res.status(400).json({ status: 'error', message: 'Esta marca ya existe' });
    return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
  }
};

// ✅ NUEVA FUNCIÓN: Desactivar/Activar marca (Soft Delete)
export const toggleBrandStatus = async (req: CustomRequest, res: Response) => {
  try {
    const { id } = req.params;
    const brand = await prisma.brand.findUnique({ where: { id } });

    if (!brand) return res.status(404).json({ status: 'error', message: 'Marca no encontrada' });

    const updated = await prisma.brand.update({
      where: { id },
      data: { isActive: !brand.isActive },
    });

    // ✅ Registro en bitácora
    await logAction(
      req.user?.id,
      'TOGGLE_BRAND',
      'Brand',
      id,
      `Marca ${updated.isActive ? 'activada' : 'desactivada'}: ${updated.name}`
    );

    return res.status(200).json({ status: 'success', data: updated });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
  }
};
