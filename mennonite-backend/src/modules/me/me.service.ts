import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MyMinistryDto } from './dto/my-ministry.dto';

export type MyMinistriesRoleFilter = 'leader' | 'member';

@Injectable()
export class MeService {
  constructor(private readonly prisma: PrismaService) {}

  async findMyMinistries(
    userId: number,
    roleFilter?: MyMinistriesRoleFilter,
  ): Promise<MyMinistryDto[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { idMember: true, idChurch: true },
    });
    if (!user?.idMember) return [];

    const where: Prisma.MinistryMemberWhereInput = {
      idMember: user.idMember,
      active: true,
      ministry: { active: true, idChurch: user.idChurch },
    };
    if (roleFilter === 'leader') {
      where.ministryRoleType = {
        NOT: { name: { equals: 'Miembro', mode: 'insensitive' } },
      };
    } else if (roleFilter === 'member') {
      where.ministryRoleType = {
        name: { equals: 'Miembro', mode: 'insensitive' },
      };
    }

    const rows = await this.prisma.ministryMember.findMany({
      where,
      include: {
        ministry: true,
        ministryRoleType: { select: { id: true, name: true } },
      },
      orderBy: { startDate: 'desc' },
    });

    return rows.map((r) => ({
      ministry: {
        id: r.ministry.id,
        name: r.ministry.name,
        active: r.ministry.active,
      },
      role: { id: r.ministryRoleType.id, name: r.ministryRoleType.name },
      joinedAt: r.startDate.toISOString(),
    }));
  }
}
