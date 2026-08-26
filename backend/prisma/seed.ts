import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('\n🌱 INICIANDO SEED LIMPIO DE MODEXASTOCK\n');

  // 1. LIMPIEZA TOTAL
  console.log('🧹 Limpiando base de datos...');
  await prisma.transaction.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.saleItem.deleteMany();
  await prisma.purchaseItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.cashRegister.deleteMany();
  await prisma.account.deleteMany();
  await prisma.client.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.category.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.size.deleteMany();
  await prisma.color.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.user.deleteMany();

  // 2. CONFIGURACIÓN DE LA EMPRESA
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
    },
  });

  // 3. USUARIOS Y ROLES
  console.log('👥 Creando usuarios...');
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt);

  await prisma.user.create({
    data: {
      email: 'admin@modexastock.com',
      password: hashedPassword,
      name: 'Administrador',
      role: 'ADMIN',
      isActive: true,
    },
  });
  await prisma.user.create({
    data: {
      email: 'gerente@modexastock.com',
      password: hashedPassword,
      name: 'Gerente General',
      role: 'MANAGER',
      isActive: true,
    },
  });
  await prisma.user.create({
    data: {
      email: 'cajero@modexastock.com',
      password: hashedPassword,
      name: 'Cajero Principal',
      role: 'USER',
      isActive: true,
    },
  });

  // 4. CUENTAS FINANCIERAS (EN CERO)
  console.log('🏦 Creando cuentas financieras (Saldos en 0)...');
  await prisma.account.create({ data: { name: 'Banco Principal', type: 'BANK', balance: 0 } });
  await prisma.account.create({ data: { name: 'Caja Fuerte', type: 'CASH_SAFE', balance: 0 } });

  // 5. CATÁLOGOS BÁSICOS
  console.log('🏷️ Creando catálogos básicos...');
  const categorias = ['Camisetas', 'Pantalones', 'Zapatos', 'Accesorios'];
  for (const name of categorias) await prisma.category.create({ data: { name, isActive: true } });

  const marcas = ['Nike', 'Adidas', 'Levis', 'Otras'];
  for (const name of marcas) await prisma.brand.create({ data: { name, isActive: true } });

  const tallas = ['S', 'M', 'L', 'XL', '36', '38', '40'];
  for (const name of tallas) await prisma.size.create({ data: { name } });

  const colores = [
    ['Negro', '#000000'],
    ['Blanco', '#FFFFFF'],
    ['Rojo', '#FF0000'],
    ['Azul', '#0000FF'],
  ];
  for (const [name, hex] of colores) await prisma.color.create({ data: { name, hex } });

  // 6. CLIENTE Y PROVEEDOR GENÉRICO
  console.log('🤝 Creando cliente y proveedor genéricos...');
  await prisma.client.create({
    data: { name: 'Cliente Mostrador', phone: '000-000-0000', balance: 0 },
  });
  await prisma.vendor.create({ data: { name: 'Proveedor Genérico', phone: '000-000-0000' } });

  console.log('\n========================================');
  console.log('🎉 ¡BASE DE DATOS LISTA PARA PRODUCCIÓN!');
  console.log('========================================');
  console.log('👑 Admin:    admin@modexastock.com');
  console.log('👔 Gerente:  gerente@modexastock.com');
  console.log('🛒 Cajero:   cajero@modexastock.com');
  console.log('🔑 Password para todos: password123');
  console.log('========================================');
  console.log('📦 El inventario está vacío. Sube tus productos desde el Centro de Datos (Excel).');
  console.log('💰 Las cuentas de tesorería están en $0. Listas para recibir tus ingresos.\n');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
