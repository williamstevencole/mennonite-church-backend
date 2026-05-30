import { Permission, PrismaClient, UserRole } from '@prisma/client';

const BASIC_ROLES = [
  { name: 'Administrador', description: 'Acceso total al sistema' },
  { name: 'Pastor', description: 'Gestion pastoral y supervision' },
  { name: 'Tesorero', description: 'Gestion financiera y reportes' },
] as const;

const BASE_PERMISSIONS = [
  // Usuarios del sistema
  { code: 'users.read', description: 'Ver la lista de usuarios del sistema' },
  { code: 'users.create', description: 'Registrar nuevos usuarios' },
  { code: 'users.update', description: 'Editar los datos de los usuarios' },
  { code: 'users.delete', description: 'Desactivar o eliminar usuarios' },

  // Roles y permisos
  { code: 'user-roles.read', description: 'Ver los roles disponibles' },
  { code: 'user-roles.create', description: 'Crear nuevos roles' },
  {
    code: 'user-roles.update',
    description: 'Editar roles y los permisos asignados',
  },
  {
    code: 'user-roles.delete',
    description: 'Eliminar roles que ya no se usan',
  },
  {
    code: 'permissions.read',
    description: 'Ver el listado de permisos disponibles',
  },

  // Miembros de la iglesia
  {
    code: 'members.read',
    description: 'Ver la lista de miembros de la iglesia',
  },
  { code: 'members.create', description: 'Registrar nuevos miembros' },
  {
    code: 'members.update',
    description: 'Editar la informacion de los miembros',
  },
  { code: 'members.delete', description: 'Dar de baja o eliminar miembros' },

  // Ministerios
  { code: 'ministries.read', description: 'Ver los ministerios de la iglesia' },
  { code: 'ministries.create', description: 'Crear nuevos ministerios' },
  {
    code: 'ministries.update',
    description: 'Editar la informacion de un ministerio',
  },
  { code: 'ministries.delete', description: 'Eliminar ministerios' },

  // Concilios / juntas
  {
    code: 'boards.read',
    description: 'Ver los concilios y juntas de la iglesia',
  },
  { code: 'boards.create', description: 'Crear nuevos concilios o juntas' },
  {
    code: 'boards.update',
    description: 'Editar la informacion de un concilio',
  },
  { code: 'boards.delete', description: 'Eliminar concilios' },

  // Asignacion de miembros a ministerios y concilios
  {
    code: 'assignments.read',
    description: 'Ver las asignaciones de miembros a ministerios y concilios',
  },
  {
    code: 'assignments.create',
    description: 'Asignar miembros a ministerios o concilios',
  },
  {
    code: 'assignments.update',
    description: 'Editar una asignacion existente',
  },
  {
    code: 'assignments.delete',
    description: 'Quitar a un miembro de un ministerio o concilio',
  },

  // Eventos
  { code: 'events.read', description: 'Ver el calendario y los eventos' },
  {
    code: 'events.create',
    description: 'Crear nuevos eventos (cultos, viajes, recaudaciones, etc.)',
  },
  { code: 'events.update', description: 'Editar los detalles de un evento' },
  { code: 'events.delete', description: 'Cancelar o eliminar eventos' },

  // Inventario - articulos
  { code: 'inventory.read', description: 'Ver el inventario de la iglesia' },
  {
    code: 'inventory.create',
    description: 'Registrar nuevos articulos en el inventario',
  },
  { code: 'inventory.update', description: 'Editar los datos de un articulo' },
  {
    code: 'inventory.delete',
    description: 'Eliminar articulos del inventario',
  },

  // Inventario - movimientos (entradas/salidas)
  {
    code: 'inventory.movements.read',
    description: 'Ver el historial de entradas y salidas del inventario',
  },
  {
    code: 'inventory.movements.create',
    description: 'Registrar entradas o salidas de inventario',
  },

  // Finanzas - transacciones (ingresos / egresos)
  {
    code: 'finance.read',
    description: 'Ver los movimientos financieros (ingresos y egresos)',
  },
  {
    code: 'finance.create',
    description: 'Registrar nuevos ingresos o egresos',
  },
  {
    code: 'finance.update',
    description: 'Corregir un movimiento financiero registrado',
  },
  { code: 'finance.delete', description: 'Eliminar un movimiento financiero' },

  // Presupuestos
  { code: 'budgets.read', description: 'Ver los presupuestos anuales' },
  { code: 'budgets.create', description: 'Crear un nuevo presupuesto anual' },
  {
    code: 'budgets.update',
    description: 'Editar un presupuesto y sus distribuciones',
  },
  { code: 'budgets.delete', description: 'Eliminar un presupuesto' },

  // Reportes financieros
  { code: 'reports.read', description: 'Ver los reportes financieros' },
  {
    code: 'reports.create',
    description: 'Generar nuevos reportes financieros',
  },

  // Cierres de periodo (mensuales / anuales)
  {
    code: 'period-closures.read',
    description: 'Ver los cierres de periodo realizados',
  },
  {
    code: 'period-closures.create',
    description: 'Realizar el cierre de un periodo (mes o ano)',
  },

  // Catalogos: tipos de evento
  {
    code: 'catalog.event-types.read',
    description: 'Ver los tipos de evento disponibles',
  },
  {
    code: 'catalog.event-types.manage',
    description: 'Crear, editar o eliminar tipos de evento',
  },

  // Catalogos: categorias financieras
  {
    code: 'catalog.transaction-categories.read',
    description: 'Ver las categorias de ingresos y egresos',
  },
  {
    code: 'catalog.transaction-categories.manage',
    description: 'Crear, editar o eliminar categorias financieras',
  },

  // Catalogos: tipos de rol por ministerio
  {
    code: 'catalog.ministry-role-types.read',
    description: 'Ver los tipos de rol disponibles por ministerio',
  },
  {
    code: 'catalog.ministry-role-types.manage',
    description: 'Crear, editar o eliminar tipos de rol por ministerio',
  },

  // Catalogos: tipos de rol por concilio
  {
    code: 'catalog.board-role-types.read',
    description: 'Ver los tipos de rol disponibles por concilio',
  },
  {
    code: 'catalog.board-role-types.manage',
    description: 'Crear, editar o eliminar tipos de rol por concilio',
  },

  // Iglesias (CRUD completo a nivel administrativo)
  { code: 'churches.read', description: 'Ver las iglesias registradas' },
  { code: 'churches.create', description: 'Registrar nuevas iglesias' },
  { code: 'churches.update', description: 'Editar iglesias existentes' },
  { code: 'churches.delete', description: 'Dar de baja iglesias' },

  // Catalogos geograficos
  {
    code: 'catalog.departments.read',
    description: 'Ver los departamentos disponibles',
  },
  {
    code: 'catalog.departments.manage',
    description: 'Crear, editar o eliminar departamentos',
  },
  { code: 'catalog.cities.read', description: 'Ver las ciudades disponibles' },
  {
    code: 'catalog.cities.manage',
    description: 'Crear, editar o eliminar ciudades',
  },

  // Bitacora / auditoria
  {
    code: 'audit.read',
    description: 'Ver la bitacora de actividad del sistema',
  },
] as const;

