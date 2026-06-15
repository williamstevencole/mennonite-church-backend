import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Permission, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  buildPagination,
  toPaginated,
} from '../../common/pagination/paginate.util';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { ListPermissionsQueryDto } from './dto/list-permissions-query.dto';
import { PermissionResponseDto } from './dto/permission.response.dto';
import { PermissionsPageResponseDto } from './dto/permissions-page.response.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { IdResponseDto } from '../../common/dto/id-response.dto';

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePermissionDto): Promise<IdResponseDto> {
    const existing = await this.prisma.permission.findUnique({
      where: { code: dto.code },
      select: { id: true, active: true },
    });
    if (existing?.active) {
      throw new ConflictException(
        `Ya existe un permiso con code "${dto.code}"`,
      );
    }
    if (existing) {
      const reactivated = await this.prisma.permission.update({
        where: { id: existing.id },
        data: { description: dto.description, active: true },
        select: { id: true },
      });
      return { id: reactivated.id };
    }
    const created = await this.prisma.permission.create({
      data: { code: dto.code, description: dto.description },
      select: { id: true },
    });
    return { id: created.id };
  }

  async findAll(
    query: ListPermissionsQueryDto,
  ): Promise<PermissionsPageResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.PermissionWhereInput = {};
    if (query.includeInactive !== true) {
      where.active = true;
    }

    const [total, items] = await this.prisma.$transaction([
      this.prisma.permission.count({ where }),
      this.prisma.permission.findMany({
        where,
        orderBy: [{ code: 'asc' }, { id: 'asc' }],
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
    id: number,
    includeInactive = false,
  ): Promise<PermissionResponseDto> {
    const item = await this.prisma.permission.findFirst({
      where: {
        id,
        ...(includeInactive ? {} : { active: true }),
      },
    });
    if (!item) {
      throw new NotFoundException(`Permiso ${id} no encontrado`);
    }
    return this.toResponse(item);
  }

  async update(id: number, dto: UpdatePermissionDto): Promise<IdResponseDto> {
    await this.assertExists(id);
    const updated = await this.prisma.permission.update({
      where: { id },
      data: { description: dto.description },
      select: { id: true },
    });
    return { id: updated.id };
  }

  async remove(id: number): Promise<void> {
    await this.assertExists(id);
    const inUse = await this.prisma.rolePermission.count({
      where: { idPermission: id },
    });
    if (inUse > 0) {
      throw new ConflictException(
        `No se puede eliminar: ${inUse} rol(es) tienen este permiso asignado`,
      );
    }
    await this.prisma.permission.update({
      where: { id },
      data: { active: false },
    });
  }

  private async assertExists(id: number): Promise<void> {
    const existing = await this.prisma.permission.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException(`Permiso ${id} no encontrado`);
    }
  }

  private toResponse(entity: Permission): PermissionResponseDto {
    return {
      id: entity.id,
      code: entity.code,
      description: entity.description,
      active: entity.active,
    };
  }
}
