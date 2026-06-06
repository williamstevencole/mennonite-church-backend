import { ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';

const LEADERSHIP_MINISTRY_ROLE_NAMES = ['Líder', 'Co-líder'];

/**
 * Returns the list of ministry IDs where the user is an active leader (Líder or Co-líder).
 */
export async function getLeadingMinistries(
  prisma: PrismaService,
  user: JwtPayload,
): Promise<number[]> {
  const userRecord = await prisma.user.findUnique({
    where: { id: user.sub },
    select: { idMember: true },
  });
  if (!userRecord?.idMember) return [];

  const memberships = await prisma.ministryMember.findMany({
    where: {
      idMember: userRecord.idMember,
      active: true,
      ministryRoleType: { name: { in: LEADERSHIP_MINISTRY_ROLE_NAMES } },
    },
    select: { idMinistry: true },
  });
  return memberships.map((m) => m.idMinistry);
}

/**
 * Returns the list of ministry IDs the user belongs to (any role, including leadership).
 */
export async function getMemberMinistries(
  prisma: PrismaService,
  user: JwtPayload,
): Promise<number[]> {
  const userRecord = await prisma.user.findUnique({
    where: { id: user.sub },
    select: { idMember: true },
  });
  if (!userRecord?.idMember) return [];

  const memberships = await prisma.ministryMember.findMany({
    where: {
      idMember: userRecord.idMember,
      active: true,
    },
    select: { idMinistry: true },
  });
  return memberships.map((m) => m.idMinistry);
}

/**
 * Throws ForbiddenException if the user is not an active leader of the given ministry.
 */
export async function assertMinistryLeadership(
  prisma: PrismaService,
  user: JwtPayload,
  idMinistry: number,
): Promise<void> {
  const memberships = await getLeadingMinistries(prisma, user);
  if (!memberships.includes(idMinistry)) {
    throw new ForbiddenException(
      'Usuario no es líder activo del ministerio solicitado',
    );
  }
}
