import {
  Board,
  Budget,
  Church,
  City,
  Department,
  Member,
  Ministry,
  PrismaClient,
  User,
  UserRole,
} from '@prisma/client';
import { createClient } from '@supabase/supabase-js';

export function createPrisma(): PrismaClient {
  return new PrismaClient();
}

export function runSeed(
  name: string,
  work: (prisma: PrismaClient) => Promise<void>,
): void {
  const prisma = createPrisma();
  const startedAt = Date.now();
  console.log(`▶ Iniciando seed de ${name}...`);
  work(prisma)
    .then(() => {
      const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
      console.log(`✓ ${name} completado en ${elapsed}s`);
    })
    .catch((err: unknown) => {
      console.error(`✗ Error en seed de ${name}:`, err);
      process.exitCode = 1;
    })
    .finally(() => {
      void prisma.$disconnect();
    });
}

export function createSupabase() {
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

function missing(entity: string, prereqScript: string): Error {
  return new Error(
    `No se encontró ${entity} en la BD.\nCorre primero: npm run ${prereqScript}`,
  );
}

export async function loadDepartmentsByName(
  prisma: PrismaClient,
): Promise<Map<string, Department>> {
  const departments = await prisma.department.findMany({
    where: { active: true },
  });
  if (departments.length === 0) {
    throw missing('departamentos', 'seed:departments');
  }
  return new Map(departments.map((d) => [d.name, d]));
}

export async function loadCitiesByName(
  prisma: PrismaClient,
): Promise<Map<string, City>> {
  const cities = await prisma.city.findMany({ where: { active: true } });
  if (cities.length === 0) {
    throw missing('ciudades', 'seed:cities');
  }
  return new Map(cities.map((c) => [c.name, c]));
}

export async function loadChurch(prisma: PrismaClient): Promise<Church> {
  const church = await prisma.church.findFirst({
    where: { active: true },
    orderBy: { id: 'asc' },
  });
  if (!church) {
    throw missing('iglesia activa', 'seed:church');
  }
  return church;
}

export async function loadMembersByName(
  prisma: PrismaClient,
  idChurch: number,
): Promise<Map<string, Member>> {
  const members = await prisma.member.findMany({
    where: { idChurch, active: true },
  });
  if (members.length === 0) {
    throw missing('miembros', 'seed:members');
  }
  return new Map(members.map((m) => [m.name, m]));
}

export async function loadMinistriesByName(
  prisma: PrismaClient,
  idChurch: number,
): Promise<Map<string, Ministry>> {
  const ministries = await prisma.ministry.findMany({
    where: { idChurch, active: true },
  });
  if (ministries.length === 0) {
    throw missing('ministerios', 'seed:ministries');
  }
  return new Map(ministries.map((m) => [m.name, m]));
}

export async function loadActiveBoard(
  prisma: PrismaClient,
  idChurch: number,
): Promise<Board> {
  const board = await prisma.board.findFirst({
    where: { idChurch, active: true },
    orderBy: { id: 'desc' },
  });
  if (!board) {
    throw missing('concilio activo', 'seed:boards');
  }
  return board;
}

export async function loadRolesByName(
  prisma: PrismaClient,
  idChurch: number,
): Promise<Map<string, UserRole>> {
  const roles = await prisma.userRole.findMany({
    where: { idChurch, active: true },
  });
  if (roles.length === 0) {
    throw missing('roles de usuario', 'seed:roles-permissions');
  }
  return new Map(roles.map((r) => [r.name, r]));
}

export async function loadAdminUser(
  prisma: PrismaClient,
  idChurch: number,
): Promise<User> {
  const adminRole = await prisma.userRole.findFirst({
    where: { idChurch, name: 'Administrador', active: true },
  });
  if (!adminRole) {
    throw missing('rol Administrador', 'seed:roles-permissions');
  }
  const user = await prisma.user.findFirst({
    where: { idChurch, idUserRole: adminRole.id, active: true },
    orderBy: { id: 'asc' },
  });
  if (!user) {
    throw missing('usuario administrador', 'seed:users');
  }
  return user;
}

export async function loadCurrentBudget(
  prisma: PrismaClient,
  idChurch: number,
): Promise<Budget> {
  const currentYear = new Date().getFullYear();
  const periodStart = new Date(`${currentYear}-01-01`);
  const budget = await prisma.budget.findFirst({
    where: { idChurch, periodStart, active: true },
  });
  if (!budget) {
    throw missing(`presupuesto del año ${currentYear}`, 'seed:budgets');
  }
  return budget;
}
