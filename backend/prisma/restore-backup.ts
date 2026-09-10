import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import readline from 'readline';

const prisma = new PrismaClient();

async function main() {
  // 1. Obtener la ruta del archivo JSON desde la consola
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('❌ Error: Debes indicar la ruta del archivo JSON.');
    console.log('👉 Uso: npm run restore ./ruta/al/archivo.json');
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    console.error(`❌ Error: No se encontró el archivo en la ruta: ${filePath}`);
    process.exit(1);
  }

  console.log(`📄 Leyendo archivo: ${filePath}`);
  const rawData = fs.readFileSync(filePath, 'utf-8');
  const backup = JSON.parse(rawData).data;

  // 2. Confirmación de seguridad (Para no borrar todo por accidente)
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q: string) => new Promise<string>(res => rl.question(q, ans => { res(ans); }));

  const answer = await ask('⚠️ ADVERTENCIA: Esto BORRARÁ todos los datos actuales de la BD y los reemplazará por el JSON. ¿Estás seguro? (escribe "SI" para continuar): ');
  if (answer !== 'SI') {
    console.log('Operación cancelada. No se modificó nada.');
    process.exit(0);
  }
  rl.close();

  console.log('🧹 Limpiando base de datos actual...');
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.purchaseItem.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.account.deleteMany();
  await prisma.client.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.user.deleteMany();

  console.log('🔄 Restaurando datos desde el JSON...');

  // 3. Restaurar en orden de dependencias (Primero padres, luego hijos)
  await prisma.user.createMany({ data: backup.users });
  await prisma.category.createMany({ data: backup.categories });
  await prisma.brand.createMany({ data: backup.brands });
  await prisma.account.createMany({ data: backup.accounts });
  await prisma.client.createMany({ data: backup.clients });
  await prisma.vendor.createMany({ data: backup.vendors });

  // Los productos traen variantes anidad en el JSON, las recorremos una por una
  for (const p of backup.products) {
    const { variants, ...productData } = p;
    await prisma.product.create({
      data: {
        ...productData,
        variants: { create: variants }
      }
    });
  }

  // Las ventas traen items anidados
  for (const s of backup.sales) {
    const { items, ...saleData } = s;
    await prisma.sale.create({
      data: {
        ...saleData,
        items: { create: items }
      }
    });
  }

  // Las compras traen items anidados
  for (const p of backup.purchases) {
    const { items, ...purchaseData } = p;
    await prisma.purchase.create({
      data: {
        ...purchaseData,
        items: { create: items }
      }
    });
  }

  console.log('✅ ¡Restauración completada con éxito!');
}

main()
  .catch((e) => {
    console.error('❌ Error durante la restauración:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });