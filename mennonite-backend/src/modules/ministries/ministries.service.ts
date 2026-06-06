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
import { CreateMinistryDto } from './dto/create-ministry.dto';
import { ListMinistriesQueryDto } from './dto/list-ministries-query.dto';
import { MinistriesPageResponseDto } from './dto/ministries-page.response.dto';
import { MinistryDetailResponseDto } from './dto/ministry-detail.response.dto';
import { MinistryListItemResponseDto } from './dto/ministry-list-item.response.dto';
import { MinistryMemberListItemResponseDto } from './dto/ministry-member-list-item.response.dto';
import { MinistryMemberMemberSummaryResponseDto } from './dto/ministry-member-member-summary.response.dto';
import { MinistryMemberRoleResponseDto } from './dto/ministry-member-role.response.dto';
import { UpdateMinistryDto } from './dto/update-ministry.dto';
import { IdNameResponseDto } from '../../common/dto/id-name-response.dto';

type MinistryMemberListRecord = Prisma.MinistryMemberGetPayload<{
  include: {
    member: { select: { id: true; name: true } };
    ministryRoleType: { select: { id: true; name: true } };
  };
}>;

type MinistryDetailRecord = Prisma.MinistryGetPayload<{
  include: {
    ministryMembers: {
      include: {
        member: { select: { id: true; name: true } };
        ministryRoleType: { select: { id: true; name: true } };
      };
    };
    _count: { select: { ministryMembers: { where: { active: true } } } };
  };
}>;

type MinistryListRecord = Prisma.MinistryGetPayload<{
  include: {
    _count: { select: { ministryMembers: { where: { active: true } } } };
  };
}>;

