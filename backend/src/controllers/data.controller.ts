import { Response } from 'express';
import { CustomRequest } from '../middlewares/auth.middleware';
import prisma from '../config/prisma';
import * as XLSX from 'xlsx';

// 1. IMPORTAR PRODUCTOS DESDE EXCEL/CSV (Ultra Optimizado y Blindado)
export const importProducts = async (req: CustomRequest, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ status: 'error', message: 'No se subió ningún archivo' });

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const data: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (data.length === 0) return res.status(400).json({ status: 'error', message: 'El archivo está vacío.' });

    // 1. Cargar toda la BD actual en memoria
    const [dbCategories, dbBrands, dbSizes, dbColors, dbProducts, dbVariants] = await Promise.all([
      prisma.category.findMany(),
      prisma.brand.findMany(),
      prisma.size.findMany(),
      prisma.color.findMany(),
      prisma.product.findMany(),
      prisma.productVariant.findMany()
    ]);

    const categoriesMap = new Map(dbCategories.map(c => [c.name.toLowerCase(), c]));
    const brandsMap = new Map(dbBrands.map(b => [b.name.toLowerCase(), b]));
    const sizesMap = new Map(dbSizes.map(s => [s.name.toLowerCase(), s]));
    const colorsMap = new Map(dbColors.map(c => [c.name.toLowerCase(), c]));
    const productsMap = new Map(dbProducts.map(p => [p.sku, p]));
    const variantsMap = new Map(dbVariants.map(v => [`${v.productId}|${v.sizeId}|${v.colorId}`, v]));

    // 2. Recopilar catálogos faltantes del Excel
    const newCats = new Map();
    const newBrands = new Map();
    const newSizes = new Map();
    const newColors = new Map();

    data.forEach(row => {
      const catName = row.categoria?.toString() || 'Sin Categoría';
      const brandName = row.marca?.toString() || 'Sin Marca';
      const sizeName = row.talla?.toString() || 'Única';
      const colorName = row.color?.toString() || 'Único';

      if (!categoriesMap.has(catName.toLowerCase())) newCats.set(catName.toLowerCase(), { name: catName });
      if (!brandsMap.has(brandName.toLowerCase())) newBrands.set(brandName.toLowerCase(), { name: brandName });
      if (!sizesMap.has(sizeName.toLowerCase())) newSizes.set(sizeName.toLowerCase(), { name: sizeName });
      if (!colorsMap.has(colorName.toLowerCase())) newColors.set(colorName.toLowerCase(), { name: colorName, hex: '#808080' });
    });

    // 3. Insertar catálogos masivamente (createMany)
    if (newCats.size > 0) await prisma.category.createMany({ data: Array.from(newCats.values()) as any, skipDuplicates: true });
    if (newBrands.size > 0) await prisma.brand.createMany({ data: Array.from(newBrands.values()) as any, skipDuplicates: true });
    if (newSizes.size > 0) await prisma.size.createMany({ data: Array.from(newSizes.values()) as any, skipDuplicates: true });
    if (newColors.size > 0) await prisma.color.createMany({ data: Array.from(newColors.values()) as any, skipDuplicates: true });

    // 4. Volver a cargar catálogos para tener los IDs nuevos
    const [updatedCats, updatedBrands, updatedSizes, updatedColors] = await Promise.all([
      prisma.category.findMany(),
      prisma.brand.findMany(),
      prisma.size.findMany(),
      prisma.color.findMany()
    ]);

    updatedCats.forEach(c => categoriesMap.set(c.name.toLowerCase(), c));
    updatedBrands.forEach(b => brandsMap.set(b.name.toLowerCase(), b));
    updatedSizes.forEach(s => sizesMap.set(s.name.toLowerCase(), s));
    updatedColors.forEach(c => colorsMap.set(c.name.toLowerCase(), c));

    // 5. Recopilar productos faltantes (Blindado contra filas vacías)
    const productsToCreate: { name: string; sku: string; price: number; categoryId: string; brandId: string }[] = [];
    data.forEach((row, index) => {
      const sku = row.sku?.toString();
      const name = row.nombre?.toString();
      
      if (!sku || !name) {
        console.warn(`Fila ${index + 2} omitida por falta de SKU o Nombre.`);
        return; // Salta esta fila
      }

      if (!productsMap.has(sku)) {
        const cat = categoriesMap.get((row.categoria?.toString() || 'Sin Categoría').toLowerCase());
        const brand = brandsMap.get((row.marca?.toString() || 'Sin Marca').toLowerCase());
        if (cat && brand) {
          productsToCreate.push({
            name,
            sku,
            price: parseFloat(row.precio) || 0,
            categoryId: cat.id,
            brandId: brand.id
          });
        }
      }
    });

    // 6. Insertar productos masivamente (createMany)
    if (productsToCreate.length > 0) {
      await prisma.product.createMany({ data: productsToCreate, skipDuplicates: true });
    }

    // 7. Volver a cargar productos para tener los IDs
    const updatedProducts = await prisma.product.findMany();
    const finalProductsMap = new Map(updatedProducts.map(p => [p.sku, p]));

    // 8. Recopilar variantes faltantes y existentes (Blindado contra filas vacías)
    const variantsToCreate: { productId: string; sizeId: string; colorId: string; stock: number; minStock: number }[] = [];
    const variantsToUpdate: { id: string; stock: number }[] = [];

    data.forEach((row, index) => {
      const sku = row.sku?.toString();
      const product = sku ? finalProductsMap.get(sku) : undefined;
      const size = sizesMap.get((row.talla?.toString() || 'Única').toLowerCase());
      const color = colorsMap.get((row.color?.toString() || 'Único').toLowerCase());
      const stock = parseInt(row.stock) || 0;

      if (product && size && color) {
        const variantKey = `${product.id}|${size.id}|${color.id}`;
        if (variantsMap.has(variantKey)) {
          const existingVar = variantsMap.get(variantKey);
          if (existingVar) variantsToUpdate.push({ id: existingVar.id, stock });
        } else {
          variantsToCreate.push({
            productId: product.id,
            sizeId: size.id,
            colorId: color.id,
            stock,
            minStock: 5
          });
        }
      } else {
        console.warn(`Fila ${index + 2} omitida para variantes (faltan datos o producto no creado).`);
      }
    });

    // 9. Insertar variantes masivamente (createMany)
    if (variantsToCreate.length > 0) {
      await prisma.productVariant.createMany({ data: variantsToCreate, skipDuplicates: true });
    }

    // 10. Actualizar variantes existentes (En lotes de 50 para no saturar)
    if (variantsToUpdate.length > 0) {
      for (let i = 0; i < variantsToUpdate.length; i += 50) {
        const chunk = variantsToUpdate.slice(i, i + 50);
        await prisma.$transaction(
          chunk.map(v => prisma.productVariant.update({
            where: { id: v.id },
            data: { stock: v.stock }
          }))
        );
      }
    }

    return res.status(200).json({
      status: 'success',
      message: `Importación completa. ${data.length} filas procesadas correctamente.`
    });
  } catch (error: any) {
    console.error('Error general importando:', error);
    return res.status(500).json({ status: 'error', message: 'Error interno del servidor al leer el archivo.' });
  }
};

