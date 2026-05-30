import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MinistryRoleType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  buildPagination,
  toPaginated,
} from '../../common/pagination/paginate.util';
import { IdNameResponseDto } from '../../common/dto/id-name-response.dto';
import { CreateMinistryRoleTypeDto } from './dto/create-ministry-role-type.dto';
import { ListMinistryRoleTypesQueryDto } from './dto/list-ministry-role-types-query.dto';
import { MinistryRoleTypeResponseDto } from './dto/ministry-role-type.response.dto';
import { MinistryRoleTypesPageResponseDto } from './dto/ministry-role-types-page.response.dto';
import { UpdateMinistryRoleTypeDto } from './dto/update-ministry-role-type.dto';

@Injectable()
export class MinistryRoleTypesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    idChurch: number,
    dto: CreateMinistryRoleTypeDto,
  ): Promise<IdNameResponseDto> {
    await this.assertMinistryInChurch(idChurch, dto.idMinistry);

    const duplicate = await this.prisma.ministryRoleType.findFirst({
      where: {
        idMinistry: dto.idMinistry,
        name: { equals: dto.name.trim(), mode: 'insensitive' },
      },
      select: { id: true },
    });

    if (duplicate) {
      throw new ConflictException(
        `Ya existe un cargo con el nombre "${dto.name}" en este ministerio`,
      );
    }

    const created = await this.prisma.ministryRoleType.create({
      data: {
        idMinistry: dto.idMinistry,
        name: dto.name,
      },
      select: { id: true, name: true },
    });

    return { id: created.id, name: created.name };
  }

  async findAll(
    idChurch: number,
    query: ListMinistryRoleTypesQueryDto,
  ): Promise<MinistryRoleTypesPageResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.MinistryRoleTypeWhereInput = {
      ministry: { idChurch },
    };

    if (query.idMinistry !== undefined) {
      where.idMinistry = query.idMinistry;
    }

    if (query.active !== undefined) {
      where.active = query.active;
    } else if (query.includeInactive !== true) {
      where.active = true;
    }

    if (query.q) {
      where.name = { contains: query.q, mode: 'insensitive' };
    }

    const [total, items] = await this.prisma.$transaction([
      this.prisma.ministryRoleType.count({ where }),
      this.prisma.ministryRoleType.findMany({
        where,
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        ...buildPagination(page, limit),
      }),
    ]);

    return toPaginated(
      items.map((item) => this.toResponse(item)),
      total,
      page,
      limit,
    );
  }

  async findOne(
    idChurch: number,
    id: number,
    includeInactive = false,
  ): Promise<MinistryRoleTypeResponseDto> {
    const item = await this.prisma.ministryRoleType.findFirst({
      where: {
        id,
        ministry: { idChurch },
        ...(includeInactive ? {} : { active: true }),
      },
    });

    if (!item) {
      throw new NotFoundException();
    }

    return this.toResponse(item);
  }

  async update(
    idChurch: number,
    id: number,
    dto: UpdateMinistryRoleTypeDto,
  ): Promise<IdNameResponseDto> {
    const existing = await this.prisma.ministryRoleType.findFirst({
      where: { id, ministry: { idChurch } },
      select: { id: true, idMinistry: true },
    });

    if (!existing) {
      throw new NotFoundException();
    }

    if (dto.name !== undefined) {
      const duplicate = await this.prisma.ministryRoleType.findFirst({
        where: {
          idMinistry: existing.idMinistry,
          name: { equals: dto.name.trim(), mode: 'insensitive' },
          NOT: { id },
        },
        select: { id: true },
      });

      if (duplicate) {
        throw new ConflictException(
          `Ya existe un cargo con el nombre "${dto.name}" en este ministerio`,
        );
      }
    }

    const updated = await this.prisma.ministryRoleType.update({
      where: { id },
      data: {
        name: dto.name,
        active: dto.active,
      },
      select: { id: true, name: true },
    });

    return { id: updated.id, name: updated.name };
  }

  async remove(idChurch: number, id: number): Promise<void> {
    const existing = await this.prisma.ministryRoleType.findFirst({
      where: { id, ministry: { idChurch } },
      select: { id: true, active: true },
    });

    if (!existing) {
      throw new NotFoundException();
    }

    if (!existing.active) {
      return;
    }

    await this.prisma.ministryRoleType.update({
      where: { id },
      data: { active: false },
    });
  }

  private async assertMinistryInChurch(
    idChurch: number,
    idMinistry: number,
  ): Promise<void> {
    const ministry = await this.prisma.ministry.findFirst({
      where: { id: idMinistry, idChurch },
      select: { id: true },
    });

    if (!ministry) {
      throw new NotFoundException();
    }
  }

  private toResponse(entity: MinistryRoleType): MinistryRoleTypeResponseDto {
    return {
      id: entity.id,
      idMinistry: entity.idMinistry,
      name: entity.name,
      active: entity.active,
    };
  }
}
