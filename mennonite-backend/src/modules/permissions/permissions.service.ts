import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Permission } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { PermissionResponseDto } from './dto/permission.response.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

@Injectable()
export class PermissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePermissionDto): Promise<PermissionResponseDto> {
    const existing = await this.prisma.permission.findUnique({
      where: { code: dto.code },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(
        `Ya existe un permiso con code "${dto.code}"`,
      );
    }
    const created = await this.prisma.permission.create({
      data: { code: dto.code, description: dto.description },
    });
    return this.toResponse(created);
  }

  async findAll(): Promise<PermissionResponseDto[]> {
    const items = await this.prisma.permission.findMany({
      where: { active: true },
      orderBy: { code: 'asc' },
    });
    return items.map((item) => this.toResponse(item));
  }

  async findOne(id: number): Promise<PermissionResponseDto> {
    const item = await this.prisma.permission.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Permiso ${id} no encontrado`);
    }
    return this.toResponse(item);
  }

  async update(
    id: number,
    dto: UpdatePermissionDto,
  ): Promise<PermissionResponseDto> {
    await this.assertExists(id);
    const updated = await this.prisma.permission.update({
      where: { id },
      data: { description: dto.description },
    });
    return this.toResponse(updated);
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
