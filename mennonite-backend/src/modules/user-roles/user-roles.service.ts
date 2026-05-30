import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  buildPagination,
  toPaginated,
} from '../../common/pagination/paginate.util';
import { CreateUserRoleDto } from './dto/create-user-role.dto';
import { ListUserRolesQueryDto } from './dto/list-user-roles-query.dto';
import { UserRoleResponseDto } from './dto/user-role.response.dto';
import { UserRolesPageResponseDto } from './dto/user-roles-page.response.dto';
import { SetUserRolePermissionsDto } from './dto/set-user-role-permissions.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { IdResponseDto } from '../../common/dto/id-response.dto';

type UserRoleWithPermissions = {
  id: number;
  name: string;
  description: string | null;
  active: boolean;
  rolePermissions: Array<{ permission: { code: string } }>;
};

@Injectable()
export class UserRolesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    idChurch: number,
    dto: CreateUserRoleDto,
  ): Promise<IdResponseDto> {
    await this.assertUniqueName(idChurch, dto.name);
    if (dto.permissionIds?.length) {
      await this.assertPermissionsExist(dto.permissionIds);
    }

    const created = await this.prisma.userRole.create({
      data: {
        idChurch,
        name: dto.name,
        description: dto.description,
        rolePermissions: dto.permissionIds?.length
          ? {
              create: dto.permissionIds.map((idPermission) => ({
                idPermission,
              })),
            }
          : undefined,
      },
      select: { id: true },
    });

    return { id: created.id };
  }

  async findAll(
    idChurch: number,
    query: ListUserRolesQueryDto,
  ): Promise<UserRolesPageResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = { idChurch, active: true };

    const [total, items] = await this.prisma.$transaction([
      this.prisma.userRole.count({ where }),
      this.prisma.userRole.findMany({
        where,
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        ...buildPagination(page, limit),
        ...this.includePermissions(),
      }),
    ]);

    return toPaginated(
      items.map((item) => this.toResponse(item)),
      total,
      page,
      limit,
    );
  }

  async findOne(idChurch: number, id: number): Promise<UserRoleResponseDto> {
    const item = await this.prisma.userRole.findFirst({
      where: { id, idChurch },
      ...this.includePermissions(),
    });
    if (!item) {
      throw new NotFoundException(`Rol ${id} no encontrado`);
    }
    return this.toResponse(item);
  }

  async update(
    idChurch: number,
    id: number,
    dto: UpdateUserRoleDto,
  ): Promise<IdResponseDto> {
    await this.assertExists(idChurch, id);
    if (dto.name) {
      await this.assertUniqueName(idChurch, dto.name, id);
    }
    if (dto.permissionIds) {
      await this.assertPermissionsExist(dto.permissionIds);
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.userRole.update({
        where: { id },
        data: { name: dto.name, description: dto.description },
      });

      if (dto.permissionIds) {
        await tx.rolePermission.deleteMany({ where: { idUserRole: id } });
        if (dto.permissionIds.length) {
          await tx.rolePermission.createMany({
            data: dto.permissionIds.map((idPermission) => ({
              idUserRole: id,
              idPermission,
            })),
          });
        }
      }
    });

    return { id };
  }

  async setPermissions(
    idChurch: number,
    id: number,
    dto: SetUserRolePermissionsDto,
  ): Promise<UserRoleResponseDto> {
    await this.assertExists(idChurch, id);
    if (dto.permissionIds.length) {
      await this.assertPermissionsExist(dto.permissionIds);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({ where: { idUserRole: id } });
      if (dto.permissionIds.length) {
        await tx.rolePermission.createMany({
          data: dto.permissionIds.map((idPermission) => ({
            idUserRole: id,
            idPermission,
          })),
        });
      }
      return tx.userRole.findUniqueOrThrow({
        where: { id },
        ...this.includePermissions(),
      });
    });

    return this.toResponse(updated);
  }

  async remove(idChurch: number, id: number): Promise<void> {
    await this.assertExists(idChurch, id);
    const usersWithRole = await this.prisma.user.count({
      where: { idUserRole: id, active: true },
    });
    if (usersWithRole > 0) {
      throw new ConflictException(
        `No se puede eliminar: ${usersWithRole} usuario(s) tienen este rol`,
      );
    }
    await this.prisma.userRole.update({
      where: { id },
      data: { active: false },
    });
  }

  private includePermissions() {
    return {
      include: {
        rolePermissions: {
          include: { permission: { select: { code: true } } },
        },
      },
    } as const;
  }

  private async assertExists(idChurch: number, id: number): Promise<void> {
    const found = await this.prisma.userRole.findFirst({
      where: { id, idChurch },
      select: { id: true },
    });
    if (!found) {
      throw new NotFoundException(`Rol ${id} no encontrado`);
    }
  }

  private async assertUniqueName(
    idChurch: number,
    name: string,
    excludeId?: number,
  ): Promise<void> {
    const existing = await this.prisma.userRole.findUnique({
      where: { idChurch_name: { idChurch, name } },
      select: { id: true },
    });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException(`Ya existe un rol con el nombre "${name}"`);
    }
  }

  private async assertPermissionsExist(ids: number[]): Promise<void> {
    if (ids.length === 0) return;
    const found = await this.prisma.permission.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });
    if (found.length !== ids.length) {
      const foundIds = new Set(found.map((p) => p.id));
      const missing = ids.filter((id) => !foundIds.has(id));
      throw new BadRequestException(
        `Permisos inexistentes: ${missing.join(', ')}`,
      );
    }
  }

  private toResponse(role: UserRoleWithPermissions): UserRoleResponseDto {
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      active: role.active,
      permissions: role.rolePermissions.map((rp) => rp.permission.code),
    };
  }
}
