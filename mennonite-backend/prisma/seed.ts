import { PrismaClient } from '@prisma/client';
import { seedAdminUser, ADMIN_SEED_CREDENTIALS } from './seed/admin-user.seed';
import { seedEventTypes } from './seed/event-types.seed';
import { seedMemberRoleTypes } from './seed/member-role-types.seed';
import { seedRolesAndPermissions } from './seed/roles-permissions.seed';
import { seedTransactionCategories } from './seed/transaction-categories.seed';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  await seedTransactionCategories(prisma);
  await seedMemberRoleTypes(prisma);
  await seedEventTypes(prisma);

  const { rolesByName } = await seedRolesAndPermissions(prisma);
  const adminRole = rolesByName.get('Administrador');
  if (!adminRole) {
    throw new Error('No se encontro el rol Administrador durante el seed.');
  }

  await seedAdminUser(prisma, adminRole.id);

  console.log('Seed completado correctamente.');
  console.log(`Admin user: ${ADMIN_SEED_CREDENTIALS.email}`);
  console.log(`Admin password: ${ADMIN_SEED_CREDENTIALS.password}`);
}

main()
  .catch((error: unknown) => {
    console.error('Error ejecutando seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