@Injectable()
export class MinistriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    query: ListMinistriesQueryDto,
  ): Promise<MinistriesPageResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.MinistryWhereInput = {};

    if (query.active !== undefined) {
      where.active = query.active;
    } else if (query.includeInactive !== true) {
      where.active = true;
    }

    const [total, ministries] = await this.prisma.$transaction([
      this.prisma.ministry.count({ where }),
      this.prisma.ministry.findMany({
        where,
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        ...buildPagination(page, limit),
        include: {
          _count: { select: { ministryMembers: { where: { active: true } } } },
        },
      }),
    ]);

    return toPaginated(
      ministries.map((ministry) => this.toListItem(ministry)),
      total,
      page,
      limit,
    );
  }

  async create(
    dto: CreateMinistryDto,
    user: JwtPayload,
  ): Promise<IdNameResponseDto> {
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

    const existing = await this.prisma.ministry.findFirst({
      where: {
        idChurch,
        name: { equals: dto.name.trim(), mode: 'insensitive' },
      },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException(
        `Ya existe un ministerio con el nombre "${dto.name}"`,
      );
    }

    const ministry = await this.prisma.ministry.create({
      data: {
        idChurch,
        name: dto.name,
        createdBy: user.sub,
      },
      select: { id: true, name: true },
    });

    return { id: ministry.id, name: ministry.name };
  }

  async update(
    id: number,
    dto: UpdateMinistryDto,
    user: JwtPayload,
  ): Promise<IdNameResponseDto> {
    const idChurch = await this.resolveChurchId(user);
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.ministry.findFirst({
        where: { id, idChurch },
        select: {
          id: true,
          idChurch: true,
          name: true,
          active: true,
        },
      });

      if (!existing) {
        throw new NotFoundException(`Ministerio con id ${id} no encontrado`);
      }

      if (dto.name !== undefined && dto.name !== existing.name) {
        const duplicate = await tx.ministry.findFirst({
          where: {
            idChurch,
            name: { equals: dto.name.trim(), mode: 'insensitive' },
            NOT: { id },
          },
          select: { id: true },
        });
        if (duplicate) {
          throw new ConflictException(
            `Ya existe un ministerio con el nombre "${dto.name}"`,
          );
        }
      }

      const data: Prisma.MinistryUpdateInput = {};

      if (dto.name !== undefined) {
        data.name = dto.name;
      }

      if (Object.keys(data).length > 0) {
        await tx.ministry.update({
          where: { id },
          data,
          select: { id: true },
        });
      }

      const resolvedName = dto.name ?? existing.name;

      if (dto.id_leader_member !== undefined) {
        await this.updateLeaderAssignment(tx, id, dto.id_leader_member);
      }

      await this.updateMeetingSchedule(
        tx,
        id,
        idChurch,
        existing.name,
        resolvedName,
        dto.meeting_day,
        dto.meeting_time,
        user.sub,
      );

      return { id, name: resolvedName };
    });
  }

  async findOne(
    id: number,
    user: JwtPayload,
    includeInactive = false,
  ): Promise<MinistryDetailResponseDto> {
    const idChurch = await this.resolveChurchId(user);
    const ministry = await this.prisma.ministry.findFirst({
      where: {
        id,
        idChurch,
        ...(includeInactive ? {} : { active: true }),
      },
      include: {
        ministryMembers: {
          include: {
            member: { select: { id: true, name: true } },
            ministryRoleType: { select: { id: true, name: true } },
          },
          orderBy: [{ member: { name: 'asc' } }, { id: 'asc' }],
        },
        _count: { select: { ministryMembers: { where: { active: true } } } },
      },
    });

    if (!ministry) {
      throw new NotFoundException(`Ministerio con id ${id} no encontrado`);
    }

    return this.toDetail(ministry);
  }

  async remove(id: number, user: JwtPayload): Promise<void> {
    const idChurch = await this.resolveChurchId(user);
    const existing = await this.prisma.ministry.findFirst({
      where: { id, idChurch },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException(`Ministerio con id ${id} no encontrado`);
    }

    await this.prisma.$transaction([
      this.prisma.ministry.update({
        where: { id },
        data: { active: false },
      }),
      this.prisma.ministryMember.updateMany({
        where: { idMinistry: id, active: true },
        data: { active: false },
      }),
    ]);
  }

  private toListItem(
    ministry: MinistryListRecord,
  ): MinistryListItemResponseDto {
    return {
      id: ministry.id,
      idChurch: ministry.idChurch,
      name: ministry.name,
      active: ministry.active,
      memberCount: ministry._count.ministryMembers,
    };
  }

  private toDetail(entity: MinistryDetailRecord): MinistryDetailResponseDto {
    return {
      id: entity.id,
      idChurch: entity.idChurch,
      name: entity.name,
      active: entity.active,
      memberCount: entity._count.ministryMembers,
      members: entity.ministryMembers.map((member) =>
        this.toMinistryMemberListItem(member),
      ),
    };
  }

  private async updateLeaderAssignment(
    tx: Prisma.TransactionClient,
    ministryId: number,
    leaderId: number | null,
  ): Promise<void> {
    const leaderRole = await tx.ministryRoleType.findFirst({
      where: {
        idMinistry: ministryId,
        name: { equals: 'Lider de Ministerio', mode: 'insensitive' },
        active: true,
      },
      select: { id: true },
    });

    if (!leaderRole) {
      throw new BadRequestException('Rol de ministerio inexistente');
    }

    if (leaderId === null) {
      await tx.ministryMember.updateMany({
        where: {
          idMinistry: ministryId,
          idMinistryRoleType: leaderRole.id,
          active: true,
        },
        data: { active: false },
      });
      return;
    }

    const member = await tx.member.findUnique({
      where: { id: leaderId },
      select: { id: true, active: true },
    });

    if (!member) {
      throw new BadRequestException('Miembro inexistente');
    }

    if (!member.active) {
      throw new BadRequestException('El miembro esta inactivo');
    }

    const existingAssignment = await tx.ministryMember.findFirst({
      where: {
        idMinistry: ministryId,
        idMember: leaderId,
        active: true,
      },
      select: { id: true, idMinistryRoleType: true },
    });

    let leaderAssignmentId: number;
    if (existingAssignment) {
      if (existingAssignment.idMinistryRoleType !== leaderRole.id) {
        await tx.ministryMember.update({
          where: { id: existingAssignment.id },
          data: { idMinistryRoleType: leaderRole.id },
        });
      }
      leaderAssignmentId = existingAssignment.id;
    } else {
      const created = await tx.ministryMember.create({
        data: {
          idMinistry: ministryId,
          idMember: leaderId,
          idMinistryRoleType: leaderRole.id,
          startDate: new Date(),
          active: true,
        },
        select: { id: true },
      });
      leaderAssignmentId = created.id;
    }

    await tx.ministryMember.updateMany({
      where: {
        idMinistry: ministryId,
        idMinistryRoleType: leaderRole.id,
        active: true,
        NOT: { id: leaderAssignmentId },
      },
      data: { active: false },
    });
  }

  private async updateMeetingSchedule(
    tx: Prisma.TransactionClient,
    ministryId: number,
    idChurch: number,
    previousName: string,
    resolvedName: string,
    meetingDay?: string | null,
    meetingTime?: string | null,
    createdBy?: number,
  ): Promise<void> {
    if (meetingDay === undefined && meetingTime === undefined) {
      return;
    }

    if (meetingDay === null) {
      throw new BadRequestException('Dia de reunion invalido');
    }

    if (meetingTime === null) {
      throw new BadRequestException('Hora de reunion invalida');
    }

    const previousTitle = this.buildMeetingTitle(previousName);
    const newTitle = this.buildMeetingTitle(resolvedName);
    const titleCandidates =
      previousTitle === newTitle ? [previousTitle] : [previousTitle, newTitle];

    const meetingEvent = await tx.event.findFirst({
      where: {
        idMinistry: ministryId,
        idChurch,
        isRecurrent: true,
        frequency: 'weekly',
        title: { in: titleCandidates },
      },
      select: {
        id: true,
        title: true,
        dayOfWeek: true,
        startDatetime: true,
        endDatetime: true,
      },
    });

    let dayInfo =
      meetingDay !== undefined ? this.normalizeDay(meetingDay) : null;

    if (meetingDay !== undefined && !dayInfo) {
      throw new BadRequestException('Dia de reunion invalido');
    }

    if (!dayInfo && meetingEvent?.dayOfWeek) {
      dayInfo = this.normalizeDay(meetingEvent.dayOfWeek);
    }

    if (!dayInfo && meetingEvent) {
      const fallbackIndex = meetingEvent.startDatetime.getDay();
      dayInfo = {
        value: this.dayNameFromIndex(fallbackIndex),
        index: fallbackIndex,
      };
    }

    if (!dayInfo) {
      throw new BadRequestException('Dia de reunion requerido');
    }

    let timeInfo =
      meetingTime !== undefined ? this.parseTime(meetingTime) : null;

    if (meetingTime !== undefined && !timeInfo) {
      throw new BadRequestException('Hora de reunion invalida');
    }

    if (!timeInfo && meetingEvent) {
      timeInfo = {
        hours: meetingEvent.startDatetime.getHours(),
        minutes: meetingEvent.startDatetime.getMinutes(),
      };
    }

    if (!timeInfo) {
      throw new BadRequestException('Hora de reunion requerida');
    }

    const startDatetime = this.nextOccurrence(
      dayInfo.index,
      timeInfo.hours,
      timeInfo.minutes,
    );

    const durationMs = meetingEvent
      ? Math.max(
          meetingEvent.endDatetime.getTime() -
            meetingEvent.startDatetime.getTime(),
          60 * 60 * 1000,
        )
      : 60 * 60 * 1000;

    const endDatetime = new Date(startDatetime.getTime() + durationMs);

    if (meetingEvent) {
      await tx.event.update({
        where: { id: meetingEvent.id },
        data: {
          title: newTitle,
          dayOfWeek: dayInfo.value,
          startDatetime,
          endDatetime,
          isRecurrent: true,
          frequency: 'weekly',
        },
      });
      return;
    }

    await tx.event.create({
      data: {
        idChurch,
        idMinistry: ministryId,
        title: newTitle,
        isRecurrent: true,
        frequency: 'weekly',
        dayOfWeek: dayInfo.value,
        startDatetime,
        endDatetime,
        createdBy,
      },
      select: { id: true },
    });
  }

  private buildMeetingTitle(name: string): string {
    return `Reunion de ${name}`;
  }

  private normalizeDay(day: string): { value: string; index: number } | null {
    const normalized = day.trim().toLowerCase();
    const key = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const mapping: Record<string, { value: string; index: number }> = {
      sunday: { value: 'Sunday', index: 0 },
      domingo: { value: 'Sunday', index: 0 },
      monday: { value: 'Monday', index: 1 },
      lunes: { value: 'Monday', index: 1 },
      tuesday: { value: 'Tuesday', index: 2 },
      martes: { value: 'Tuesday', index: 2 },
      wednesday: { value: 'Wednesday', index: 3 },
      miercoles: { value: 'Wednesday', index: 3 },
      thursday: { value: 'Thursday', index: 4 },
      jueves: { value: 'Thursday', index: 4 },
      friday: { value: 'Friday', index: 5 },
      viernes: { value: 'Friday', index: 5 },
      saturday: { value: 'Saturday', index: 6 },
      sabado: { value: 'Saturday', index: 6 },
    };

    return mapping[key] ?? null;
  }

  private parseTime(time: string): { hours: number; minutes: number } | null {
    const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time.trim());
    if (!match) {
      return null;
    }
    return { hours: Number(match[1]), minutes: Number(match[2]) };
  }

  private nextOccurrence(
    dayIndex: number,
    hours: number,
    minutes: number,
  ): Date {
    const now = new Date();
    const candidate = new Date(now);
    candidate.setHours(hours, minutes, 0, 0);

    const currentDay = candidate.getDay();
    let diff = dayIndex - currentDay;
    if (diff < 0 || (diff === 0 && candidate <= now)) {
      diff += 7;
    }
    candidate.setDate(candidate.getDate() + diff);
    return candidate;
  }

  private dayNameFromIndex(index: number): string {
    const days = [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ];
    return days[index] ?? 'Sunday';
  }

  private toMinistryMemberListItem(
    record: MinistryMemberListRecord,
  ): MinistryMemberListItemResponseDto {
    return {
      id: record.id,
      member: this.toMemberSummary(record.member),
      role: this.toRole(record.ministryRoleType),
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
    role: MinistryMemberListRecord['ministryRoleType'],
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
