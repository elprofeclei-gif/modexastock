import { PrismaClient, Role } from '@prisma/client'; // ✅ Importar Role
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Verificando usuarios en producción...');
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt);

  // ✅ Le decimos a TypeScript que use el tipo Role de Prisma
  const users: { email: string; name: string; role: Role }[] = [
    { email: 'admin@modexastock.com', name: 'Administrador', role: 'ADMIN' },
    { email: 'gerente@modexastock.com', name: 'Gerente Prueba', role: 'MANAGER' },
    { email: 'cajero@modexastock.com', name: 'Cajero Prueba', role: 'USER' },
  ];

  for (const u of users) {
    // Si el usuario existe, actualiza su contraseña. Si no existe, lo crea.
    await prisma.user.upsert({
      where: { email: u.email },
      update: { password: hashedPassword, name: u.name, role: u.role, isActive: true },
      create: { ...u, password: hashedPassword, isActive: true },
    });
    console.log(`✅ Usuario ${u.email} asegurado en la nube.`);
  }

  console.log('🎉 ¡Listo! Ya puedes iniciar sesión con todos los usuarios en Vercel.');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
