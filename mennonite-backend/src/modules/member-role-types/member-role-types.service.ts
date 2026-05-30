import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MemberRoleType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  buildPagination,
  toPaginated,
} from '../../common/pagination/paginate.util';
import { MemberRoleBelongsTo } from './member-role-belongs-to.enum';
import { CreateMemberRoleTypeDto } from './dto/create-member-role-type.dto';
import { ListMemberRoleTypesQueryDto } from './dto/list-member-role-types-query.dto';
import { MemberRoleTypeResponseDto } from './dto/member-role-type.response.dto';
import { MemberRoleTypesPageResponseDto } from './dto/member-role-types-page.response.dto';
import { UpdateMemberRoleTypeDto } from './dto/update-member-role-type.dto';
import { IdResponseDto } from '../../common/dto/id-response.dto';

@Injectable()
export class MemberRoleTypesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    idChurch: number,
    dto: CreateMemberRoleTypeDto,
  ): Promise<IdResponseDto> {
    const existing = await this.prisma.memberRoleType.findFirst({
      where: { idChurch, name: dto.name, belongsTo: dto.belongsTo ?? null },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException(
        `Ya existe un cargo con el nombre "${dto.name}"`,
      );
    }

    const created = await this.prisma.memberRoleType.create({
      data: {
        idChurch,
        name: dto.name,
        belongsTo: dto.belongsTo,
      },
      select: { id: true },
    });

    return { id: created.id };
  }

  async findAll(
    idChurch: number,
    query: ListMemberRoleTypesQueryDto,
  ): Promise<MemberRoleTypesPageResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.MemberRoleTypeWhereInput = { idChurch, active: true };
    if (query.belongsTo) {
      where.belongsTo = query.belongsTo;
    }

    const [total, items] = await this.prisma.$transaction([
      this.prisma.memberRoleType.count({ where }),
      this.prisma.memberRoleType.findMany({
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
  ): Promise<MemberRoleTypeResponseDto> {
    const item = await this.prisma.memberRoleType.findFirst({
      where: { id, idChurch },
    });

    if (!item) {
      throw new NotFoundException(`Cargo con id ${id} no encontrado`);
    }

    return this.toResponse(item);
  }

  async update(
    idChurch: number,
    id: number,
    dto: UpdateMemberRoleTypeDto,
  ): Promise<IdResponseDto> {
    await this.assertExists(idChurch, id);

    if (dto.name) {
      const duplicate = await this.prisma.memberRoleType.findFirst({
        where: {
          idChurch,
          name: dto.name,
          belongsTo: dto.belongsTo ?? null,
          NOT: { id },
        },
        select: { id: true },
      });

      if (duplicate) {
        throw new ConflictException(
          `Ya existe un cargo con el nombre "${dto.name}"`,
        );
      }
    }

    const updated = await this.prisma.memberRoleType.update({
      where: { id },
      data: {
        name: dto.name,
        belongsTo: dto.belongsTo,
      },
      select: { id: true },
    });

    return { id: updated.id };
  }

  async remove(
    idChurch: number,
    id: number,
  ): Promise<MemberRoleTypeResponseDto> {
    await this.assertExists(idChurch, id);

    const archived = await this.prisma.memberRoleType.update({
      where: { id },
      data: { active: false },
    });

    return this.toResponse(archived);
  }

  private async assertExists(idChurch: number, id: number): Promise<void> {
    const existing = await this.prisma.memberRoleType.findFirst({
      where: { id, idChurch },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException(`Cargo con id ${id} no encontrado`);
    }
  }

  private toResponse(entity: MemberRoleType): MemberRoleTypeResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      belongsTo: (entity.belongsTo as MemberRoleBelongsTo | null) ?? null,
      active: entity.active,
    };
  }
}
