import { PrismaClient, User } from '@prisma/client';
import { createHash } from 'crypto';

export const ADMIN_SEED_CREDENTIALS = {
  email: 'admin@mennonite.local',
  password: 'Admin12345!',
} as const;

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

export async function seedAdminUser(prisma: PrismaClient, idUserRole: number): Promise<User> {
  return prisma.user.upsert({
    where: { email: ADMIN_SEED_CREDENTIALS.email },
    update: {
      idUserRole,
      active: true,
      passwordHash: hashPassword(ADMIN_SEED_CREDENTIALS.password),
    },
    create: {
      email: ADMIN_SEED_CREDENTIALS.email,
      passwordHash: hashPassword(ADMIN_SEED_CREDENTIALS.password),
      active: true,
      idUserRole,
    },
  });
}
