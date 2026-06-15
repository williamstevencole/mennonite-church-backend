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
import { CreateEventResponsibleMemberDto } from './dto/create-event-responsible-member.dto';
import { ListEventResponsibleMembersQueryDto } from './dto/list-event-responsible-members-query.dto';
import { EventResponsibleMembersPageResponseDto } from './dto/event-responsible-members-page.response.dto';
import { EventResponsibleMemberListItemResponseDto } from './dto/event-responsible-member-list-item.response.dto';
import { EventResponsibleMemberDetailResponseDto } from './dto/event-responsible-member-detail.response.dto';
import { EventResponsibleMemberEventSummaryResponseDto } from './dto/event-responsible-member-event-summary.response.dto';
import { EventResponsibleMemberMemberSummaryResponseDto } from './dto/event-responsible-member-member-summary.response.dto';

type EventResponsibleMemberRecord = Prisma.EventResponsibleMemberGetPayload<{
  include: {
    event: true;
    member: true;
  };
}>;

@Injectable()
export class EventResponsibleMembersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    user: JwtPayload,
    dto: CreateEventResponsibleMemberDto,
  ): Promise<IdResponseDto> {
    const idChurch = user.idChurch;

    const [event, member, duplicate] = await Promise.all([
      this.prisma.event.findFirst({
        where: { id: dto.idEvent, idChurch },
        select: { id: true },
      }),
      this.prisma.member.findFirst({
        where: { id: dto.idMember, idChurch },
        select: { id: true },
      }),
      this.prisma.eventResponsibleMember.findFirst({
        where: {
          idEvent: dto.idEvent,
          idMember: dto.idMember,
        },
        select: { id: true },
      }),
    ]);

    if (!event) {
      throw new BadRequestException(
        'El evento no existe o no pertenece a la iglesia',
      );
    }

    if (!member) {
      throw new BadRequestException(
        'El miembro no existe o no pertenece a la iglesia',
      );
    }

    if (duplicate) {
      throw new ConflictException(
        'El miembro ya es responsable de este evento',
      );
    }

    const created = await this.prisma.eventResponsibleMember.create({
      data: {
        idEvent: dto.idEvent,
        idMember: dto.idMember,
      },
      select: { id: true },
    });

    return { id: created.id };
  }

  async findAll(
    user: JwtPayload,
    query: ListEventResponsibleMembersQueryDto,
  ): Promise<EventResponsibleMembersPageResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.EventResponsibleMemberWhereInput = {
      active: true,
      event: { idChurch: user.idChurch },
    };

    if (query.idEvent !== undefined) {
      where.idEvent = query.idEvent;
    }

    if (query.idMember !== undefined) {
      where.idMember = query.idMember;
    }

    const [total, records] = await this.prisma.$transaction([
      this.prisma.eventResponsibleMember.count({ where }),
      this.prisma.eventResponsibleMember.findMany({
        where,
        include: this.include(),
        orderBy: [{ member: { name: 'asc' } }, { id: 'asc' }],
        ...buildPagination(page, limit),
      }),
    ]);

    return toPaginated(
      records.map((item) => this.toListItem(item)),
      total,
      page,
      limit,
    );
  }

  async findOne(
    user: JwtPayload,
    id: number,
  ): Promise<EventResponsibleMemberDetailResponseDto> {
    const record = await this.prisma.eventResponsibleMember.findFirst({
      where: {
        id,
        active: true,
        event: { idChurch: user.idChurch },
      },
      include: this.include(),
    });

    if (!record) {
      throw new NotFoundException(
        `Responsable de evento con id ${id} no encontrado`,
      );
    }

    return this.toDetail(record);
  }

  async remove(user: JwtPayload, id: number): Promise<void> {
    const record = await this.prisma.eventResponsibleMember.findFirst({
      where: {
        id,
        event: { idChurch: user.idChurch },
      },
      select: { id: true, active: true },
    });

    if (!record) {
      throw new NotFoundException(
        `Responsable de evento con id ${id} no encontrado`,
      );
    }

    if (!record.active) {
      return;
    }

    await this.prisma.eventResponsibleMember.update({
      where: { id },
      data: { active: false },
    });
  }

  private include() {
    return {
      event: true,
      member: true,
    };
  }

  private toListItem(
    record: EventResponsibleMemberRecord,
  ): EventResponsibleMemberListItemResponseDto {
    return {
      id: record.id,
      event: this.toEventSummary(record.event),
      member: this.toMemberSummary(record.member),
    };
  }

  private toDetail(
    record: EventResponsibleMemberRecord,
  ): EventResponsibleMemberDetailResponseDto {
    return {
      id: record.id,
      event: this.toEventSummary(record.event),
      member: this.toMemberSummary(record.member),
    };
  }

  private toEventSummary(
    event: EventResponsibleMemberRecord['event'],
  ): EventResponsibleMemberEventSummaryResponseDto {
    return { id: event.id, title: event.title };
  }

  private toMemberSummary(
    member: EventResponsibleMemberRecord['member'],
  ): EventResponsibleMemberMemberSummaryResponseDto {
    return { id: member.id, name: member.name };
  }
}
