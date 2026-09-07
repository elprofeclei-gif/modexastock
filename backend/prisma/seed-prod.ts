import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Verificando datos esenciales en producción...');

  const adminExists = await prisma.user.findUnique({ where: { email: 'admin@modexastock.com' } });
  if (!adminExists) {
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
    console.log('✅ Admin creado');
  } else {
    console.log('ℹ️ Admin ya existe');
  }

  const settingsExist = await prisma.setting.findUnique({ where: { id: 1 } });
  if (!settingsExist) {
    await prisma.setting.create({
      data: { id: 1, companyName: 'Modexastock Store' },
    });
    console.log('✅ Configuración inicial creada');
  } else {
    console.log('ℹ️ Configuración ya existe');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
