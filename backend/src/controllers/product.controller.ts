import { Response } from 'express';
import { CustomRequest } from '../middlewares/auth.middleware';
import prisma from '../config/prisma';
import bcrypt from 'bcryptjs';

// 1. Obtener productos (CON PAGINACIÓN, BÚSQUEDA Y FILTROS)
export const getProducts = async (req: CustomRequest, res: Response) => {
  try {
    const { search, categoryId, brandId, isActive, page = '1', limit = '10' } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 10;

    // Construir el filtro dinámicamente
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { sku: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    if (categoryId) where.categoryId = categoryId as string;
    if (brandId) where.brandId = brandId as string;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          brand: true,
          variants: { include: { size: true, color: true } },
        },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    return res.status(200).json({
      status: 'success',
      data: products,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    console.error('Error al obtener productos:', error);
    return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
  }
};

// 2. Crear un nuevo producto
export const createProduct = async (req: CustomRequest, res: Response) => {
  try {
    const { name, description, sku, price, imageUrl, categoryId, brandId, variants } = req.body;

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
        variants:
          variants && variants.length > 0
            ? {
                create: variants.map((v: any) => ({
                  sizeId: v.sizeId,
                  colorId: v.colorId,
                  stock: Number(v.stock) || 0,
                  minStock: Number(v.minStock) || 1,
                })),
              }
            : undefined,
      },
      include: {
        category: true,
        brand: true,
        variants: { include: { size: true, color: true } },
      },
    });

    return res.status(201).json({ status: 'success', data: newProduct });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ status: 'error', message: 'El SKU ingresado ya existe.' });
    }
    console.error('Error al crear producto:', error);
    return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
  }
};

// 3. Obtener un producto por ID
export const getProductById = async (req: CustomRequest, res: Response) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true, brand: true, variants: { include: { size: true, color: true } } },
    });

    if (!product)
      return res.status(404).json({ status: 'error', message: 'Producto no encontrado' });

    return res.status(200).json({ status: 'success', data: product });
  } catch (error) {
    console.error('Error al obtener producto:', error);
    return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
  }
};

// 4. Actualizar un producto
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

// 5. Eliminar un producto (SOFT DELETE - Auditoría)
export const deleteProduct = async (req: CustomRequest, res: Response) => {
  try {
    const { id } = req.params;

    // ✅ NO LO BORRAMOS, LO OCULTAMOS PARA NO ROMPER EL HISTORIAL DE VENTAS
    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    return res
      .status(200)
      .json({ status: 'success', message: 'Producto desactivado correctamente.' });
  } catch (error) {
    console.error('Error al desactivar producto:', error);
    return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
  }
};

// 6. AJUSTAR STOCK DE INVENTARIO (Requiere Admin - Kardex)
export const adjustStock = async (req: CustomRequest, res: Response) => {
  try {
    const { id } = req.params; // ID de la variante del producto
    const { newStock, reason, adminEmail, adminPassword } = req.body;
    const userId = req.user?.id!;

    const adminUser = await prisma.user.findFirst({
      where: { email: adminEmail, role: { in: ['ADMIN', 'MANAGER'] }, isActive: true },
    });
    if (!adminUser)
      return res
        .status(403)
        .json({ status: 'error', message: 'Correo de administrador no válido o sin permisos.' });

    const isMatch = await bcrypt.compare(adminPassword, adminUser.password);
    if (!isMatch)
      return res
        .status(403)
        .json({ status: 'error', message: 'Contraseña de autorización incorrecta.' });

    const variant = await prisma.productVariant.findUnique({ where: { id } });
    if (!variant)
      return res.status(404).json({ status: 'error', message: 'Variante no encontrada' });

    const parsedNewStock = parseInt(newStock) || 0;
    const quantityChange = parsedNewStock - variant.stock;

    if (quantityChange === 0)
      return res
        .status(400)
        .json({ status: 'error', message: 'El nuevo stock es igual al actual.' });

    await prisma.$transaction(async (tx) => {
      await tx.productVariant.update({
        where: { id },
        data: { stock: parsedNewStock },
      });

      await tx.inventoryMovement.create({
        data: {
          productVariantId: id,
          userId: adminUser.id,
          type: 'ADJUSTMENT',
          quantityChange: quantityChange,
          reason: reason || 'Ajuste de inventario manual',
        },
      });
    });

    return res
      .status(200)
      .json({ status: 'success', message: 'Stock ajustado y registrado en Kardex.' });
  } catch (error: any) {
    console.error('Error adjusting stock:', error);
    return res
      .status(500)
      .json({ status: 'error', message: error.message || 'Error interno del servidor' });
  }
};

// 7. OBTENER KARDEX (Historial de movimientos de inventario)
export const getProductKardex = async (req: CustomRequest, res: Response) => {
  try {
    const { variantId } = req.params;

    const movements = await prisma.inventoryMovement.findMany({
      where: { productVariantId: variantId },
      include: {
        user: { select: { name: true } }, // Quién lo hizo
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({ status: 'success', data: movements });
  } catch (error) {
    console.error('Error al obtener Kardex:', error);
    return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
  }
};

// Obtener productos con bajo stock para notificaciones
export const getLowStockAlerts = async (req: CustomRequest, res: Response) => {
  try {
    const lowStockItems = await prisma.$queryRaw`
      SELECT p.name, s.name as size, c.name as color, v.stock, v."minStock"
      FROM "ProductVariant" v
      JOIN "Product" p ON v."productId" = p.id
      JOIN "Size" s ON v."sizeId" = s.id
      JOIN "Color" c ON v."colorId" = c.id
      WHERE v.stock <= v."minStock"
      LIMIT 10
    `;
    return res.status(200).json({ status: 'success', data: lowStockItems });
  } catch (error) {
    console.error('Error fetching low stock alerts:', error);
    return res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
  }
};
