import { Response } from 'express';
import { CustomRequest } from '../middlewares/auth.middleware';
import prisma from '../config/prisma';

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
      quoteFooter: quoteFooter || '', // <-- NUEVO
      retailMargin: parseFloat(retailMargin) || 50,
      wholesaleMargin: parseFloat(wholesaleMargin) || 20,
    };

    const settings = await prisma.setting.upsert({
      where: { id: 1 },
      update: dataToUpdate,
      create: { id: 1, ...dataToUpdate },
    });

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
    let result;
    if (type === 'category') result = await prisma.category.create({ data: { name } });
    else if (type === 'brand') result = await prisma.brand.create({ data: { name } });
    else if (type === 'size') result = await prisma.size.create({ data: { name } });
    else if (type === 'color')
      result = await prisma.color.create({ data: { name, hex: hex || '#000000' } });

    return res.status(201).json({ status: 'success', data: result });
  } catch (error: any) {
    if (error.code === 'P2002')
      return res.status(400).json({ status: 'error', message: 'Ya existe' });
    return res.status(500).json({ status: 'error', message: 'Error al crear' });
  }
};

export const deleteCatalogItem = async (req: CustomRequest, res: Response) => {
  try {
    const { type, id } = req.params;
    if (type === 'category') await prisma.category.delete({ where: { id } });
    else if (type === 'brand') await prisma.brand.delete({ where: { id } });
    else if (type === 'size') await prisma.size.delete({ where: { id } });
    else if (type === 'color') await prisma.color.delete({ where: { id } });

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'No se puede eliminar, está en uso' });
  }
};
