import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import { ListPastorsQueryDto } from './dto/list-pastors-query.dto';

@Injectable()
export class PastorsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(user: JwtPayload, query: ListPastorsQueryDto) {
    const members = await this.prisma.boardMember.findMany({
      where: {
        // sin fecha de conclusión = sigue en funciones
        endDate: null,

        // concilio activo (board)
        board: {
          idChurch: user.idChurch,
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
}