const ROLE_PERMISSIONS: Record<string, string[]> = {
  Administrador: BASE_PERMISSIONS.map((permission) => permission.code),
  Pastor: [
    'members.read',
    'members.create',
    'members.update',
    'ministries.read',
    'ministries.create',
    'ministries.update',
    'boards.read',
    'boards.create',
    'boards.update',
    'assignments.read',
    'assignments.create',
    'assignments.update',
    'assignments.delete',
    'events.read',
    'events.create',
    'events.update',
    'events.delete',
    'inventory.read',
    'finance.read',
    'budgets.read',
    'reports.read',
    'catalog.event-types.read',
    'catalog.transaction-categories.read',
    'catalog.ministry-role-types.read',
    'catalog.board-role-types.read',
    'churches.read',
    'audit.read',
  ],
  Tesorero: [
    'members.read',
    'events.read',
    'inventory.read',
    'finance.read',
    'finance.create',
    'finance.update',
    'finance.delete',
    'budgets.read',
    'budgets.create',
    'budgets.update',
    'budgets.delete',
    'reports.read',
    'reports.create',
    'period-closures.read',
    'period-closures.create',
    'catalog.transaction-categories.read',
    'catalog.transaction-categories.manage',
  ],
};

export async function seedRolesAndPermissions(
  prisma: PrismaClient,
  idChurch: number,
): Promise<{
  rolesByName: Map<string, UserRole>;
  permissionsByCode: Map<string, Permission>;
}> {
  const roles = await Promise.all(
    BASIC_ROLES.map(({ name, description }) =>
      prisma.userRole.upsert({
        where: { idChurch_name: { idChurch, name } },
        update: {
          description,
          active: true,
        },
        create: {
          idChurch,
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
  const permissionsByCode = new Map(
    permissions.map((permission) => [permission.code, permission]),
  );

  await Promise.all(
    Object.entries(ROLE_PERMISSIONS).map(
      async ([roleName, permissionCodes]) => {
        const role = rolesByName.get(roleName);
        if (!role) {
          throw new Error(`Role not found during seed: ${roleName}`);
        }

        const rolePermissionRows = permissionCodes.map((permissionCode) => {
          const permission = permissionsByCode.get(permissionCode);
          if (!permission) {
            throw new Error(
              `Permission not found during seed: ${permissionCode}`,
            );
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
      },
    ),
  );

  return { rolesByName, permissionsByCode };
}
