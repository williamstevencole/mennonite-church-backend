import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import { PrismaService } from '../../prisma/prisma.service';
import {
  buildPagination,
  toPaginated,
} from '../../common/pagination/paginate.util';
import { IdResponseDto } from '../../common/dto/id-response.dto';
import { CreateMinistryMemberDto } from './dto/create-ministry-member.dto';
import { ListMinistryMembersQueryDto } from './dto/list-ministry-members-query.dto';
import { MinistryMemberDetailResponseDto } from './dto/ministry-member-detail.response.dto';
import { MinistryMemberListItemResponseDto } from './dto/ministry-member-list-item.response.dto';
import { MinistryMemberMemberSummaryResponseDto } from './dto/ministry-member-member-summary.response.dto';
import { MinistryMemberMinistrySummaryResponseDto } from './dto/ministry-member-ministry-summary.response.dto';
import { MinistryMemberRoleResponseDto } from './dto/ministry-member-role.response.dto';
import { MinistryMembersPageResponseDto } from './dto/ministry-members-page.response.dto';
import { UpdateMinistryMemberDto } from './dto/update-ministry-member.dto';

type MinistryMemberRecord = Prisma.MinistryMemberGetPayload<{
  include: {
    member: { select: { id: true; name: true } };
    ministry: { select: { id: true; name: true } };
    ministryRoleType: { select: { id: true; name: true } };
  };
}>;

