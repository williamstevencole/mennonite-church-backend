import { createPrisma } from './_bootstrap';

async function main(): Promise<void> {
  const prisma = createPrisma();
  try {
    console.warn(
      '⚠️  Reseteando TODAS las tablas del schema "public" (TRUNCATE CASCADE)...',
    );

    const rows = await prisma.$queryRaw<{ tablename: string }[]>`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
    `;

    if (rows.length === 0) {
      console.log('No hay tablas para limpiar.');
      return;
    }

    const tableList = rows.map((r) => `"public"."${r.tablename}"`).join(', ');

    await prisma.$executeRawUnsafe(
      `TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE`,
    );

    console.log(`Reset completado. Tablas truncadas: ${rows.length}`);
    console.log('Corre `npm run db:seed` para re-seedear.');
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch((err: unknown) => {
    console.error('Error reseteando BD:', err);
    process.exit(1);
  });
}
