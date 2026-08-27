import { Response } from 'express';
import { CustomRequest } from '../middlewares/auth.middleware';
import prisma from '../config/prisma';
import * as XLSX from 'xlsx';

// Generar un color hex aleatorio para los colores nuevos del Excel
const generateRandomHex = () => {
  return (
    '#' +
    Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, '0')
  );
};

// Función para limpiar números de Excel (quita puntos de miles, comas, etc.)
const parseNumeric = (val: any): number => {
  if (!val) return 0;
  if (typeof val === 'number') return val;
  const cleaned = val.toString().replace(/\./g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
};

// 1. IMPORTAR PRODUCTOS DESDE EXCEL/CSV
export const importProducts = async (req: CustomRequest, res: Response) => {
  try {
    if (!req.file)
      return res.status(400).json({ status: 'error', message: 'No se subió ningún archivo' });

    let text = req.file.buffer.toString('latin1');
    if (text.includes(';')) {
      text = text.replace(/;/g, ',');
    }

    const workbook = XLSX.read(text, { type: 'string' });
    const sheetName = workbook.SheetNames[0];
    const data: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });

    if (data.length === 0)
      return res.status(400).json({ status: 'error', message: 'El archivo está vacío.' });

    const [dbCategories, dbBrands, dbSizes, dbColors, dbProducts, dbVariants] = await Promise.all([
      prisma.category.findMany(),
      prisma.brand.findMany(),
      prisma.size.findMany(),
      prisma.color.findMany(),
      prisma.product.findMany(),
      prisma.productVariant.findMany(),
    ]);

    const categoriesMap = new Map(dbCategories.map((c) => [c.name.toLowerCase(), c]));
    const brandsMap = new Map(dbBrands.map((b) => [b.name.toLowerCase(), b]));
    const sizesMap = new Map(dbSizes.map((s) => [s.name.toLowerCase(), s]));
    const colorsMap = new Map(dbColors.map((c) => [c.name.toLowerCase(), c]));
    const productsMap = new Map(dbProducts.map((p) => [p.sku, p]));
    const variantsMapDB = new Map(
      dbVariants.map((v) => [`${v.productId}|${v.sizeId}|${v.colorId}`, v])
    );

    const newCats = new Map();
    const newBrands = new Map();
    const newSizes = new Map();
    const newColors = new Map();

    data.forEach((row) => {
      const catName = row.categoria?.toString().trim() || 'Sin Categoría';
      const brandName = row.marca?.toString().trim() || 'Sin Marca';
      const sizeName = row.talla?.toString().trim() || 'Única';
      const colorName = row.color?.toString().trim() || 'Único';

      if (!categoriesMap.has(catName.toLowerCase()))
        newCats.set(catName.toLowerCase(), { name: catName });
      if (!brandsMap.has(brandName.toLowerCase()))
        newBrands.set(brandName.toLowerCase(), { name: brandName });
      if (!sizesMap.has(sizeName.toLowerCase()))
        newSizes.set(sizeName.toLowerCase(), { name: sizeName });
      if (!colorsMap.has(colorName.toLowerCase()))
        newColors.set(colorName.toLowerCase(), { name: colorName, hex: generateRandomHex() });
    });

    if (newCats.size > 0)
      await prisma.category.createMany({
        data: Array.from(newCats.values()) as any,
        skipDuplicates: true,
      });
    if (newBrands.size > 0)
      await prisma.brand.createMany({
        data: Array.from(newBrands.values()) as any,
        skipDuplicates: true,
      });
    if (newSizes.size > 0)
      await prisma.size.createMany({
        data: Array.from(newSizes.values()) as any,
        skipDuplicates: true,
      });
    if (newColors.size > 0)
      await prisma.color.createMany({
        data: Array.from(newColors.values()) as any,
        skipDuplicates: true,
      });

    const [updatedCats, updatedBrands, updatedSizes, updatedColors] = await Promise.all([
      prisma.category.findMany(),
      prisma.brand.findMany(),
      prisma.size.findMany(),
      prisma.color.findMany(),
    ]);

    updatedCats.forEach((c) => categoriesMap.set(c.name.toLowerCase(), c));
    updatedBrands.forEach((b) => brandsMap.set(b.name.toLowerCase(), b));
    updatedSizes.forEach((s) => sizesMap.set(s.name.toLowerCase(), s));
    updatedColors.forEach((c) => colorsMap.set(c.name.toLowerCase(), c));

    const productsToCreate: {
      name: string;
      sku: string;
      price: number;
      categoryId: string;
      brandId: string;
    }[] = [];
    const seenSkus = new Set<string>();

    data.forEach((row, index) => {
      const sku = row.sku?.toString().trim();
      const name = row.nombre?.toString().trim();

      if (!sku || !name) {
        console.warn(`Fila ${index + 2} omitida por falta de SKU o Nombre.`);
        return;
      }

      if (!productsMap.has(sku) && !seenSkus.has(sku)) {
        seenSkus.add(sku);
        const cat = categoriesMap.get(
          (row.categoria?.toString().trim() || 'Sin Categoría').toLowerCase()
        );
        const brand = brandsMap.get((row.marca?.toString().trim() || 'Sin Marca').toLowerCase());

        if (!cat) console.warn(`Categoría no encontrada para SKU ${sku}: '${row.categoria}'`);
        if (!brand) console.warn(`Marca no encontrada para SKU ${sku}: '${row.marca}'`);

        if (cat && brand) {
          productsToCreate.push({
            name,
            sku,
            price: parseNumeric(row.precio),
            categoryId: cat.id,
            brandId: brand.id,
          });
        }
      }
    });

    if (productsToCreate.length > 0) {
      await prisma.product.createMany({ data: productsToCreate, skipDuplicates: true });
    }

    const updatedProducts = await prisma.product.findMany();
    const finalProductsMap = new Map(updatedProducts.map((p) => [p.sku, p]));

    const variantsMap = new Map<
      string,
      { productId: string; sizeId: string; colorId: string; stock: number }
    >();

    data.forEach((row, index) => {
      const sku = row.sku?.toString().trim();
      if (!sku) return;

      const product = finalProductsMap.get(sku);
      const sizeName = (row.talla?.toString().trim() || 'Única').toLowerCase();
      const colorName = (row.color?.toString().trim() || 'Único').toLowerCase();
      const size = sizesMap.get(sizeName);
      const color = colorsMap.get(colorName);
      const stock = parseNumeric(row.stock);

      if (!product || !size || !color) {
        console.warn(`Fila ${index + 2} omitida: variante incompleta.`);
        return;
      }

      const key = `${product.id}|${size.id}|${color.id}`;
      const existing = variantsMap.get(key);

      if (existing) {
        existing.stock += stock;
      } else {
        variantsMap.set(key, {
          productId: product.id,
          sizeId: size.id,
          colorId: color.id,
          stock,
        });
      }
    });

    const variantsToCreate: any[] = [];
    const variantsToUpdate: any[] = [];

    for (const [key, variantData] of variantsMap.entries()) {
      const existingVariant = variantsMapDB.get(key);

      if (existingVariant) {
        variantsToUpdate.push({
          id: existingVariant.id,
          stock: variantData.stock,
        });
      } else {
        variantsToCreate.push({
          ...variantData,
          minStock: 5,
        });
      }
    }

    if (variantsToCreate.length > 0) {
      await prisma.productVariant.createMany({
        data: variantsToCreate,
        skipDuplicates: true,
      });
    }

    if (variantsToUpdate.length > 0) {
      for (let i = 0; i < variantsToUpdate.length; i += 50) {
        const chunk = variantsToUpdate.slice(i, i + 50);
        await prisma.$transaction(
          chunk.map((variant) =>
            prisma.productVariant.update({
              where: { id: variant.id },
              data: { stock: variant.stock },
            })
          )
        );
      }
    }

    return res.status(200).json({
      status: 'success',
      message: `Importación completa. ${data.length} filas procesadas correctamente.`,
    });
  } catch (error: any) {
    console.error('Error general importando:', error);
    return res
      .status(500)
      .json({ status: 'error', message: 'Error interno del servidor al leer el archivo.' });
  }
};

