import { PrismaClient } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import {
  seedAdminUser,
  seedMemberUsers,
  ADMIN_SEED_CREDENTIALS,
  MEMBER_USER_SEED_CREDENTIALS,
} from './seed/admin-user.seed';
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
import { seedMembers } from './seed/members.seed';
import { seedMemberRoleTypes } from './seed/member-role-types.seed';
import { seedMinistries } from './seed/ministries.seed';
import { seedMinistryMembers } from './seed/ministry-members.seed';
import { seedPeriodClosures } from './seed/period-closures.seed';
import { seedRolesAndPermissions } from './seed/roles-permissions.seed';
import { seedTransactionCategories } from './seed/transaction-categories.seed';

const prisma = new PrismaClient();

function createSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      'SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridos para el seed.\n' +
        'Agrega SUPABASE_SERVICE_ROLE_KEY en tu .env (Supabase Dashboard > Settings > API > service_role).',
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function main(): Promise<void> {
  const supabase = createSupabaseAdmin();

  // 1. Geografia
  const departmentsByName = await seedDepartments(prisma);
  const citiesByName = await seedCities(prisma, departmentsByName);

  // 2. Iglesia (single-tenant)
  const church = await seedChurch(prisma, citiesByName);

  // 3. Catalogos base (per-church)
  await seedTransactionCategories(prisma, church.id);
  await seedMemberRoleTypes(prisma, church.id);
  await seedEventTypes(prisma, church.id);

  // 4. Roles + permisos (roles per-church, permissions global)
  const { rolesByName } = await seedRolesAndPermissions(prisma, church.id);
  const adminRole = rolesByName.get('Administrador');
  if (!adminRole) {
    throw new Error('No se encontro el rol Administrador durante el seed.');
  }

  // 5. Miembros, ministerios y concilio
  const membersByName = await seedMembers(prisma, church.id);
  const ministriesByCode = await seedMinistries(prisma, church.id);
  const board = await seedBoards(prisma, church.id);

  // 6. Usuarios (admin + usuarios ligados a miembros) — con Supabase Auth
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
  await seedEvents(prisma, church.id, ministriesByCode);

  // 8. Presupuesto anual + categorias
  const budget = await seedBudgets(prisma, church.id);

  // 9. Asignaciones de miembros (concilio + ministerios)
  const boardMembersCount = await seedBoardMembers(
    prisma,
    board,
    membersByName,
  );
  const ministryMembersCount = await seedMinistryMembers(
    prisma,
    ministriesByCode,
    membersByName,
  );

  // 10. Detalles y participacion en eventos
  const eventDetails = await seedEventDetails(prisma, church.id, membersByName);

  // 11. Distribucion de presupuesto por ministerio
  const budgetDistributionsCount = await seedBudgetDistributions(
    prisma,
    budget,
    ministriesByCode,
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
  console.log(`Ministerios: ${ministriesByCode.size}`);
  console.log(`Concilio activo: ${board.name}`);
  console.log(`Presupuesto: ${budget.description} (id=${budget.id})`);
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
