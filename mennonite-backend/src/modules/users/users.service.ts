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
import { CreateUserDto } from './dto/create-user.dto';
import { CreateUserResponseDto } from './dto/create-user.response.dto';
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
    const size = query.size ?? 20;
    const where: Prisma.UserWhereInput = {};

    if (query.active !== undefined) {
      where.active = query.active;
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
        skip: (page - 1) * size,
        take: size,
      }),
    ]);

    return {
      data: users.map((user) => this.toListItem(user)),
      total,
      page,
      size,
    };
  }

  async create(
    idChurch: number,
    dto: CreateUserDto,
  ): Promise<CreateUserResponseDto> {
    const role = await this.prisma.userRole.findFirst({
      where: { id: dto.id_role, idChurch },
      select: { id: true, active: true },
    });

    if (!role?.active) {
      throw new BadRequestException(
        'Rol inexistente o no pertenece a tu iglesia',
      );
    }

    const member = await this.prisma.member.findFirst({
      where: { id: dto.id_member, idChurch },
      select: { id: true },
    });

    if (!member) {
      throw new BadRequestException(
        'Miembro inexistente o no pertenece a tu iglesia',
      );
    }

    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException(
        'Ya existe un usuario registrado con ese email',
      );
    }

    const existingMemberUser = await this.prisma.user.findUnique({
      where: { idMember: dto.id_member },
      select: { id: true },
    });

    if (existingMemberUser) {
      throw new ConflictException('El miembro ya tiene un usuario asociado');
    }

    const fullName = this.buildMemberName(dto.first_name, dto.last_name);

    // Create Supabase Auth user first
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
          where: { id: dto.id_member },
          data: { name: fullName },
        });

        return tx.user.create({
          data: {
            email: dto.email,
            supabaseUid: authData.user.id,
            active: true,
            idChurch,
            idUserRole: role.id,
            idMember: dto.id_member,
          },
          select: { id: true },
        });
      });

      return { id: created.id };
    } catch (error: unknown) {
      // Rollback: delete Supabase Auth user if local creation failed
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

  async update(id: number, dto: UpdateUserDto): Promise<UserDetailResponseDto> {
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
        select: { id: true },
      });

      if (duplicate) {
        throw new ConflictException(
          'Ya existe un usuario registrado con ese email',
        );
      }
    }

    const wantsNameUpdate =
      dto.first_name !== undefined || dto.last_name !== undefined;

    if (wantsNameUpdate && (!dto.first_name || !dto.last_name)) {
      throw new BadRequestException(
        'Se requieren first_name y last_name para actualizar el nombre',
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

    // Update password in Supabase Auth if changed
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
      return this.findOne(id);
    }

    const fullName = wantsNameUpdate
      ? this.buildMemberName(dto.first_name as string, dto.last_name as string)
      : null;

    try {
      const updated = await this.prisma.$transaction(async (tx) => {
        if (wantsNameUpdate) {
          await tx.member.update({
            where: { id: existing.idMember },
            data: { name: fullName! },
          });
        }

        if (Object.keys(data).length > 0) {
          return tx.user.update({
            where: { id },
            data,
            include: this.detailInclude(),
          });
        }

        return tx.user.findUniqueOrThrow({
          where: { id },
          include: this.detailInclude(),
        });
      });

      return this.toDetailResponse(updated);
    } catch (error: unknown) {
      if (isDuplicateEmailError(error)) {
        throw new ConflictException(
          'Ya existe un usuario registrado con ese email',
        );
      }
      throw error;
    }
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

  async findOne(id: number): Promise<UserDetailResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
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
