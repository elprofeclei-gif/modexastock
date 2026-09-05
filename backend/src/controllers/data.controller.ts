import { Response } from 'express';
import { CustomRequest } from '../middlewares/auth.middleware';
import prisma from '../config/prisma';
import * as XLSX from 'xlsx';
import { logAction } from '../utils/audit'; // ✅ Importado

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
        newCats.set(catName.toLowerCase(), { name: catName, isActive: true });
      if (!brandsMap.has(brandName.toLowerCase()))
        newBrands.set(brandName.toLowerCase(), { name: brandName, isActive: true });
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
      description: string | null;
      cost: number;
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
            description: row.descripcion?.toString().trim() || null,
            cost: parseNumeric(row.costo),
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
      { productId: string; sizeId: string; colorId: string; stock: number; minStock: number }
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
      const minStock = parseNumeric(row.stock_minimo) || 5; // ✅ Lee el mínimo, si no, usa 5

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
          minStock,
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
          minStock: variantData.minStock,
        });
      } else {
        // ✅ Ya no forzamos minStock a 5 aquí, lo toma de variantData
        variantsToCreate.push({
          ...variantData,
        });
      }
    }

    const userId = req.user?.id!;

    if (variantsToCreate.length > 0) {
      for (const v of variantsToCreate) {
        const newVariant = await prisma.productVariant.create({ data: v });

        // ✅ REGISTRO EN KARDEX PARA VARIANTES NUEVAS
        await prisma.inventoryMovement.create({
          data: {
            productVariantId: newVariant.id,
            userId,
            type: 'PURCHASE',
            quantityChange: newVariant.stock,
            reason: 'Stock inicial por importación de Excel',
          },
        });
      }
    }

    if (variantsToUpdate.length > 0) {
      for (let i = 0; i < variantsToUpdate.length; i += 50) {
        const chunk = variantsToUpdate.slice(i, i + 50);

        await prisma.$transaction(async (tx) => {
          for (const variant of chunk) {
            const dbVariant = await tx.productVariant.findUnique({ where: { id: variant.id } });
            if (!dbVariant) continue;

            const difference = variant.stock - dbVariant.stock;

            await tx.productVariant.update({
              where: { id: variant.id },
              data: {
                stock: variant.stock,
                minStock: variant.minStock, // ✅ Actualizamos el mínimo también
              },
            });

            if (difference !== 0) {
              await tx.inventoryMovement.create({
                data: {
                  productVariantId: variant.id,
                  userId,
                  type: 'ADJUSTMENT',
                  quantityChange: difference,
                  reason: 'Actualización de stock por importación de Excel',
                },
              });
            }
          }
        });
      }
    }

    // ✅ Log general en la bitácora del sistema
    await logAction(
      userId,
      'IMPORT_EXCEL',
      'Data',
      undefined,
      `Importación masiva de productos desde Excel. Filas: ${data.length}`
    );

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

    // ✅ Registro en bitácora (Descargar backup es una acción sensible)
    await logAction(
      req.user?.id,
      'DOWNLOAD_BACKUP',
      'Data',
      undefined,
      `El usuario descargó un respaldo completo de la base de datos.`
    );

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

    // ✅ Registro en bitácora
    await logAction(
      req.user?.id,
      'EXPORT_INVENTORY_CSV',
      'Data',
      undefined,
      `El usuario exportó el reporte general de inventario a CSV.`
    );

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="reporte_inventario.csv"');
    return res.status(200).send('\ufeff' + csv);
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

    // ✅ Registro en bitácora
    await logAction(
      req.user?.id,
      'EXPORT_SALES_CSV',
      'Data',
      undefined,
      `El usuario exportó el reporte general de ventas a CSV.`
    );

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="reporte_ventas_general.csv"');
    return res.status(200).send('\ufeff' + csv);
  } catch (error) {
    console.error('Error generating sales report:', error);
    return res.status(500).json({ status: 'error', message: 'Error al generar reporte de ventas' });
  }
};

