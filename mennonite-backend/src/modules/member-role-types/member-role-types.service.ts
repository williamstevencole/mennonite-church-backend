import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MemberRoleType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MemberRoleBelongsTo } from './member-role-belongs-to.enum';
import { CreateMemberRoleTypeDto } from './dto/create-member-role-type.dto';
import { ListMemberRoleTypesQueryDto } from './dto/list-member-role-types-query.dto';
import { MemberRoleTypeResponseDto } from './dto/member-role-type.response.dto';
import { MemberRoleTypesPageResponseDto } from './dto/member-role-types-page.response.dto';
import { UpdateMemberRoleTypeDto } from './dto/update-member-role-type.dto';

@Injectable()
export class MemberRoleTypesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateMemberRoleTypeDto,
  ): Promise<MemberRoleTypeResponseDto> {
    const existing = await this.prisma.memberRoleType.findFirst({
      where: { name: dto.name },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException(
        `Ya existe un cargo con el nombre "${dto.name}"`,
      );
    }

    const created = await this.prisma.memberRoleType.create({
      data: {
        name: dto.name,
        belongsTo: dto.belongsTo,
      },
    });

    return this.toResponse(created);
  }

  async findAll(
    query: ListMemberRoleTypesQueryDto,
  ): Promise<MemberRoleTypesPageResponseDto> {
    const page = query.page ?? 1;
    const size = query.size ?? 20;
    const where: Prisma.MemberRoleTypeWhereInput = { active: true };
    if (query.belongsTo) {
      where.belongsTo = query.belongsTo;
    }

    const [total, items] = await this.prisma.$transaction([
      this.prisma.memberRoleType.count({ where }),
      this.prisma.memberRoleType.findMany({
        where,
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * size,
        take: size,
      }),
    ]);

    return {
      data: items.map((item) => this.toResponse(item)),
      total,
      page,
      size,
    };
  }

  async findOne(id: number): Promise<MemberRoleTypeResponseDto> {
    const item = await this.prisma.memberRoleType.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException(`Cargo con id ${id} no encontrado`);
    }

    return this.toResponse(item);
  }

  async update(
    id: number,
    dto: UpdateMemberRoleTypeDto,
  ): Promise<MemberRoleTypeResponseDto> {
    await this.assertExists(id);

    if (dto.name) {
      const duplicate = await this.prisma.memberRoleType.findFirst({
        where: { name: dto.name, NOT: { id } },
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
    });

    return this.toResponse(updated);
  }

  async remove(id: number): Promise<MemberRoleTypeResponseDto> {
    await this.assertExists(id);

    const archived = await this.prisma.memberRoleType.update({
      where: { id },
      data: { active: false },
    });

    return this.toResponse(archived);
  }

  private async assertExists(id: number): Promise<void> {
    const existing = await this.prisma.memberRoleType.findUnique({
      where: { id },
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
