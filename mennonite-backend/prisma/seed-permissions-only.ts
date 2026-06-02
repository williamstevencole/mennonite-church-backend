import { PrismaClient } from '@prisma/client';
import { seedRolesAndPermissions } from './seed/roles-permissions.seed';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const church = await prisma.church.findFirst({
    where: { active: true },
    orderBy: { id: 'asc' },
    select: { id: true, name: true },
  });

  if (!church) {
    throw new Error(
      'No hay iglesia activa en la base. Corre el seed completo primero.',
    );
  }

  console.log(
    `Re-seedeando permissions para iglesia ${church.name} (id=${church.id})`,
  );
  const { permissionsByCode } = await seedRolesAndPermissions(
    prisma,
    church.id,
  );

  const newCodes = [
    'period-closures.update',
    'period-closures.delete',
    'financial-reports.read',
    'financial-reports.create',
    'financial-reports.update',
    'financial-reports.delete',
  ];

  console.log('\nNuevos permissions presentes:');
  for (const code of newCodes) {
    const present = permissionsByCode.has(code);
    console.log(`  ${present ? 'OK ' : 'MISS'} ${code}`);
  }
}

main()
  .catch((error: unknown) => {
    console.error('Error seedeando permissions:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