// 5. REPORTE DE BITÁCORA DEL SISTEMA (CSV)
export const downloadAuditLogReport = async (req: CustomRequest, res: Response) => {
  try {
    const logs = await prisma.auditLog.findMany({
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5000,
    });

    const rows = logs.map((l) => ({
      Fecha: new Date(l.createdAt).toLocaleString('es-ES'),
      Usuario: l.user?.name || 'Sistema',
      Accion: l.action,
      Modulo: l.entity,
      Detalles: l.details || 'N/A',
    }));

    if (rows.length === 0)
      return res.status(400).json({ status: 'error', message: 'No hay registros en la bitácora' });

    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(','),
      ...rows.map((row) =>
        headers.map((fieldName) => JSON.stringify(row[fieldName as keyof typeof row])).join(',')
      ),
    ].join('\n');

    await logAction(
      req.user?.id,
      'EXPORT_AUDIT_LOG_CSV',
      'Data',
      undefined,
      `El usuario exportó el reporte de bitácora.`
    );

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="bitacora_sistema.csv"');
    return res.status(200).send('\ufeff' + csv);
  } catch (error) {
    console.error('Error generating audit log report:', error);
    return res
      .status(500)
      .json({ status: 'error', message: 'Error al generar reporte de bitácora' });
  }
};

// 6. REPORTE DE HISTORIAL DE CAJAS (CSV)
export const downloadCashHistoryReport = async (req: CustomRequest, res: Response) => {
  try {
    const history = await prisma.cashRegister.findMany({
      include: {
        user: { select: { name: true } },
        physicalBox: { select: { name: true } },
        // ✅ AGREGAR ESTA LÍNEA PARA TRAER LAS VENTAS
        sales: {
          where: { paymentMethod: { contains: 'CASH' } },
          select: { receivedAmount: true, change: true, totalAmount: true, paymentMethod: true },
        },
      },
      orderBy: { openedAt: 'desc' },
      take: 1000,
    });

    const rows = history.map((reg) => {
      const cashSales =
        reg.sales
          ?.filter((s: any) => s.paymentMethod.includes('CASH'))
          .reduce((acc: number, s: any) => acc + ((s.receivedAmount || 0) - (s.change || 0)), 0) ||
        0;
      const expected =
        reg.openingAmount + cashSales + (reg.manualInflows || 0) - (reg.manualOutflows || 0);
      const real = (reg.closingAmount || 0) + (reg.depositAmount || 0);
      const diff = reg.status === 'CLOSED' ? real - expected : 0;

      return {
        Cajero: reg.user.name,
        Caja_Fisica: reg.physicalBox?.name || 'N/A',
        Apertura: new Date(reg.openedAt).toLocaleString('es-ES'),
        Cierre: reg.closedAt ? new Date(reg.closedAt).toLocaleString('es-ES') : 'EN TURNO',
        Monto_Inicial: reg.openingAmount,
        Inyecciones: reg.manualInflows || 0,
        Retiros: reg.manualOutflows || 0,
        Esperado: expected,
        Real_Contado: reg.status === 'CLOSED' ? real : 0,
        Diferencia: reg.status === 'CLOSED' ? diff : 0,
        Estado: reg.status,
      };
    });

    if (rows.length === 0)
      return res.status(400).json({ status: 'error', message: 'No hay historial de cajas' });

    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(','),
      ...rows.map((row) =>
        headers.map((fieldName) => JSON.stringify(row[fieldName as keyof typeof row])).join(',')
      ),
    ].join('\n');

    await logAction(
      req.user?.id,
      'EXPORT_CASH_HISTORY_CSV',
      'Data',
      undefined,
      `El usuario exportó el historial de cajas.`
    );

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="historial_cajas.csv"');
    return res.status(200).send('\ufeff' + csv);
  } catch (error) {
    console.error('Error generating cash history report:', error);
    return res
      .status(500)
      .json({ status: 'error', message: 'Error al generar historial de cajas' });
  }
};

// 7. REPORTE DE TESORERÍA (CSV) - Movimientos de cuentas y gastos
export const downloadTreasuryReport = async (req: CustomRequest, res: Response) => {
  try {
    const [transactions, expenses] = await Promise.all([
      prisma.transaction.findMany({
        include: { account: { select: { name: true } } },
        orderBy: { date: 'desc' },
      }),
      prisma.expense.findMany({
        include: {
          account: { select: { name: true } },
          category: { select: { name: true } },
          user: { select: { name: true } },
        },
        orderBy: { date: 'desc' },
      }),
    ]);

    const rows = [
      ...transactions.map((t) => ({
        Fecha: new Date(t.date).toLocaleString('es-ES'),
        Tipo: t.type,
        Modulo: 'Tesorería',
        Cuenta: t.account.name,
        Concepto: t.concept,
        Monto: t.amount,
      })),
      ...expenses.map((e) => ({
        Fecha: new Date(e.date).toLocaleString('es-ES'),
        Tipo: 'EXPENSE',
        Modulo: 'Gastos',
        Cuenta: e.account?.name || 'Efectivo',
        Concepto: e.concept,
        Monto: e.amount,
      })),
    ];

    if (rows.length === 0)
      return res.status(400).json({ status: 'error', message: 'No hay movimientos en tesorería' });

    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(','),
      ...rows.map((row) =>
        headers.map((f) => JSON.stringify(row[f as keyof typeof row])).join(',')
      ),
    ].join('\n');

    await logAction(
      req.user?.id,
      'EXPORT_TREASURY_CSV',
      'Data',
      undefined,
      `El usuario exportó el reporte de tesorería.`
    );

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="reporte_tesoreria.csv"');
    return res.status(200).send('\ufeff' + csv);
  } catch (error) {
    return res
      .status(500)
      .json({ status: 'error', message: 'Error al generar reporte de tesorería' });
  }
};

// 8. REPORTE KARDEX GENERAL (CSV) - Historial completo de inventario
export const downloadKardexReport = async (req: CustomRequest, res: Response) => {
  try {
    const movements = await prisma.inventoryMovement.findMany({
      include: {
        productVariant: {
          include: {
            product: { select: { name: true, sku: true } },
            size: { select: { name: true } },
            color: { select: { name: true } },
          },
        },
        user: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 5000,
    });

    const rows = movements.map((m) => ({
      Fecha: new Date(m.createdAt).toLocaleString('es-ES'),
      Producto: m.productVariant.product.name,
      SKU: m.productVariant.product.sku,
      Talla_Color: `${m.productVariant.size.name}/${m.productVariant.color.name}`,
      Tipo_Movimiento: m.type,
      Cantidad: m.quantityChange,
      Razon: m.reason || 'N/A',
      Usuario: m.user.name,
    }));

    if (rows.length === 0)
      return res.status(400).json({ status: 'error', message: 'No hay movimientos de inventario' });

    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(','),
      ...rows.map((row) =>
        headers.map((f) => JSON.stringify(row[f as keyof typeof row])).join(',')
      ),
    ].join('\n');

    await logAction(
      req.user?.id,
      'EXPORT_KARDEX_CSV',
      'Data',
      undefined,
      `El usuario exportó el Kardex general.`
    );

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="kardex_inventario.csv"');
    return res.status(200).send('\ufeff' + csv);
  } catch (error) {
    return res.status(500).json({ status: 'error', message: 'Error al generar Kardex' });
  }
};