@Injectable()
export class MinistryMembersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    user: JwtPayload,
    dto: CreateMinistryMemberDto,
  ): Promise<IdResponseDto> {
    const idChurch = user.idChurch;

    const [ministry, member, role, duplicate] = await Promise.all([
      this.prisma.ministry.findFirst({
        where: { id: dto.idMinistry, idChurch },
        select: { id: true },
      }),
      this.prisma.member.findFirst({
        where: { id: dto.idMember, idChurch },
        select: { id: true, active: true },
      }),
      this.prisma.ministryRoleType.findUnique({
        where: { id: dto.idMinistryRoleType },
        select: { id: true, idMinistry: true, active: true },
      }),
      this.prisma.ministryMember.findFirst({
        where: {
          idMinistry: dto.idMinistry,
          idMember: dto.idMember,
          active: true,
        },
        select: { id: true },
      }),
    ]);

    if (!ministry) {
      throw new BadRequestException('Ministerio inexistente');
    }

    if (!member) {
      throw new BadRequestException('Miembro inexistente');
    }

    if (!member.active) {
      throw new BadRequestException('El miembro esta inactivo');
    }

    if (!role || !role.active) {
      throw new BadRequestException('Rol de ministerio inexistente');
    }

    if (role.idMinistry !== dto.idMinistry) {
      throw new BadRequestException('El rol no pertenece a este ministerio');
    }

    if (duplicate) {
      throw new ConflictException(
        'El miembro ya esta asignado en este ministerio',
      );
    }

    const startDate = new Date(dto.startDate);
    const endDate = dto.endDate ? new Date(dto.endDate) : null;

    if (endDate && endDate < startDate) {
      throw new BadRequestException(
        'La fecha de fin no puede ser anterior a la fecha de inicio',
      );
    }

    const created = await this.prisma.ministryMember.create({
      data: {
        idMinistry: dto.idMinistry,
        idMember: dto.idMember,
        idMinistryRoleType: dto.idMinistryRoleType,
        startDate,
        endDate,
        active: true,
        createdBy: user.sub,
      },
      select: { id: true },
    });

    return { id: created.id };
  }

  async findAll(
    user: JwtPayload,
    query: ListMinistryMembersQueryDto,
  ): Promise<MinistryMembersPageResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.MinistryMemberWhereInput = {
      ministry: { idChurch: user.idChurch },
    };

    if (query.idMinistry !== undefined) {
      where.idMinistry = query.idMinistry;
    }

    if (query.idMember !== undefined) {
      where.idMember = query.idMember;
    }

    if (query.active !== undefined) {
      where.active = query.active;
    } else if (query.includeInactive !== true) {
      where.active = true;
    }

    const [total, members] = await this.prisma.$transaction([
      this.prisma.ministryMember.count({ where }),
      this.prisma.ministryMember.findMany({
        where,
        include: this.include(),
        orderBy: [{ member: { name: 'asc' } }, { id: 'asc' }],
        ...buildPagination(page, limit),
      }),
    ]);

    return toPaginated(
      members.map((item) => this.toListItem(item)),
      total,
      page,
      limit,
    );
  }

  async findOne(
    user: JwtPayload,
    id: number,
    includeInactive = false,
  ): Promise<MinistryMemberDetailResponseDto> {
    const record = await this.prisma.ministryMember.findFirst({
      where: {
        id,
        ministry: { idChurch: user.idChurch },
        ...(includeInactive ? {} : { active: true }),
      },
      include: this.include(),
    });

    if (!record) {
      throw new NotFoundException(
        `Integrante de ministerio con id ${id} no encontrado`,
      );
    }

    return this.toDetail(record);
  }

  async update(
    user: JwtPayload,
    id: number,
    dto: UpdateMinistryMemberDto,
  ): Promise<IdResponseDto> {
    const existing = await this.prisma.ministryMember.findFirst({
      where: { id, ministry: { idChurch: user.idChurch } },
      select: {
        id: true,
        idMinistry: true,
        idMinistryRoleType: true,
        startDate: true,
        endDate: true,
      },
    });

    if (!existing) {
      throw new NotFoundException(
        `Integrante de ministerio con id ${id} no encontrado`,
      );
    }

    const data: Prisma.MinistryMemberUpdateInput = {};

    if (dto.idMinistryRoleType !== undefined) {
      const role = await this.prisma.ministryRoleType.findUnique({
        where: { id: dto.idMinistryRoleType },
        select: { id: true, idMinistry: true, active: true },
      });

      if (!role || !role.active) {
        throw new BadRequestException('Rol de ministerio inexistente');
      }

      if (role.idMinistry !== existing.idMinistry) {
        throw new BadRequestException('El rol no pertenece a este ministerio');
      }

      data.ministryRoleType = { connect: { id: role.id } };
    }

    if (dto.startDate !== undefined) {
      data.startDate = new Date(dto.startDate);
    }

    if (dto.endDate !== undefined) {
      data.endDate = new Date(dto.endDate);
    }

    if (dto.active !== undefined) {
      data.active = dto.active;
    }

    const resolvedStartDate =
      dto.startDate !== undefined
        ? new Date(dto.startDate)
        : existing.startDate;
    const resolvedEndDate =
      dto.endDate !== undefined ? new Date(dto.endDate) : existing.endDate;

    if (resolvedEndDate && resolvedEndDate < resolvedStartDate) {
      throw new BadRequestException(
        'La fecha de fin no puede ser anterior a la fecha de inicio',
      );
    }

    if (Object.keys(data).length === 0) {
      return { id: existing.id };
    }

    const updated = await this.prisma.ministryMember.update({
      where: { id },
      data,
      select: { id: true },
    });

    return { id: updated.id };
  }

  async remove(user: JwtPayload, id: number): Promise<void> {
    const existing = await this.prisma.ministryMember.findFirst({
      where: { id, ministry: { idChurch: user.idChurch } },
      select: { id: true, active: true },
    });

    if (!existing) {
      throw new NotFoundException(
        `Integrante de ministerio con id ${id} no encontrado`,
      );
    }

    if (!existing.active) {
      return;
    }

    await this.prisma.ministryMember.update({
      where: { id },
      data: { active: false },
    });
  }

  private include() {
    return {
      member: { select: { id: true, name: true } },
      ministry: { select: { id: true, name: true } },
      ministryRoleType: { select: { id: true, name: true } },
    };
  }

  private toListItem(
    record: MinistryMemberRecord,
  ): MinistryMemberListItemResponseDto {
    return {
      id: record.id,
      member: this.toMemberSummary(record.member),
      ministry: this.toMinistrySummary(record.ministry),
      role: this.toRole(record.ministryRoleType),
      startDate: record.startDate,
      endDate: record.endDate,
      active: record.active,
    };
  }

  private toDetail(
    record: MinistryMemberRecord,
  ): MinistryMemberDetailResponseDto {
    return {
      id: record.id,
      member: this.toMemberSummary(record.member),
      ministry: this.toMinistrySummary(record.ministry),
      role: this.toRole(record.ministryRoleType),
      startDate: record.startDate,
      endDate: record.endDate,
      active: record.active,
      createdAt: record.createdAt ?? null,
      createdBy: record.createdBy ?? null,
    };
  }

  private toMemberSummary(
    member: MinistryMemberRecord['member'],
  ): MinistryMemberMemberSummaryResponseDto {
    return { id: member.id, name: member.name };
  }

  private toMinistrySummary(
    ministry: MinistryMemberRecord['ministry'],
  ): MinistryMemberMinistrySummaryResponseDto {
    return { id: ministry.id, name: ministry.name };
  }

  private toRole(
    role: MinistryMemberRecord['ministryRoleType'],
  ): MinistryMemberRoleResponseDto {
    return { id: role.id, name: role.name };
  }
}
