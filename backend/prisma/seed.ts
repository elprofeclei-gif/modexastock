import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // 1. BLOQUEO DE SEGURIDAD PARA PRODUCCIÓN
  if (process.env.NODE_ENV === 'production') {
    console.error(
      '❌ ERROR FATAL: No puedes ejecutar el seed en producción. Esto borraría todos los datos reales.'
    );
    process.exit(1);
  }

  console.log('🧹 Limpiando base de datos para carga masiva...');
  // Orden importa por las relaciones foreign keys
  await prisma.transaction.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.saleItem.deleteMany();
  await prisma.purchaseItem.deleteMany();
  await prisma.inventoryMovement.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.clientPayment.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.cashRegister.deleteMany();
  await prisma.account.deleteMany();
  await prisma.physicalBox.deleteMany();
  await prisma.client.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.expenseCategory.deleteMany();
  await prisma.category.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.size.deleteMany();
  await prisma.color.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.user.deleteMany();

  console.log('⚙️ Creando configuración inicial de la empresa...');
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

  console.log('👥 Creando usuarios (Admin, Gerente y Cajero)...');
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
        email: 'gerente@modexastock.com',
        password: hashedPassword,
        name: 'Gerente Prueba',
        role: 'MANAGER',
        isActive: true,
      },
      {
        email: 'cajero@modexastock.com',
        password: hashedPassword,
        name: 'Cajero Prueba',
        role: 'USER',
        isActive: true,
      },
    ],
  });

  console.log('📦 Creando cajas físicas y cuentas financieras...');
  await prisma.physicalBox.createMany({
    data: [
      { name: 'Caja Principal', balance: 0 },
      { name: 'Caja #2', balance: 0 },
    ],
    skipDuplicates: true,
  });

  await prisma.account.createMany({
    data: [
      { name: 'Banco Principal', type: 'BANK', balance: 0 },
      { name: 'Caja Fuerte', type: 'CASH_SAFE', balance: 0 },
    ],
  });

  console.log('🏷️ Creando catálogos base (Categorías, Marcas, Tallas, Colores)...');
  await prisma.category.createMany({
    data: [
      { name: 'Sin Categoría', isActive: true },
      { name: 'Ropa', isActive: true },
      { name: 'Calzado', isActive: true },
      { name: 'Accesorios', isActive: true },
    ],
    skipDuplicates: true,
  });

  await prisma.brand.createMany({
    data: [
      { name: 'Sin Marca', isActive: true },
      { name: 'Nike', isActive: true },
      { name: 'Adidas', isActive: true },
      { name: 'Puma', isActive: true },
      { name: 'Generica', isActive: true },
    ],
    skipDuplicates: true,
  });

  await prisma.size.createMany({
    data: [
      { name: 'Única' },
      { name: 'XS' },
      { name: 'S' },
      { name: 'M' },
      { name: 'L' },
      { name: 'XL' },
      { name: 'XXL' },
      { name: '38' },
      { name: '39' },
      { name: '40' },
      { name: '41' },
      { name: '42' },
    ],
    skipDuplicates: true,
  });

  await prisma.color.createMany({
    data: [
      { name: 'Único', hex: '#808080' },
      { name: 'Negro', hex: '#000000' },
      { name: 'Blanco', hex: '#FFFFFF' },
      { name: 'Rojo', hex: '#FF0000' },
      { name: 'Azul', hex: '#0000FF' },
      { name: 'Gris', hex: '#808080' },
      { name: 'Beige', hex: '#F5F5DC' },
    ],
    skipDuplicates: true,
  });

  console.log('💰 Creando categorías de gastos para Tesorería...');
  await prisma.expenseCategory.createMany({
    data: [
      { name: 'Gastos Operativos' },
      { name: 'Servicios Públicos' },
      { name: 'Renta / Arriendo' },
      { name: 'Nómina / Salarios' },
      { name: 'Mantenimiento' },
    ],
  });

  console.log('🏭 Creando proveedores de ejemplo...');
  await prisma.vendor.createMany({
    data: [
      {
        name: 'Distribuidora Nacional',
        phone: '+57 311 111 1111',
        email: 'ventas@distnacional.com',
      },
      {
        name: 'Importaciones Ltda.',
        phone: '+57 322 222 2222',
        email: 'compras@importacionesltda.com',
      },
    ],
  });

  console.log('✅ ¡Base de datos inicializada con entorno profesional!');
  console.log('👉 Credenciales de prueba: admin@modexastock.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