// 9. ESTADO DE RESULTADOS / UTILIDADES (CSV)
export const downloadProfitLossReport = async (req: CustomRequest, res: Response) => {
  try {
    const sales = await prisma.sale.findMany({
      where: { isVoided: false },
      include: {
        items: {
          include: { productVariant: { include: { product: { select: { cost: true } } } } },
        },
      },
    });
    const expenses = await prisma.expense.aggregate({ _sum: { amount: true } });

    let totalRevenue = 0;
    let totalCOGS = 0;

    sales.forEach((sale) => {
      totalRevenue += sale.totalAmount;
      sale.items.forEach((item) => {
        totalCOGS += item.quantity * (item.productVariant?.product?.cost || 0);
      });
    });

    const grossProfit = totalRevenue - totalCOGS;
    const totalExpenses = Math.abs(expenses._sum.amount || 0);
    const netProfit = grossProfit - totalExpenses;

    // Construimos un CSV formateado como un Estado de Resultados
    const csv = [
      'Concepto,Monto',
      `Ingresos Totales (Ventas),${totalRevenue}`,
      `(-) Costo de Mercancía Vendida (COGS),${totalCOGS}`,
      `Utilidad Bruta,${grossProfit}`,
      `(-) Gastos Operativos,${totalExpenses}`,
      `Utilidad Neta,${netProfit}`,
    ].join('\n');

    await logAction(
      req.user?.id,
      'EXPORT_PNL_CSV',
      'Data',
      undefined,
      `El usuario exportó el Estado de Resultados.`
    );

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="estado_resultados.csv"');
    return res.status(200).send('\ufeff' + csv);
  } catch (error) {
    return res
      .status(500)
      .json({ status: 'error', message: 'Error al generar Estado de Resultados' });
  }
};

// 10. REPORTE DE CARTERA DE CLIENTES (CSV)
export const downloadClientsDebtReport = async (req: CustomRequest, res: Response) => {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { balance: 'desc' },
    });

    const rows = clients.map((c) => ({
      Nombre: c.name,
      Documento: c.document || 'N/A',
      Telefono: c.phone || 'N/A',
      Deuda_Actual: c.balance,
      Estado: c.balance > 0 ? 'Deudor' : 'Al día',
    }));

    if (rows.length === 0)
      return res.status(400).json({ status: 'error', message: 'No hay clientes registrados' });

    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(','),
      ...rows.map((row) =>
        headers.map((f) => JSON.stringify(row[f as keyof typeof row])).join(',')
      ),
    ].join('\n');

    await logAction(
      req.user?.id,
      'EXPORT_CLIENTS_DEBT_CSV',
      'Data',
      undefined,
      `El usuario exportó el reporte de cartera de clientes.`
    );

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="cartera_clientes.csv"');
    return res.status(200).send('\ufeff' + csv);
  } catch (error) {
    return res
      .status(500)
      .json({ status: 'error', message: 'Error al generar cartera de clientes' });
  }
};

// 11. REPORTE DE DESCUADRES DE CAJEROS (CSV)
export const downloadCashiersBalanceReport = async (req: CustomRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      // ✅ Traemos a TODOS los roles (Admin, Manager, User) que tengan un balance diferente de 0
      where: {
        balance: { not: 0 },
      },
      orderBy: { balance: 'asc' },
    });

    const rows = users.map((u) => ({
      Nombre: u.name,
      Rol: u.role, // ✅ Agregamos el rol para que el auditor sepa quién fue
      Email: u.email,
      Balance_Sistema: u.balance,
      Estado: u.balance < 0 ? 'Debe dinero (Faltante)' : 'Sobrante a favor',
    }));

    if (rows.length === 0)
      return res
        .status(400)
        .json({ status: 'error', message: 'No hay descuadres registrados (todos cuadran)' });

    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(','),
      ...rows.map((row) =>
        headers.map((f) => JSON.stringify(row[f as keyof typeof row])).join(',')
      ),
    ].join('\n');

    await logAction(
      req.user?.id,
      'EXPORT_CASHIERS_BALANCE_CSV',
      'Data',
      undefined,
      `El usuario exportó el reporte de descuadres de cajeros.`
    );

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="descuadres_cajeros.csv"');
    return res.status(200).send('\ufeff' + csv);
  } catch (error) {
    return res
      .status(500)
      .json({ status: 'error', message: 'Error al generar reporte de cajeros' });
  }
};

