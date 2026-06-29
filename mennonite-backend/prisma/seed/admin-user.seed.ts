import { Member, PrismaClient, User } from '@prisma/client';
import type {
  SupabaseClient,
  User as SupabaseUser,
} from '@supabase/supabase-js';

import {
  createSupabase,
  loadChurch,
  loadMembersByName,
  loadRolesByName,
  runSeed,
} from './_bootstrap';

export const ADMIN_SEED_CREDENTIALS = {
  email: 'admin@mennonite.local',
  password: 'Admin12345!',
} as const;

type SeededUser = {
  memberName: string;
  email: string;
  password: string;
  roleName: 'Pastor' | 'Tesorero' | 'Líder de Ministerio' | 'Miembro';
};

const DEMO_USERS: readonly SeededUser[] = [
  {
    memberName: 'Oscar Martinez',
    email: 'oscar.martinez@imcsp.org',
    password: 'Pastor12345!',
    roleName: 'Pastor',
  },
  {
    memberName: 'Carlos Fernandez',
    email: 'carlos.fernandez@imcsp.org',
    password: 'Tesorero12345!',
    roleName: 'Tesorero',
  },
  {
    memberName: 'Maria Lopez',
    email: 'lider.damas@imcsp.test',
    password: 'Lider12345!',
    roleName: 'Líder de Ministerio',
  },
  {
    memberName: 'Andrea Quin',
    email: 'miembro@imcsp.test',
    password: 'Miembro12345!',
    roleName: 'Miembro',
  },
];

