import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Ministry, Prisma } from '@prisma/client';
import type { JwtPayload } from '../../auth/strategies/jwt.strategy';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMinistryDto } from './dto/create-ministry.dto';
import { ListMinistriesQueryDto } from './dto/list-ministries-query.dto';
import { MinistriesPageResponseDto } from './dto/ministries-page.response.dto';
import { MinistryCreatedResponseDto } from './dto/ministry-created.response.dto';
import { MinistryDetailResponseDto } from './dto/ministry-detail.response.dto';
import { MinistryListItemResponseDto } from './dto/ministry-list-item.response.dto';
import { MinistryMemberListItemResponseDto } from './dto/ministry-member-list-item.response.dto';
import { MinistryMemberMemberSummaryResponseDto } from './dto/ministry-member-member-summary.response.dto';
import { MinistryMemberRoleResponseDto } from './dto/ministry-member-role.response.dto';

type MinistryMemberListRecord = Prisma.MinistryMemberGetPayload<{
  include: {
    member: { select: { id: true; name: true } };
    memberRoleType: { select: { id: true; name: true } };
  };
}>;

type MinistryDetailRecord = Prisma.MinistryGetPayload<{
  include: {
    ministryMembers: {
      include: {
        member: { select: { id: true; name: true } };
        memberRoleType: { select: { id: true; name: true } };
      };
    };
  };
}>;

@Injectable()
export class MinistriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    query: ListMinistriesQueryDto,
  ): Promise<MinistriesPageResponseDto> {
    const page = query.page ?? 1;
    const size = query.size ?? 20;
    const where: Prisma.MinistryWhereInput = {};

    if (query.active !== undefined) {
      where.active = query.active;
    }

    const [total, ministries] = await this.prisma.$transaction([
      this.prisma.ministry.count({ where }),
      this.prisma.ministry.findMany({
        where,
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * size,
        take: size,
      }),
    ]);

    return {
      data: ministries.map((ministry) => this.toListItem(ministry)),
      total,
      page,
      size,
    };
  }

  async create(
    dto: CreateMinistryDto,
    user: JwtPayload,
  ): Promise<MinistryCreatedResponseDto> {
    const idChurch = await this.resolveChurchId(user);

    if (dto.id_leader_member) {
      const member = await this.prisma.member.findUnique({
        where: { id: dto.id_leader_member },
        select: { id: true, active: true },
      });

      if (!member) {
        throw new BadRequestException('El miembro lider no existe');
      }

      if (!member.active) {
        throw new BadRequestException('El miembro lider esta inactivo');
      }
    }

    const existing = await this.prisma.ministry.findUnique({
      where: {
        idChurch_code: {
          idChurch,
          code: dto.code,
        },
      },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException(
        `Ya existe un ministerio con el codigo "${dto.code}"`,
      );
    }

    const ministry = await this.prisma.ministry.create({
      data: {
        idChurch,
        code: dto.code,
        name: dto.name,
        createdBy: user.sub,
      },
      select: { id: true },
    });

    return { id: ministry.id };
  }

  async findOne(
    id: number,
    user: JwtPayload,
  ): Promise<MinistryDetailResponseDto> {
    const idChurch = await this.resolveChurchId(user);
    const ministry = await this.prisma.ministry.findFirst({
      where: { id, idChurch },
      include: {
        ministryMembers: {
          where: { assignmentType: 'ministry' },
          include: {
            member: { select: { id: true, name: true } },
            memberRoleType: { select: { id: true, name: true } },
          },
          orderBy: [{ member: { name: 'asc' } }, { id: 'asc' }],
        },
      },
    });

    if (!ministry) {
      throw new NotFoundException(`Ministerio con id ${id} no encontrado`);
    }

    return this.toDetail(ministry);
  }

  private toListItem(ministry: Ministry): MinistryListItemResponseDto {
    return {
      id: ministry.id,
      idChurch: ministry.idChurch,
      name: ministry.name,
      code: ministry.code,
      active: ministry.active,
    };
  }

  private toDetail(entity: MinistryDetailRecord): MinistryDetailResponseDto {
    return {
      id: entity.id,
      idChurch: entity.idChurch,
      code: entity.code,
      name: entity.name,
      active: entity.active,
      members: entity.ministryMembers.map((member) =>
        this.toMinistryMemberListItem(member),
      ),
    };
  }

  private toMinistryMemberListItem(
    record: MinistryMemberListRecord,
  ): MinistryMemberListItemResponseDto {
    return {
      id: record.id,
      member: this.toMemberSummary(record.member),
      role: this.toRole(record.memberRoleType),
      startDate: record.startDate,
      endDate: record.endDate,
      active: record.active,
    };
  }

  private toMemberSummary(
    member: MinistryMemberListRecord['member'],
  ): MinistryMemberMemberSummaryResponseDto {
    return {
      id: member.id,
      name: member.name,
    };
  }

  private toRole(
    role: MinistryMemberListRecord['memberRoleType'],
  ): MinistryMemberRoleResponseDto {
    return {
      id: role.id,
      name: role.name,
    };
  }

  private async resolveChurchId(user: JwtPayload): Promise<number> {
    const userRecord = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: { idChurch: true },
    });

    if (!userRecord) {
      throw new BadRequestException('Usuario no encontrado');
    }

    if (!userRecord.idChurch) {
      throw new BadRequestException('El usuario no tiene iglesia asignada');
    }

    return userRecord.idChurch;
  }
}
