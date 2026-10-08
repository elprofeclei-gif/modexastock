import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Verificando datos esenciales en producción...');

  const settingsExist = await prisma.setting.findUnique({ where: { id: 1 } });
  if (!settingsExist) {
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
    console.log('✅ Configuración inicial creada');
  } else {
    console.log('ℹ️ Configuración ya existe');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt);

  const users: { email: string; name: string; role: Role }[] = [
    { email: 'admin@modexastock.com', name: 'Administrador', role: 'ADMIN' },
    { email: 'gerente@modexastock.com', name: 'Gerente Prueba', role: 'MANAGER' },
    { email: 'cajero@modexastock.com', name: 'Cajero Prueba', role: 'USER' },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { password: hashedPassword, name: u.name, role: u.role, isActive: true },
      create: { ...u, password: hashedPassword, isActive: true },
    });
    console.log(`✅ Usuario ${u.email} asegurado en la nube.`);
  }

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
    skipDuplicates: true,
  });

  await prisma.expenseCategory.createMany({
    data: [
      { name: 'Gastos Operativos' },
      { name: 'Servicios Públicos' },
      { name: 'Renta / Arriendo' },
      { name: 'Nómina / Salarios' },
      { name: 'Mantenimiento' },
    ],
    skipDuplicates: true,
  });

  // ✅ SE OMITEN LOS CATÁLOGOS BASE PARA NO SOBRESCRIBRIR LO SUBIDO POR CSV
  /*
  await prisma.category.createMany(...)
  await prisma.brand.createMany(...)
  await prisma.size.createMany(...)
  await prisma.color.createMany(...)
  */

  console.log('🎉 ¡Todo listo en producción!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