async function ensureSupabaseAuthUser(
  supabase: SupabaseClient,
  email: string,
  password: string,
): Promise<string> {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (!error && data.user) {
    return data.user.id;
  }

  if (error?.message?.includes('already been registered')) {
    const { data: listData } = await supabase.auth.admin.listUsers();
    const existing = (listData.users as SupabaseUser[]).find(
      (u) => u.email === email,
    );
    if (existing) {
      await supabase.auth.admin.deleteUser(existing.id);
    }
    const { data: retryData, error: retryError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
    if (retryError) {
      throw new Error(
        `No se pudo crear usuario Supabase Auth "${email}": ${retryError.message}`,
      );
    }
    return retryData.user.id;
  }

  throw new Error(
    `No se pudo crear usuario Supabase Auth "${email}": ${error?.message}`,
  );
}

const ADMIN_MEMBER_DEFAULTS = {
  name: 'Administrador Sistema',
  documentType: 'National ID',
  documentNumber: 'ADMIN-0000-0000',
  birthDate: new Date('1970-01-01'),
  joinDate: new Date('2020-01-01'),
} as const;

export async function seedAdminUser(
  prisma: PrismaClient,
  idUserRole: number,
  idChurch: number,
  supabase: SupabaseClient,
): Promise<User> {
  const supabaseUid = await ensureSupabaseAuthUser(
    supabase,
    ADMIN_SEED_CREDENTIALS.email,
    ADMIN_SEED_CREDENTIALS.password,
  );

  const adminMember = await prisma.member.upsert({
    where: {
      documentType_documentNumber: {
        documentType: ADMIN_MEMBER_DEFAULTS.documentType,
        documentNumber: ADMIN_MEMBER_DEFAULTS.documentNumber,
      },
    },
    update: {
      idChurch,
      name: ADMIN_MEMBER_DEFAULTS.name,
      active: true,
    },
    create: {
      idChurch,
      name: ADMIN_MEMBER_DEFAULTS.name,
      documentType: ADMIN_MEMBER_DEFAULTS.documentType,
      documentNumber: ADMIN_MEMBER_DEFAULTS.documentNumber,
      birthDate: ADMIN_MEMBER_DEFAULTS.birthDate,
      joinDate: ADMIN_MEMBER_DEFAULTS.joinDate,
    },
  });

  const adminUser = await prisma.user.upsert({
    where: { email: ADMIN_SEED_CREDENTIALS.email },
    update: {
      idUserRole,
      idChurch,
      idMember: adminMember.id,
      active: true,
      supabaseUid,
    },
    create: {
      email: ADMIN_SEED_CREDENTIALS.email,
      active: true,
      idUserRole,
      idChurch,
      idMember: adminMember.id,
      supabaseUid,
    },
  });

  // Vincular al admin con el board activo de la iglesia para que area='admin'.
  const activeBoard = await prisma.board.findFirst({
    where: { idChurch, active: true },
  });
  if (activeBoard) {
    const adminBoardRole = await prisma.boardRoleType.findFirst({
      where: { idBoard: activeBoard.id, name: 'Vocal' },
    });
    if (adminBoardRole) {
      const existingBoardMember = await prisma.boardMember.findFirst({
        where: {
          idMember: adminMember.id,
          idBoard: activeBoard.id,
          idBoardRoleType: adminBoardRole.id,
        },
      });
      if (!existingBoardMember) {
        await prisma.boardMember.create({
          data: {
            idMember: adminMember.id,
            idBoard: activeBoard.id,
            idBoardRoleType: adminBoardRole.id,
            startDate: activeBoard.startDate,
            endDate: null,
            active: true,
          },
        });
      }
    }
  }

  return adminUser;
}

export async function seedMemberUsers(
  prisma: PrismaClient,
  idChurch: number,
  membersByName: Map<string, Member>,
  rolesByName: Map<string, { id: number }>,
  supabase: SupabaseClient,
): Promise<User[]> {
  const created: User[] = [];

  for (const data of DEMO_USERS) {
    const member = membersByName.get(data.memberName);
    if (!member) {
      throw new Error(
        `Seed users: no se encontro el miembro "${data.memberName}".`,
      );
    }
    const role = rolesByName.get(data.roleName);
    if (!role) {
      throw new Error(`Seed users: no se encontro el rol "${data.roleName}".`);
    }

    const supabaseUid = await ensureSupabaseAuthUser(
      supabase,
      data.email,
      data.password,
    );

    const user = await prisma.user.upsert({
      where: { email: data.email },
      update: {
        idUserRole: role.id,
        idChurch,
        idMember: member.id,
        active: true,
        supabaseUid,
      },
      create: {
        email: data.email,
        active: true,
        idUserRole: role.id,
        idChurch,
        idMember: member.id,
        supabaseUid,
      },
    });
    created.push(user);
  }

  return created;
}

export const MEMBER_USER_SEED_CREDENTIALS = DEMO_USERS.map((u) => ({
  email: u.email,
  password: u.password,
}));

if (require.main === module) {
  runSeed('usuarios', async (prisma) => {
    const supabase = createSupabase();
    const church = await loadChurch(prisma);
    const roles = await loadRolesByName(prisma, church.id);
    const adminRole = roles.get('Administrador');
    if (!adminRole) {
      throw new Error(
        'No se encontró el rol "Administrador".\nCorre primero: npm run seed:roles-permissions',
      );
    }
    console.log('  Creando admin en Supabase Auth...');
    const admin = await seedAdminUser(
      prisma,
      adminRole.id,
      church.id,
      supabase,
    );
    const members = await loadMembersByName(prisma, church.id);
    console.log(
      `  Creando ${MEMBER_USER_SEED_CREDENTIALS.length} usuarios miembro en Supabase Auth...`,
    );
    const memberUsers = await seedMemberUsers(
      prisma,
      church.id,
      members,
      roles,
      supabase,
    );
    console.log(`Admin: ${admin.email}`);
    console.log(`Usuarios miembro creados: ${memberUsers.length}`);
    console.log('\nCredenciales:');
    console.log(
      `  Admin: ${ADMIN_SEED_CREDENTIALS.email} / ${ADMIN_SEED_CREDENTIALS.password}`,
    );
    for (const cred of MEMBER_USER_SEED_CREDENTIALS) {
      console.log(`  - ${cred.email} / ${cred.password}`);
    }
  });
}