// 12. REPORTE DE PRODUCTOS AGOTADOS / BAJO STOCK (CSV)
export const downloadLowStockReport = async (req: CustomRequest, res: Response) => {
  try {
    const lowStockItems = await prisma.productVariant.findMany({
      where: {
        stock: { lte: prisma.productVariant.fields.minStock },
      },
      include: {
        product: { select: { name: true, sku: true } },
        size: { select: { name: true } },
        color: { select: { name: true } },
      },
      orderBy: { stock: 'asc' },
    });

    const rows = lowStockItems.map((v) => ({
      SKU: v.product.sku,
      Producto: v.product.name,
      Talla: v.size.name,
      Color: v.color.name,
      Stock_Actual: v.stock,
      Stock_Minimo: v.minStock,
      Estado: v.stock === 0 ? 'AGOTADO' : 'BAJO STOCK',
    }));

    if (rows.length === 0)
      return res
        .status(400)
        .json({
          status: 'error',
          message: 'No hay productos con bajo stock. ¡Todo está perfecto!',
        });

    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(','),
      ...rows.map((row) =>
        headers.map((f) => JSON.stringify(row[f as keyof typeof row])).join(',')
      ),
    ].join('\n');

    await logAction(
      req.user?.id,
      'EXPORT_LOW_STOCK_CSV',
      'Data',
      undefined,
      `El usuario exportó el reporte de productos agotados/bajo stock.`
    );

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="productos_agotados.csv"');
    return res.status(200).send('\ufeff' + csv);
  } catch (error) {
    return res
      .status(500)
      .json({ status: 'error', message: 'Error al generar reporte de bajo stock' });
  }
};

// 13. RANKING DE VENTAS Y RENTABILIDAD POR PRODUCTO (CSV)
export const downloadSalesRankingReport = async (req: CustomRequest, res: Response) => {
  try {
    // Usamos SQL directo para agrupar por producto y calcular ingresos, costos y ganancias
    const ranking = await prisma.$queryRaw`
      SELECT 
        p.name AS Producto, 
        p.sku AS SKU,
        SUM(si.quantity) AS Unidades_Vendidas,
        SUM(si.subtotal) AS Ingresos_Totales,
        SUM(si.quantity * p.cost) AS Costo_Total,
        (SUM(si.subtotal) - SUM(si.quantity * p.cost)) AS Ganancia_Bruta
      FROM "SaleItem" si
      JOIN "Sale" s ON si."saleId" = s.id
      JOIN "ProductVariant" pv ON si."productVariantId" = pv.id
      JOIN "Product" p ON pv."productId" = p.id
      WHERE s."isVoided" = false
      GROUP BY p.id, p.name, p.sku
      ORDER BY Ingresos_Totales DESC;
    `;

    const rows = (ranking as any[]).map((r) => ({
      Producto: r.Producto,
      SKU: r.SKU,
      Unidades_Vendidas: r.Unidades_Vendidas,
      Ingresos_Totales: r.Ingresos_Totales,
      Costo_Total: r.Costo_Total,
      Ganancia_Bruta: r.Ganancia_Bruta,
      Margen_Porcentaje:
        r.Ingresos_Totales > 0
          ? ((r.Ganancia_Bruta / r.Ingresos_Totales) * 100).toFixed(2) + '%'
          : '0%',
    }));

    if (rows.length === 0)
      return res
        .status(400)
        .json({ status: 'error', message: 'No hay ventas registradas para analizar' });

    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(','),
      ...rows.map((row) =>
        headers.map((f) => JSON.stringify(row[f as keyof typeof row])).join(',')
      ),
    ].join('\n');

    await logAction(
      req.user?.id,
      'EXPORT_SALES_RANKING_CSV',
      'Data',
      undefined,
      `El usuario exportó el ranking de ventas y rentabilidad.`
    );

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="ranking_ventas_rentabilidad.csv"');
    return res.status(200).send('\ufeff' + csv);
  } catch (error) {
    console.error('Error generating sales ranking report:', error);
    return res
      .status(500)
      .json({ status: 'error', message: 'Error al generar el ranking de ventas' });
  }
};