// 2. DESCARGAR BACKUP DE BASE DE DATOS (JSON)
export const downloadBackup = async (req: CustomRequest, res: Response) => {
  try {
    const [users, products, categories, brands, sales, purchases, accounts, clients, vendors] =
      await Promise.all([
        prisma.user.findMany(),
        prisma.product.findMany({ include: { variants: true } }),
        prisma.category.findMany(),
        prisma.brand.findMany(),
        prisma.sale.findMany({ include: { items: true } }),
        prisma.purchase.findMany({ include: { items: true } }),
        prisma.account.findMany(),
        prisma.client.findMany(),
        prisma.vendor.findMany(),
      ]);

    const backupData = {
      timestamp: new Date().toISOString(),
      data: { users, products, categories, brands, sales, purchases, accounts, clients, vendors },
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="modexastock_backup_${Date.now()}.json"`
    );
    return res.status(200).json(backupData);
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Error al generar backup' });
  }
};

// 3. REPORTE GENERAL DE INVENTARIO (CSV)
export const downloadInventoryReport = async (req: CustomRequest, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      include: { category: true, brand: true, variants: { include: { size: true, color: true } } },
    });

    const rows = products.flatMap((p) =>
      p.variants.map((v) => ({
        SKU: p.sku,
        Producto: p.name,
        Categoria: p.category.name,
        Marca: p.brand.name,
        Talla: v.size.name,
        Color: v.color.name,
        Stock: v.stock,
        Precio: p.price,
      }))
    );

    if (rows.length === 0) {
      return res.status(400).json({ status: 'error', message: 'No hay productos para exportar' });
    }

    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(','),
      ...rows.map((row) =>
        headers.map((fieldName) => JSON.stringify(row[fieldName as keyof typeof row])).join(',')
      ),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="reporte_inventario.csv"');
    return res.status(200).send(csv);
  } catch (error) {
    console.error('Error generating inventory report:', error);
    return res.status(500).json({ status: 'error', message: 'Error al generar reporte' });
  }
};

// 4. REPORTE GENERAL DE VENTAS (CSV)
export const downloadSalesReport = async (req: CustomRequest, res: Response) => {
  try {
    const sales = await prisma.sale.findMany({
      include: {
        user: { select: { name: true } },
        items: { select: { quantity: true, subtotal: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (sales.length === 0) {
      return res.status(400).json({ status: 'error', message: 'No hay ventas para exportar' });
    }

    const rows = sales.map((s) => ({
      Fecha: new Date(s.createdAt).toLocaleString('es-ES'),
      Cajero: s.user.name,
      Metodo_Pago: s.paymentMethod,
      Total_Venta: s.totalAmount,
      Cantidad_Items: s.items.reduce((acc, item) => acc + item.quantity, 0),
      Referencia: s.reference || 'N/A',
    }));

    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(','),
      ...rows.map((row) =>
        headers.map((fieldName) => JSON.stringify(row[fieldName as keyof typeof row])).join(',')
      ),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="reporte_ventas_general.csv"');
    return res.status(200).send(csv);
  } catch (error) {
    console.error('Error generating sales report:', error);
    return res.status(500).json({ status: 'error', message: 'Error al generar reporte de ventas' });
  }
};
