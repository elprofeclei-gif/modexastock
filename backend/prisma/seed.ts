import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // 1. BLOQUEO DE SEGURIDAD PARA PRODUCCIÓN
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ ERROR FATAL: No puedes ejecutar el seed en producción. Esto borraría todos los datos reales.');
    process.exit(1);
  }

  console.log('🧹 Limpiando base de datos para carga masiva...');
  // Orden importa por las relaciones foreign keys
  await prisma.transaction.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.saleItem.deleteMany();
  await prisma.purchaseItem.deleteMany();
  await prisma.inventoryMovement.deleteMany(); // ✅ Limpieza de Kardex
  await prisma.auditLog.deleteMany();         // ✅ Limpieza de Bitácora
  await prisma.clientPayment.deleteMany();    // ✅ Limpieza de Abonos
  await prisma.sale.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.cashRegister.deleteMany();
  await prisma.account.deleteMany();
  await prisma.physicalBox.deleteMany();
  await prisma.client.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.category.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.size.deleteMany();
  await prisma.color.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.user.deleteMany();

  console.log('⚙️ Creando configuración inicial...');
  await prisma.setting.create({
    data: {
      id: 1,
      companyName: 'Modexastock Store',
      taxId: 'NIT: 900.000.000-0',
      address: 'Calle 123 #45-67, Centro',
      phone: '+57 300 000 0000',
      currencySymbol: '$',
      ticketFooter: '¡Gracias por su compra! Cambios válidos por 30 días con factura.',
      quoteFooter: 'Cotización válida por 3 días. Precios sujetos a cambios.',
      retailMargin: 50,
      wholesaleMargin: 20,
    },
  });

  console.log('👥 Creando usuarios (Admin y Cajero de prueba)...');
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt);
  
  await prisma.user.createMany({
    data: [
      {
        email: 'admin@modexastock.com',
        password: hashedPassword,
        name: 'Administrador',
        role: 'ADMIN',
        isActive: true,
      },
      {
        email: 'cajero@modexastock.com',
        password: hashedPassword,
        name: 'Cajero Prueba',
        role: 'USER',
        isActive: true,
      }
    ]
  });

  console.log('📦 Creando cajas físicas...');
  await prisma.physicalBox.createMany({
    data: [
      { name: 'Caja Principal', balance: 0 },
      { name: 'Caja #2', balance: 0 },
    ],
    skipDuplicates: true,
  });

  console.log('🏦 Creando cuentas financieras (Saldos en 0)...');
  await prisma.account.createMany({
    data: [
      { name: 'Banco Principal', type: 'BANK', balance: 0 },
      { name: 'Caja Fuerte', type: 'CASH_SAFE', balance: 0 }
    ]
  });

  // ✅ NUEVO: Catálogos base para facilitar el alta de productos
  console.log('🏷️ Creando catálogos base (Categorías, Marcas, Tallas, Colores)...');
  await prisma.category.createMany({
    data: [
      { name: 'Sin Categoría', isActive: true },
      { name: 'Ropa', isActive: true },
      { name: 'Calzado', isActive: true }
    ],
    skipDuplicates: true
  });

  await prisma.brand.createMany({
    data: [
      { name: 'Sin Marca', isActive: true },
      { name: 'Nike', isActive: true },
      { name: 'Adidas', isActive: true }
    ],
    skipDuplicates: true
  });

  await prisma.size.createMany({
    data: [
      { name: 'Única' },
      { name: 'S' },
      { name: 'M' },
      { name: 'L' },
      { name: 'XL' },
      { name: '38' },
      { name: '39' },
      { name: '40' }
    ],
    skipDuplicates: true
  });

  await prisma.color.createMany({
    data: [
      { name: 'Único', hex: '#808080' },
      { name: 'Negro', hex: '#000000' },
      { name: 'Blanco', hex: '#FFFFFF' },
      { name: 'Rojo', hex: '#FF0000' },
      { name: 'Azul', hex: '#0000FF' }
    ],
    skipDuplicates: true
  });

  console.log('✅ ¡Base de datos lista para recibir la carga masiva de Excel!');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });