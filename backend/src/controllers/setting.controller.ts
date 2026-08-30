import { Response } from 'express';
import { CustomRequest } from '../middlewares/auth.middleware';
import prisma from '../config/prisma';
import { logAction } from '../utils/audit'; // ✅ Importado

// Obtener configuración
export const getSettings = async (req: CustomRequest, res: Response) => {
  try {
    let settings = await prisma.setting.findUnique({ where: { id: 1 } });
    if (!settings) {
      settings = await prisma.setting.create({ data: { id: 1 } });
    }
    return res.status(200).json({ status: 'success', data: settings });
  } catch (error) {
    console.error('Error en getSettings:', error);
    return res.status(500).json({ status: 'error', message: 'Error interno al obtener config' });
  }
};

// Actualizar configuración
export const updateSettings = async (req: CustomRequest, res: Response) => {
  try {
    const {
      companyName,
      taxId,
      address,
      phone,
      currencySymbol,
      ticketFooter,
      quoteFooter,
      retailMargin,
      wholesaleMargin,
    } = req.body;

    const dataToUpdate: any = {
      companyName: companyName || '',
      taxId: taxId || '',
      address: address || '',
      phone: phone || '',
      currencySymbol: currencySymbol || '$',
      ticketFooter: ticketFooter || '',
      quoteFooter: quoteFooter || '',
      retailMargin: parseFloat(retailMargin) || 50,
      wholesaleMargin: parseFloat(wholesaleMargin) || 20,
    };

    const settings = await prisma.setting.upsert({
      where: { id: 1 },
      update: dataToUpdate,
      create: { id: 1, ...dataToUpdate },
    });

    // ✅ SOLUCIÓN: Convertimos el ID 1 a string ("1") para que coincida con la utilidad logAction
    await logAction(
      req.user?.id,
      'UPDATE_SETTINGS',
      'Setting',
      '1',
      `Configuración de la empresa actualizada. Nombre: ${companyName}`
    );

    return res.status(200).json({ status: 'success', data: settings });
  } catch (error: any) {
    console.error('Error en updateSettings:', error);
    return res
      .status(500)
      .json({ status: 'error', message: error.message || 'Error al guardar configuración' });
  }
};

// --- GESTIÓN DE CATÁLOGOS ---

export const getCatalogs = async (req: CustomRequest, res: Response) => {
  try {
    const [categories, brands, sizes, colors] = await Promise.all([
      prisma.category.findMany({ orderBy: { name: 'asc' } }),
      prisma.brand.findMany({ orderBy: { name: 'asc' } }),
      prisma.size.findMany({ orderBy: { name: 'asc' } }),
      prisma.color.findMany({ orderBy: { name: 'asc' } }),
    ]);
    return res.status(200).json({ status: 'success', data: { categories, brands, sizes, colors } });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Error interno' });
  }
};

export const createCatalogItem = async (req: CustomRequest, res: Response) => {
  try {
    const { type, name, hex } = req.body;
    let result: any; // ✅ SOLUCIÓN: Le decimos a TS que es 'any' para evitar el error de inferencia

    if (type === 'category')
      result = await prisma.category.create({ data: { name, isActive: true } });
    else if (type === 'brand')
      result = await prisma.brand.create({ data: { name, isActive: true } });
    else if (type === 'size') result = await prisma.size.create({ data: { name } });
    else if (type === 'color')
      result = await prisma.color.create({ data: { name, hex: hex || '#000000' } });

    // ✅ SOLUCIÓN: Validamos que result exista antes de usar result.id
    if (!result) {
      return res.status(400).json({ status: 'error', message: 'Tipo de catálogo no válido' });
    }

    // ✅ Registro en bitácora
    await logAction(
      req.user?.id,
      `CREATE_${type.toUpperCase()}`,
      type,
      result.id,
      `Creó ${type}: ${name}`
    );

    return res.status(201).json({ status: 'success', data: result });
  } catch (error: any) {
    if (error.code === 'P2002')
      return res.status(400).json({ status: 'error', message: 'Ya existe' });
    return res.status(500).json({ status: 'error', message: 'Error al crear' });
  }
};

// ✅ MEJORA: Soft Delete para no romper historial de productos
export const deleteCatalogItem = async (req: CustomRequest, res: Response) => {
  try {
    const { type, id } = req.params;

    if (type === 'category') {
      await prisma.category.update({ where: { id }, data: { isActive: false } });
    } else if (type === 'brand') {
      await prisma.brand.update({ where: { id }, data: { isActive: false } });
    } else if (type === 'size') {
      await prisma.size.delete({ where: { id } }); // Tallas y colores sí se pueden borrar si no se han usado
    } else if (type === 'color') {
      await prisma.color.delete({ where: { id } });
    }

    // ✅ Registro en bitácora
    await logAction(
      req.user?.id,
      `TOGGLE_${type.toUpperCase()}`,
      type,
      id,
      `${type} desactivado/eliminado.`
    );

    return res
      .status(200)
      .json({ status: 'success', message: 'Catálogo desactivado correctamente' });
  } catch (error) {
    return res
      .status(500)
      .json({ status: 'error', message: 'No se puede eliminar, está en uso por un producto.' });
  }
};

// LIMPIAR CATÁLOGOS VACÍOS
export const cleanupEmptyCatalogs = async (req: CustomRequest, res: Response) => {
  try {
    // Eliminar categorías que NO tienen productos asociados
    const deletedCategories = await prisma.category.deleteMany({
      where: { products: { none: {} } }
    });

    // Eliminar marcas que NO tienen productos asociados
    const deletedBrands = await prisma.brand.deleteMany({
      where: { products: { none: {} } }
    });

    // Registro en bitácora
    await logAction(req.user?.id, 'CLEANUP_CATALOGS', 'Setting', undefined, `Limpieza de catálogos. Categorías eliminadas: ${deletedCategories.count}, Marcas eliminadas: ${deletedBrands.count}`);

    return res.status(200).json({
      status: 'success',
      message: `Limpieza completa. Se eliminaron ${deletedCategories.count} categorías y ${deletedBrands.count} marcas vacías.`
    });
  } catch (error: any) {
    console.error('Error cleaning catalogs:', error);
    return res.status(500).json({ status: 'error', message: 'Error al limpiar catálogos' });
  }
};
