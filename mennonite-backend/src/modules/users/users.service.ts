import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SupabaseService } from '../../supabase/supabase.service';
import { isDuplicateEmailError } from '../../common/utils/prisma.utils';
import {
  buildPagination,
  toPaginated,
} from '../../common/pagination/paginate.util';
import { AssignUserRoleDto } from './dto/assign-user-role.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { IdResponseDto } from '../../common/dto/id-response.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserDetailResponseDto } from './dto/user-detail.response.dto';
import { UserListItemResponseDto } from './dto/user-list-item.response.dto';
import { UsersPageResponseDto } from './dto/users-page.response.dto';
import { UserRoleResponseDto } from '../user-roles/dto/user-role.response.dto';

type UserWithRelations = Prisma.UserGetPayload<{
  include: {
    member: { select: { name: true } };
    userRole: { select: { name: true } };
  };
}>;

type UserWithDetailRelations = Prisma.UserGetPayload<{
  include: {
    member: { select: { name: true } };
    userRole: {
      include: {
        rolePermissions: {
          include: { permission: { select: { code: true } } };
        };
      };
    };
  };
}>;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
  ) {}

  async findAll(query: ListUsersQueryDto): Promise<UsersPageResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.UserWhereInput = {};

    if (query.active !== undefined) {
      where.active = query.active;
    } else if (query.includeInactive !== true) {
      where.active = true;
    }

    if (query.role) {
      where.userRole = {
        name: { equals: query.role, mode: 'insensitive' },
      };
    }

    if (query.name) {
      where.member = {
        name: { contains: query.name, mode: 'insensitive' },
      };
    }

    const [total, users] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        include: {
          member: { select: { name: true } },
          userRole: { select: { name: true } },
        },
        orderBy: [{ member: { name: 'asc' } }, { email: 'asc' }],
        ...buildPagination(page, limit),
      }),
    ]);

    return toPaginated(
      users.map((user) => this.toListItem(user)),
      total,
      page,
      limit,
    );
  }

  async create(idChurch: number, dto: CreateUserDto): Promise<IdResponseDto> {
    const role = await this.prisma.userRole.findFirst({
      where: { id: dto.idRole, idChurch },
      select: { id: true, active: true },
    });

    if (!role?.active) {
      throw new BadRequestException(
        'Rol inexistente o no pertenece a tu iglesia',
      );
    }

    const member = await this.prisma.member.findFirst({
      where: { id: dto.idMember, idChurch },
      select: { id: true },
    });

    if (!member) {
      throw new BadRequestException(
        'Miembro inexistente o no pertenece a tu iglesia',
      );
    }

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true, active: true },
    });

    if (existing) {
      if (existing.active === true) {
        throw new ConflictException(
          'Ya existe un usuario registrado con ese email',
        );
      } else {
        await this.prisma.user.update({
          where: { id: existing.id },
          data: { active: true },
        });
        return { id: existing.id };
      }
    }

    const existingMemberUser = await this.prisma.user.findUnique({
      where: { idMember: dto.idMember },
      select: { id: true },
    });

    if (existingMemberUser) {
      throw new ConflictException('El miembro ya tiene un usuario asociado');
    }

    const fullName = this.buildMemberName(dto.firstName, dto.lastName);

    const { data: authData, error: authError } = await this.supabase
      .getAdminClient()
      .auth.admin.createUser({
        email: dto.email,
        password: dto.password,
        email_confirm: true,
      });

    if (authError) {
      if (authError.message?.includes('already been registered')) {
        throw new ConflictException(
          'Ya existe un usuario registrado con ese email',
        );
      }
      throw new BadRequestException(
        `Error creando usuario en Supabase Auth: ${authError.message}`,
      );
    }

    try {
      const created = await this.prisma.$transaction(async (tx) => {
        await tx.member.update({
          where: { id: dto.idMember },
          data: { name: fullName },
        });

        return tx.user.create({
          data: {
            email: dto.email,
            supabaseUid: authData.user.id,
            active: true,
            idChurch,
            idUserRole: role.id,
            idMember: dto.idMember,
          },
          select: { id: true },
        });
      });

      return { id: created.id };
    } catch (error: unknown) {
      await this.supabase
        .getAdminClient()
        .auth.admin.deleteUser(authData.user.id);
      if (isDuplicateEmailError(error)) {
        throw new ConflictException(
          'Ya existe un usuario registrado con ese email',
        );
      }
      throw error;
    }
  }

  async update(id: number, dto: UpdateUserDto): Promise<IdResponseDto> {
    const existing = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, idMember: true },
    });

    if (!existing) {
      throw new NotFoundException(`Usuario ${id} no encontrado`);
    }

    if (dto.email && dto.email !== existing.email) {
      const duplicate = await this.prisma.user.findUnique({
        where: { email: dto.email },
        select: { id: true, active: true },
      });

      if (duplicate) {
        if (duplicate.active === true) {
          throw new ConflictException(
            'Ya existe un usuario registrado con ese email',
          );
        } else {
          await this.prisma.user.update({
            where: { id: existing.id },
            data: { active: true },
          });
          return { id: existing.id };
        }
      }
    }

    const wantsNameUpdate =
      dto.firstName !== undefined || dto.lastName !== undefined;

    if (wantsNameUpdate && (!dto.firstName || !dto.lastName)) {
      throw new BadRequestException(
        'Se requieren firstName y lastName para actualizar el nombre',
      );
    }

    if (wantsNameUpdate && !existing.idMember) {
      throw new BadRequestException(
        'El usuario no tiene miembro asociado para actualizar el nombre',
      );
    }

    const data: Prisma.UserUpdateInput = {};
    if (dto.email !== undefined) {
      data.email = dto.email;
    }

    if (dto.password !== undefined) {
      const localUser = await this.prisma.user.findUnique({
        where: { id },
        select: { supabaseUid: true },
      });
      if (localUser?.supabaseUid) {
        const { error: updateErr } = await this.supabase
          .getAdminClient()
          .auth.admin.updateUserById(localUser.supabaseUid, {
            password: dto.password,
          });
        if (updateErr) {
          throw new BadRequestException(
            `Error actualizando password: ${updateErr.message}`,
          );
        }
      }
    }

    if (!wantsNameUpdate && Object.keys(data).length === 0) {
      return { id };
    }

    const fullName = wantsNameUpdate
      ? this.buildMemberName(dto.firstName as string, dto.lastName as string)
      : null;

    try {
      await this.prisma.$transaction(async (tx) => {
        if (wantsNameUpdate) {
          await tx.member.update({
            where: { id: existing.idMember },
            data: { name: fullName! },
          });
        }

        if (Object.keys(data).length > 0) {
          await tx.user.update({
            where: { id },
            data,
            select: { id: true },
          });
        }
      });

      return { id };
    } catch (error: unknown) {
      if (isDuplicateEmailError(error)) {
        throw new ConflictException(
          'Ya existe un usuario registrado con ese email',
        );
      }
      throw error;
    }
  }

  async assignRole(
    idChurch: number,
    id: number,
    dto: AssignUserRoleDto,
  ): Promise<IdResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException(`Usuario ${id} no encontrado`);
    }

    const role = await this.prisma.userRole.findFirst({
      where: { id: dto.idRole, idChurch, active: true },
      select: { id: true },
    });

    if (!role) {
      throw new BadRequestException(
        'Rol inexistente o no pertenece a tu iglesia',
      );
    }

    await this.prisma.user.update({
      where: { id },
      data: { idUserRole: role.id },
    });

    return { id };
  }

  async remove(id: number): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, active: true },
    });

    if (!user) {
      throw new NotFoundException(`Usuario ${id} no encontrado`);
    }

    if (!user.active) {
      return;
    }

    await this.prisma.user.update({
      where: { id },
      data: { active: false },
    });
  }

  async findOne(
    id: number,
    includeInactive = false,
  ): Promise<UserDetailResponseDto> {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        ...(includeInactive ? {} : { active: true }),
      },
      include: this.detailInclude(),
    });

    if (!user) {
      throw new NotFoundException(`Usuario ${id} no encontrado`);
    }

    return this.toDetailResponse(user);
  }

  private toListItem(user: UserWithRelations): UserListItemResponseDto {
    return {
      id: user.id,
      email: user.email,
      name: user.member?.name ?? null,
      role: user.userRole?.name ?? null,
      active: user.active,
    };
  }

  private toDetailResponse(
    user: UserWithDetailRelations,
  ): UserDetailResponseDto {
    return {
      id: user.id,
      email: user.email,
      name: user.member?.name ?? null,
      active: user.active,
      role: user.userRole ? this.toRoleResponse(user.userRole) : null,
    };
  }

  private toRoleResponse(
    role: NonNullable<UserWithDetailRelations['userRole']>,
  ): UserRoleResponseDto {
    return {
      id: role.id,
      name: role.name,
      description: role.description ?? null,
      active: role.active,
      permissions: role.rolePermissions.map((rp) => rp.permission.code),
    };
  }

  private detailInclude() {
    return {
      member: { select: { name: true } },
      userRole: {
        include: {
          rolePermissions: {
            include: { permission: { select: { code: true } } },
          },
        },
      },
    };
  }

  private buildMemberName(firstName: string, lastName: string): string {
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();

    if (fullName.length > 60) {
      throw new BadRequestException('El nombre completo excede 60 caracteres');
    }

    return fullName;
  }
}
