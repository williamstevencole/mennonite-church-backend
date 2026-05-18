import { PrismaClient } from '@prisma/client';
import { seedAdminUser, ADMIN_SEED_CREDENTIALS } from './seed/admin-user.seed';
import { seedBoards } from './seed/boards.seed';
import { seedBudgets } from './seed/budgets.seed';
import { seedChurch } from './seed/church.seed';
import { seedCities } from './seed/cities.seed';
import { seedDepartments } from './seed/departments.seed';
import { seedEventTypes } from './seed/event-types.seed';
import { seedEvents } from './seed/events.seed';
import { seedMembers } from './seed/members.seed';
import { seedMemberRoleTypes } from './seed/member-role-types.seed';
import { seedMinistries } from './seed/ministries.seed';
import { seedRolesAndPermissions } from './seed/roles-permissions.seed';
import { seedTransactionCategories } from './seed/transaction-categories.seed';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  // 1. Geografia
  const departmentsByName = await seedDepartments(prisma);
  const citiesByName = await seedCities(prisma, departmentsByName);

  // 2. Iglesia (single-tenant)
  const church = await seedChurch(prisma, citiesByName);

  // 3. Catalogos base
  await seedTransactionCategories(prisma);
  await seedMemberRoleTypes(prisma);
  await seedEventTypes(prisma);

  // 4. Seguridad: roles + permisos + admin
  const { rolesByName } = await seedRolesAndPermissions(prisma);
  const adminRole = rolesByName.get('Administrador');
  if (!adminRole) {
    throw new Error('No se encontro el rol Administrador durante el seed.');
  }
  await seedAdminUser(prisma, adminRole.id, church.id);

  // 5. Miembros, ministerios y concilio
  const membersByName = await seedMembers(prisma, church.id);
  const ministriesByCode = await seedMinistries(prisma, church.id);
  const board = await seedBoards(prisma, church.id);

  // 6. Eventos
  await seedEvents(prisma, church.id, ministriesByCode);

  // 7. Presupuesto anual + categorias
  const budget = await seedBudgets(prisma, church.id);

  console.log('Seed completado correctamente.');
  console.log(`Iglesia: ${church.name} (id=${church.id})`);
  console.log(`Miembros: ${membersByName.size}`);
  console.log(`Ministerios: ${ministriesByCode.size}`);
  console.log(`Concilio activo: ${board.name}`);
  console.log(`Presupuesto: ${budget.description} (id=${budget.id})`);
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
