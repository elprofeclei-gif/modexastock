import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Limpiando base de datos para carga masiva...');
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

  console.log('👥 Creando usuario Admin...');
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

  console.log('📦 Creando cajas físicas...');
  await prisma.physicalBox.createMany({
    data: [
      { name: 'Caja Principal', balance: 0 },
      { name: 'Caja #2', balance: 0 },
    ],
    skipDuplicates: true,
  });

  console.log('🏦 Creando cuentas financieras (Saldos en 0)...');
  await prisma.account.create({ data: { name: 'Banco Principal', type: 'BANK', balance: 0 } });
  await prisma.account.create({ data: { name: 'Caja Fuerte', type: 'CASH_SAFE', balance: 0 } });

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
