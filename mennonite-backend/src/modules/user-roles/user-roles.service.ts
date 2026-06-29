import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { isSystemProtectedRole } from '../../auth/system-roles.constant';
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
import { IdNameResponseDto } from '../../common/dto/id-name-response.dto';
import {
  DEFAULT_ROLE_DEFINITIONS,
  DEFAULT_ROLE_PERMISSIONS,
} from './role-defaults.constant';

type PrismaTx = Prisma.TransactionClient | PrismaService;

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
  ): Promise<IdNameResponseDto> {
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
      select: { id: true, name: true },
    });

    return { id: created.id, name: created.name };
  }

  async findAll(
    idChurch: number,
    query: ListUserRolesQueryDto,
  ): Promise<UserRolesPageResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.UserRoleWhereInput = { idChurch };
    if (query.includeInactive !== true) {
      where.active = true;
    }

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

  async findOne(
    idChurch: number,
    id: number,
    includeInactive = false,
  ): Promise<UserRoleResponseDto> {
    const item = await this.prisma.userRole.findFirst({
      where: {
        id,
        idChurch,
        ...(includeInactive ? {} : { active: true }),
      },
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
  ): Promise<IdNameResponseDto> {
    const current = await this.assertExists(idChurch, id);
    if (dto.name && dto.name !== current.name) {
      if (isSystemProtectedRole(current.name)) {
        throw new ForbiddenException(
          `No se puede renombrar el rol del sistema "${current.name}"`,
        );
      }
      await this.assertUniqueName(idChurch, dto.name, id);
    }
    if (dto.permissionIds) {
      await this.assertPermissionsExist(dto.permissionIds);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.userRole.update({
        where: { id },
        data: { name: dto.name, description: dto.description },
        select: { id: true, name: true },
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
      return result;
    });

    return { id: updated.id, name: updated.name };
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
    const current = await this.assertExists(idChurch, id);
    if (isSystemProtectedRole(current.name)) {
      throw new ForbiddenException(
        `No se puede eliminar el rol del sistema "${current.name}"`,
      );
    }
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

  private async assertExists(
    idChurch: number,
    id: number,
  ): Promise<{ id: number; name: string }> {
    const found = await this.prisma.userRole.findFirst({
      where: { id, idChurch },
      select: { id: true, name: true },
    });
    if (!found) {
      throw new NotFoundException(`Rol ${id} no encontrado`);
    }
    return found;
  }

  private async assertUniqueName(
    idChurch: number,
    name: string,
    excludeId?: number,
  ): Promise<void> {
    const existing = await this.prisma.userRole.findFirst({
      where: {
        idChurch,
        name: { equals: name.trim(), mode: 'insensitive' },
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (existing) {
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

  async provisionDefaultsForChurch(
    idChurch: number,
    client?: PrismaTx,
  ): Promise<void> {
    const tx = client ?? this.prisma;
    const allCodes = Array.from(
      new Set(Object.values(DEFAULT_ROLE_PERMISSIONS).flat()),
    );
    const permissions = await tx.permission.findMany({
      where: { code: { in: allCodes }, active: true },
      select: { id: true, code: true },
    });
    const permissionByCode = new Map(permissions.map((p) => [p.code, p.id]));

    const missing = allCodes.filter((c) => !permissionByCode.has(c));
    if (missing.length) {
      throw new Error(
        `Catálogo de permisos incompleto al provisionar iglesia ${idChurch}. ` +
          `Falta ejecutar el seed inicial. Permisos faltantes: ${missing.join(', ')}`,
      );
    }

    for (const def of DEFAULT_ROLE_DEFINITIONS) {
      const existing = await tx.userRole.findFirst({
        where: { idChurch, name: def.name },
        select: { id: true },
      });
      const role = existing
        ? await tx.userRole.update({
            where: { id: existing.id },
            data: { description: def.description, active: true },
            select: { id: true },
          })
        : await tx.userRole.create({
            data: {
              idChurch,
              name: def.name,
              description: def.description,
              active: true,
            },
            select: { id: true },
          });

      const codes = DEFAULT_ROLE_PERMISSIONS[def.name] ?? [];
      if (codes.length === 0) continue;

      await tx.rolePermission.createMany({
        data: codes.map((code) => ({
          idUserRole: role.id,
          idPermission: permissionByCode.get(code)!,
        })),
        skipDuplicates: true,
      });
    }
  }

  private toResponse(role: UserRoleWithPermissions): UserRoleResponseDto {
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      active: role.active,
      isSystem: isSystemProtectedRole(role.name),
      permissions: role.rolePermissions.map((rp) => rp.permission.code),
    };
  }
}