// 2. DESCARGAR BACKUP DE BASE DE DATOS (JSON)
export const downloadBackup = async (req: CustomRequest, res: Response) => {
  try {
    const [users, products, categories, brands, sales, purchases, accounts, clients, vendors] = await Promise.all([
      prisma.user.findMany(),
      prisma.product.findMany({ include: { variants: true } }),
      prisma.category.findMany(),
      prisma.brand.findMany(),
      prisma.sale.findMany({ include: { items: true } }),
      prisma.purchase.findMany({ include: { items: true } }),
      prisma.account.findMany(),
      prisma.client.findMany(),
      prisma.vendor.findMany()
    ]);

    const backupData = {
      timestamp: new Date().toISOString(),
      data: { users, products, categories, brands, sales, purchases, accounts, clients, vendors }
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="modexastock_backup_${Date.now()}.json"`);
    return res.status(200).json(backupData);
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Error al generar backup' });
  }
};

// 3. REPORTE GENERAL DE INVENTARIO (CSV)
export const downloadInventoryReport = async (req: CustomRequest, res: Response) => {
  try {
    const products = await prisma.product.findMany({
      include: { category: true, brand: true, variants: { include: { size: true, color: true } } }
    });

    const rows = products.flatMap(p => 
      p.variants.map(v => ({
        SKU: p.sku,
        Producto: p.name,
        Categoria: p.category.name,
        Marca: p.brand.name,
        Talla: v.size.name,
        Color: v.color.name,
        Stock: v.stock,
        Precio: p.price
      }))
    );

    if (rows.length === 0) {
      return res.status(400).json({ status: 'error', message: 'No hay productos para exportar' });
    }

    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(','),
      ...rows.map(row => headers.map(fieldName => JSON.stringify(row[fieldName as keyof typeof row])).join(','))
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
        items: { select: { quantity: true, subtotal: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (sales.length === 0) {
      return res.status(400).json({ status: 'error', message: 'No hay ventas para exportar' });
    }

    const rows = sales.map(s => ({
      Fecha: new Date(s.createdAt).toLocaleString('es-ES'),
      Cajero: s.user.name,
      Metodo_Pago: s.paymentMethod,
      Total_Venta: s.totalAmount,
      Cantidad_Items: s.items.reduce((acc, item) => acc + item.quantity, 0),
      Referencia: s.reference || 'N/A'
    }));

    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(','),
      ...rows.map(row => headers.map(fieldName => JSON.stringify(row[fieldName as keyof typeof row])).join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="reporte_ventas_general.csv"');
    return res.status(200).send(csv);
  } catch (error) {
    console.error('Error generating sales report:', error);
    return res.status(500).json({ status: 'error', message: 'Error al generar reporte de ventas' });
  }
};