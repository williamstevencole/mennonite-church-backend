import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { hashPassword } from '../../common/utils/password.utils';
import { isDuplicateEmailError } from '../../common/utils/prisma.utils';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateUserResponseDto } from './dto/create-user.response.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
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
  constructor(private readonly prisma: PrismaService) {}

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

  async create(dto: CreateUserDto): Promise<CreateUserResponseDto> {
    const role = await this.prisma.userRole.findUnique({
      where: { id: dto.id_role },
      select: { id: true, active: true },
    });

    if (!role?.active) {
      throw new BadRequestException('Rol inexistente');
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

    try {
      const created = await this.prisma.user.create({
        data: {
          email: dto.email,
          passwordHash: hashPassword(dto.password),
          active: true,
          idUserRole: role.id,
        },
        select: { id: true },
      });

      return { id: created.id };
    } catch (error: unknown) {
      if (isDuplicateEmailError(error)) {
        throw new ConflictException(
          'Ya existe un usuario registrado con ese email',
        );
      }
      throw error;
    }
  }

  async findOne(id: number): Promise<UserDetailResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        member: { select: { name: true } },
        userRole: {
          include: {
            rolePermissions: {
              include: { permission: { select: { code: true } } },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`Usuario ${id} no encontrado`);
    }

    return {
      id: user.id,
      email: user.email,
      name: user.member?.name ?? null,
      active: user.active,
      role: user.userRole ? this.toRoleResponse(user.userRole) : null,
    };
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
}
