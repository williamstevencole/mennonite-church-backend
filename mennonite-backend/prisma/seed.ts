import {
  seedAdminUser,
  seedMemberUsers,
  ADMIN_SEED_CREDENTIALS,
  MEMBER_USER_SEED_CREDENTIALS,
} from './seed/admin-user.seed';
import { createPrisma, createSupabase } from './seed/_bootstrap';
import { seedBoardMembers } from './seed/board-members.seed';
import { seedBoards } from './seed/boards.seed';
import { seedBudgetDistributions } from './seed/budget-distributions.seed';
import { seedBudgets } from './seed/budgets.seed';
import { seedChurch } from './seed/church.seed';
import { seedCities } from './seed/cities.seed';
import { seedDepartments } from './seed/departments.seed';
import { seedEventDetails } from './seed/event-details.seed';
import { seedEventTypes } from './seed/event-types.seed';
import { seedEvents } from './seed/events.seed';
import { seedFinancialReports } from './seed/financial-reports.seed';
import { seedFinancialTransactions } from './seed/financial-transactions.seed';
import { seedInventory } from './seed/inventory.seed';
import { seedBoardRoleTypes } from './seed/board-role-types.seed';
import { seedMembers } from './seed/members.seed';
import { seedMinistries } from './seed/ministries.seed';
import { seedMinistryMembers } from './seed/ministry-members.seed';
import { seedMinistryRoleTypes } from './seed/ministry-role-types.seed';
import { seedPeriodClosures } from './seed/period-closures.seed';
import { seedRolesAndPermissions } from './seed/roles-permissions.seed';
import { seedTransactionCategories } from './seed/transaction-categories.seed';

const prisma = createPrisma();

async function main(): Promise<void> {
  const supabase = createSupabase();

  // 1. Geografia
  const departmentsByName = await seedDepartments(prisma);
  const citiesByName = await seedCities(prisma, departmentsByName);

  // 2. Iglesia (single-tenant)
  const church = await seedChurch(prisma, citiesByName);

  // 3. Catalogos base
  await seedTransactionCategories(prisma, church.id);
  await seedEventTypes(prisma, church.id);

  // 4. Roles + permisos
  const { rolesByName } = await seedRolesAndPermissions(prisma, church.id);
  const adminRole = rolesByName.get('Administrador');
  if (!adminRole) {
    throw new Error('No se encontro el rol Administrador durante el seed.');
  }

  // 5. Miembros, ministerios y concilio
  const membersByName = await seedMembers(prisma, church.id);
  const ministriesByName = await seedMinistries(prisma, church.id);
  await seedMinistryRoleTypes(prisma, ministriesByName);
  const board = await seedBoards(prisma, church.id);
  await seedBoardRoleTypes(prisma, board);

  // 6. Usuarios (admin + usuarios ligados a miembros)
  const adminUser = await seedAdminUser(
    prisma,
    adminRole.id,
    church.id,
    supabase,
  );
  await seedMemberUsers(
    prisma,
    church.id,
    membersByName,
    rolesByName,
    supabase,
  );

  // 7. Eventos
  await seedEvents(prisma, church.id, ministriesByName);

  // 8. Presupuesto anual + categorias (3 años: actual, anterior, antepasado)
  const {
    current: budget,
    all: allBudgets,
    byYear: budgetsByYear,
  } = await seedBudgets(prisma, church.id);

  // 9. Asignaciones de miembros (concilio + ministerios)
  const boardMembersCount = await seedBoardMembers(
    prisma,
    board,
    membersByName,
  );
  const ministryMembersCount = await seedMinistryMembers(
    prisma,
    ministriesByName,
    membersByName,
  );

  // 10. Detalles y participacion en eventos
  const eventDetails = await seedEventDetails(prisma, church.id, membersByName);

  // 11. Distribucion de presupuesto por ministerio
  const budgetDistributionsCount = await seedBudgetDistributions(
    prisma,
    budget,
    ministriesByName,
  );

  // 12. Finanzas: transacciones, reporte anual y cierre de periodo anterior
  const financialTransactionsCount = await seedFinancialTransactions(
    prisma,
    church.id,
    adminUser.id,
  );
  const financialReportsCount = await seedFinancialReports(
    prisma,
    church.id,
    adminUser.id,
  );
  const periodClosuresCount = await seedPeriodClosures(
    prisma,
    church.id,
    adminUser.id,
  );

  // 13. Inventario (articulos + movimientos)
  const inventory = await seedInventory(prisma, church.id, adminUser.id);

  console.log('Seed completado correctamente.');
  console.log(`Iglesia: ${church.name} (id=${church.id})`);
  console.log(`Miembros: ${membersByName.size}`);
  console.log(`Ministerios: ${ministriesByName.size}`);
  console.log(`Concilio activo: ${board.name}`);
  console.log(
    `Presupuestos: ${allBudgets.length} (años ${[...budgetsByYear.keys()].sort().join(', ')})`,
  );
  console.log(`Miembros del concilio: ${boardMembersCount}`);
  console.log(`Miembros en ministerios: ${ministryMembersCount}`);
  console.log(
    `Eventos: responsables=${eventDetails.responsibles}, asistencias=${eventDetails.attendances}, viajes=${eventDetails.trips}, recaudaciones=${eventDetails.fundraisings}`,
  );
  console.log(`Distribuciones de presupuesto: ${budgetDistributionsCount}`);
  console.log(`Transacciones financieras: ${financialTransactionsCount}`);
  console.log(`Reportes financieros: ${financialReportsCount}`);
  console.log(`Cierres de periodo: ${periodClosuresCount}`);
  console.log(
    `Inventario: articulos=${inventory.articles}, movimientos=${inventory.movements}`,
  );
  console.log(`\nUsuarios creados en Supabase Auth:`);
  console.log(
    `  Admin: ${ADMIN_SEED_CREDENTIALS.email} / ${ADMIN_SEED_CREDENTIALS.password}`,
  );
  for (const cred of MEMBER_USER_SEED_CREDENTIALS) {
    console.log(`  - ${cred.email} / ${cred.password}`);
  }
}

main()
  .catch((error: unknown) => {
    console.error('Error ejecutando seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
