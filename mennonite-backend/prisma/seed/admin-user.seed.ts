import { Member, PrismaClient, User } from '@prisma/client';
import { hashPassword } from '../../src/common/utils/password.utils';

export const ADMIN_SEED_CREDENTIALS = {
  email: 'admin@mennonite.local',
  password: 'Admin12345!',
} as const;

type SeededUser = {
  memberName: string;
  email: string;
  password: string;
  roleName: 'Pastor' | 'Tesorero';
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
];

export async function seedAdminUser(
  prisma: PrismaClient,
  idUserRole: number,
  idChurch?: number,
): Promise<User> {
  return await prisma.user.upsert({
    where: { email: ADMIN_SEED_CREDENTIALS.email },
    update: {
      idUserRole,
      idChurch,
      active: true,
      passwordHash: hashPassword(ADMIN_SEED_CREDENTIALS.password),
    },
    create: {
      email: ADMIN_SEED_CREDENTIALS.email,
      passwordHash: hashPassword(ADMIN_SEED_CREDENTIALS.password),
      active: true,
      idUserRole,
      idChurch,
    },
  });
}

export async function seedMemberUsers(
  prisma: PrismaClient,
  idChurch: number,
  membersByName: Map<string, Member>,
  rolesByName: Map<string, { id: number }>,
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

    const user = await prisma.user.upsert({
      where: { email: data.email },
      update: {
        idUserRole: role.id,
        idChurch,
        idMember: member.id,
        active: true,
        passwordHash: hashPassword(data.password),
      },
      create: {
        email: data.email,
        passwordHash: hashPassword(data.password),
        active: true,
        idUserRole: role.id,
        idChurch,
        idMember: member.id,
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
