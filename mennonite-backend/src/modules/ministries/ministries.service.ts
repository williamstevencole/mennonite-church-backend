import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { Ministry, Prisma } from '@prisma/client';
import type { JwtPayload } from '../../auth/strategies/jwt.strategy';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMinistryDto } from './dto/create-ministry.dto';
import { ListMinistriesQueryDto } from './dto/list-ministries-query.dto';
import { MinistriesPageResponseDto } from './dto/ministries-page.response.dto';
import { MinistryCreatedResponseDto } from './dto/ministry-created.response.dto';
import { MinistryListItemResponseDto } from './dto/ministry-list-item.response.dto';

@Injectable()
export class MinistriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    query: ListMinistriesQueryDto,
  ): Promise<MinistriesPageResponseDto> {
    const page = query.page ?? 1;
    const size = query.size ?? 20;
    const where: Prisma.MinistryWhereInput = {};

    if (query.active !== undefined) {
      where.active = query.active;
    }

    const [total, ministries] = await this.prisma.$transaction([
      this.prisma.ministry.count({ where }),
      this.prisma.ministry.findMany({
        where,
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * size,
        take: size,
      }),
    ]);

    return {
      data: ministries.map((ministry) => this.toListItem(ministry)),
      total,
      page,
      size,
    };
  }

  async create(
    dto: CreateMinistryDto,
    user: JwtPayload,
  ): Promise<MinistryCreatedResponseDto> {
    const userRecord = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: { idChurch: true },
    });

    if (!userRecord) {
      throw new BadRequestException('Usuario no encontrado');
    }

    const idChurch = userRecord.idChurch;

    if (!idChurch) {
      throw new BadRequestException('El usuario no tiene iglesia asignada');
    }

    if (dto.id_leader_member) {
      const member = await this.prisma.member.findUnique({
        where: { id: dto.id_leader_member },
        select: { id: true, active: true },
      });

      if (!member) {
        throw new BadRequestException('El miembro lider no existe');
      }

      if (!member.active) {
        throw new BadRequestException('El miembro lider esta inactivo');
      }
    }

    const existing = await this.prisma.ministry.findUnique({
      where: {
        idChurch_code: {
          idChurch,
          code: dto.code,
        },
      },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException(
        `Ya existe un ministerio con el codigo "${dto.code}"`,
      );
    }

    const ministry = await this.prisma.ministry.create({
      data: {
        idChurch,
        code: dto.code,
        name: dto.name,
        createdBy: user.sub,
      },
      select: { id: true },
    });

    return { id: ministry.id };
  }

  private toListItem(ministry: Ministry): MinistryListItemResponseDto {
    return {
      id: ministry.id,
      idChurch: ministry.idChurch,
      name: ministry.name,
      code: ministry.code,
      active: ministry.active,
    };
  }
}
