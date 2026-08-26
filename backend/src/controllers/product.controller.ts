import { Response } from 'express';
import { CustomRequest } from '../middlewares/auth.middleware';
import prisma from '../config/prisma';

// Obtener todos los productos (con sus variantes, categoría y marca)
export const getProducts = async (req: CustomRequest, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        brand: true,
        variants: {
          include: {
            size: true,
            color: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      status: 'success',
      data: products,
    });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
  }
};

// Crear un nuevo producto
export const createProduct = async (req: CustomRequest, res: Response) => {
  try {
    const { name, description, sku, price, imageUrl, categoryId, brandId, variants } = req.body;

    // Validación básica
    if (!name || !sku || !price || !categoryId || !brandId) {
      return res.status(400).json({ status: 'error', message: 'Faltan campos obligatorios' });
    }

    const newProduct = await prisma.product.create({
      data: {
        name,
        description,
        sku,
        price: parseFloat(price),
        imageUrl,
        categoryId,
        brandId,
        // Si vienen variantes en la petición, las creamos de una vez
        variants:
          variants && variants.length > 0
            ? {
                create: variants.map(
                  (v: {
                    sizeId: string;
                    colorId: string;
                    stock: number | string;
                    minStock: number | string;
                  }) => ({
                    sizeId: v.sizeId,
                    colorId: v.colorId,
                    stock: Number(v.stock) || 0,
                    minStock: Number(v.minStock) || 1,
                  })
                ),
              }
            : undefined,
      },
      include: {
        category: true, // <-- AÑADIDO
        brand: true, // <-- AÑADIDO
        variants: { include: { size: true, color: true } },
      },
    });

    return res.status(201).json({
      status: 'success',
      data: newProduct,
    });
  } catch (error: any) {
    // Capturar error de unique constraint (SKU duplicado)
    if (error.code === 'P2002') {
      return res
        .status(400)
        .json({ status: 'error', message: 'El SKU ingresado ya existe. Debe ser único.' });
    }
    console.error('Error al crear producto:', error);
    return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
  }
};

// Obtener un producto por ID
export const getProductById = async (req: CustomRequest, res: Response) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true, brand: true, variants: { include: { size: true, color: true } } },
    });

    if (!product) {
      return res.status(404).json({ status: 'error', message: 'Producto no encontrado' });
    }

    return res.status(200).json({ status: 'success', data: product });
  } catch (error) {
    console.error('Error al obtener producto:', error);
    return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
  }
};

// Actualizar un producto
export const updateProduct = async (req: CustomRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, sku, price, imageUrl, categoryId, brandId, isActive } = req.body;

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name,
        description,
        sku,
        price: price ? parseFloat(price) : undefined,
        imageUrl,
        categoryId,
        brandId,
        isActive,
      },
    });

    return res.status(200).json({ status: 'success', data: updatedProduct });
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
  }
};

// Eliminar un producto
export const deleteProduct = async (req: CustomRequest, res: Response) => {
  try {
    const { id } = req.params;

    // onDelete: Cascade en Prisma schema eliminará las variantes automáticamente
    await prisma.product.delete({ where: { id } });

    return res.status(204).send(); // 204 No Content
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
  }
};
