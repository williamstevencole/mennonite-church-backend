import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import { ListPastorsQueryDto } from './dto/list-pastors-query.dto';

@Injectable()
export class PastorsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(user: JwtPayload, query: ListPastorsQueryDto) {
    const churchId = await this.resolveChurchId(user);

    const members = await this.prisma.boardMember.findMany({
      where: {
        active: true,

        // concilio activo (board)
        board: {
          idChurch: churchId,
          active: true,
        },

        // filtro de roles
        boardRoleType: query.role
          ? {
              name: query.role,
            }
          : {
              name: {
                in: ['Pastor', 'Co-pastor'],
              },
            },
      },

      include: {
        member: {
          select: {
            id: true,
            name: true,
          },
        },
        boardRoleType: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return members.map((bm) => ({
      member: {
        id: bm.member.id,
        name: bm.member.name,
      },
      boardRoleType: {
        id: bm.boardRoleType.id,
        name: bm.boardRoleType.name,
      },
      startDate: bm.startDate,
      endDate: bm.endDate,
    }));
  }

  private async resolveChurchId(user: JwtPayload): Promise<number> {
    const userRecord = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: { idChurch: true },
    });

    if (!userRecord?.idChurch) {
      throw new Error('Usuario no encontrado o sin iglesia');
    }

    return userRecord.idChurch;
  }
}
