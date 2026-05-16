import { Permission, PrismaClient, UserRole } from '@prisma/client';

const BASIC_ROLES = [
  { name: 'Administrador', description: 'Acceso total al sistema' },
  { name: 'Pastor', description: 'Gestion pastoral y supervision' },
  { name: 'Tesorero', description: 'Gestion financiera y reportes' },
] as const;

const BASE_PERMISSIONS = [
  { code: 'users.read', description: 'Ver usuarios' },
  { code: 'users.write', description: 'Crear y editar usuarios' },
  { code: 'roles.read', description: 'Ver roles' },
  { code: 'roles.write', description: 'Crear y editar roles' },
  { code: 'permissions.read', description: 'Ver permisos' },
  { code: 'events.read', description: 'Ver eventos' },
  { code: 'events.write', description: 'Crear y editar eventos' },
  { code: 'finance.read', description: 'Ver finanzas y reportes' },
  { code: 'finance.write', description: 'Registrar movimientos financieros' },
  { code: 'members.read', description: 'Ver miembros' },
  { code: 'members.write', description: 'Crear y editar miembros' },
] as const;

const ROLE_PERMISSIONS: Record<string, string[]> = {
  Administrador: BASE_PERMISSIONS.map((permission) => permission.code),
  Pastor: ['members.read', 'members.write', 'events.read', 'events.write', 'finance.read'],
  Tesorero: ['finance.read', 'finance.write', 'events.read', 'members.read'],
};

export async function seedRolesAndPermissions(
  prisma: PrismaClient,
): Promise<{ rolesByName: Map<string, UserRole>; permissionsByCode: Map<string, Permission> }> {
  const roles = await Promise.all(
    BASIC_ROLES.map(({ name, description }) =>
      prisma.userRole.upsert({
        where: { name },
        update: {
          description,
          active: true,
        },
        create: {
          name,
          description,
          active: true,
        },
      }),
    ),
  );

  const permissions = await Promise.all(
    BASE_PERMISSIONS.map(({ code, description }) =>
      prisma.permission.upsert({
        where: { code },
        update: {
          description,
          active: true,
        },
        create: {
          code,
          description,
          active: true,
        },
      }),
    ),
  );

  const rolesByName = new Map(roles.map((role) => [role.name, role]));
  const permissionsByCode = new Map(permissions.map((permission) => [permission.code, permission]));

  await Promise.all(
    Object.entries(ROLE_PERMISSIONS).map(async ([roleName, permissionCodes]) => {
      const role = rolesByName.get(roleName);
      if (!role) {
        throw new Error(`Role not found during seed: ${roleName}`);
      }

      const rolePermissionRows = permissionCodes.map((permissionCode) => {
        const permission = permissionsByCode.get(permissionCode);
        if (!permission) {
          throw new Error(`Permission not found during seed: ${permissionCode}`);
        }

        return {
          idUserRole: role.id,
          idPermission: permission.id,
        };
      });

      await prisma.rolePermission.createMany({
        data: rolePermissionRows,
        skipDuplicates: true,
      });
    }),
  );

  return { rolesByName, permissionsByCode };
}
