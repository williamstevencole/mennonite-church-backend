import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  buildPagination,
  toPaginated,
} from '../../common/pagination/paginate.util';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import { CreateMemberEventDto } from './dto/create-member-event.dto';
import { UpdateMemberEventDto } from './dto/update-member-event.dto';
import { IdResponseDto } from 'src/common/dto/id-response.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { MemberEventsPageResponseDto } from './dto/member-events-page.response.dto';
import { ListMemberEventsQueryDto } from './dto/list-member-events-query.dto';
import { MemberEventListItemResponseDto } from './dto/member-event-list-item.response.dto';
import { MemberEventEventSummaryResponseDto } from './dto/member-event-event-summary.response.dto';
import { MemberEventMemberSummaryResponseDto } from './dto/member-event-member-summary.response.dto';
import { MemberEventDetailResponseDto } from './dto/member-events-detail.response.dto';

type MemberEventRecord = Prisma.MemberEventGetPayload<{
  include: {
    member: true;
    event: true;
  };
}>;

@Injectable()
export class MemberEventService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    user: JwtPayload,
    dto: CreateMemberEventDto,
  ): Promise<IdResponseDto> {
    const idChurch = user.idChurch;

    const [event, member, duplicate] = await Promise.all([
      this.prisma.event.findFirst({
        where: { id: dto.idEvent, idChurch },
        select: { id: true },
      }),
      this.prisma.member.findFirst({
        where: { id: dto.idMember, idChurch },
        select: { id: true, active: true },
      }),
      this.prisma.memberEvent.findFirst({
        where: {
          idEvent: dto.idEvent,
          idMember: dto.idMember,
        },
        select: { id: true },
      }),
    ]);

    if (!event) {
      throw new BadRequestException('Evento inexistente');
    }

    if (!member) {
      throw new BadRequestException('Miembro inexistente');
    }

    if (!member.active) {
      throw new BadRequestException('El miembro esta inactivo');
    }

    if (duplicate) {
      throw new ConflictException('El miembro ya esta asignado en este evento');
    }

    const created = await this.prisma.memberEvent.create({
      data: {
        idEvent: dto.idEvent,
        idMember: dto.idMember,
        attended: dto.attended,
        notes: dto.notes,
      },
      select: { id: true },
    });

    return { id: created.id };
  }

  async findAll(
    user: JwtPayload,
    query: ListMemberEventsQueryDto,
  ): Promise<MemberEventsPageResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.MemberEventWhereInput = {
      event: { idChurch: user.idChurch },
    };

    if (query.idEvent !== undefined) {
      where.idEvent = query.idEvent;
    }

    if (query.idMember !== undefined) {
      where.idMember = query.idMember;
    }

    const [total, members] = await this.prisma.$transaction([
      this.prisma.memberEvent.count({ where }),
      this.prisma.memberEvent.findMany({
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
  ): Promise<MemberEventDetailResponseDto> {
    const record = await this.prisma.memberEvent.findFirst({
      where: {
        id,
        member: { idChurch: user.idChurch },
      },
      include: this.include(),
    });

    if (!record) {
      throw new NotFoundException(
        `Integrante de evento con id ${id} no encontrado`,
      );
    }

    return this.toDetail(record);
  }

  async update(
    user: JwtPayload,
    id: number,
    dto: UpdateMemberEventDto,
  ): Promise<IdResponseDto> {
    const existing = await this.prisma.memberEvent.findFirst({
      where: { id, event: { idChurch: user.idChurch } },
      select: {
        id: true,
        idMember: true,
        idEvent: true,
        attended: true,
        notes: true,
      },
    });

    if (!existing) {
      throw new NotFoundException(
        `Integrante de ministerio con id ${id} no encontrado`,
      );
    }
    const data: Prisma.MemberEventUpdateInput = {};

    if (dto.attended !== undefined) {
      data.attended = dto.attended;
    }

    if (dto.notes !== undefined) {
      data.notes = dto.notes;
    }

    if (Object.keys(data).length === 0) {
      return { id: existing.id };
    }

    const updated = await this.prisma.memberEvent.update({
      where: { id },
      data,
      select: { id: true },
    });

    return { id: updated.id };
  }

  async remove(user: JwtPayload, id: number): Promise<void> {
    const record = await this.prisma.memberEvent.findFirst({
      where: {
        id,
        event: { idChurch: user.idChurch },
      },
      select: { id: true },
    });

    if (!record) {
      throw new NotFoundException(
        `Integrante de evento con id ${id} no encontrado`,
      );
    }

    await this.prisma.memberEvent.delete({ where: { id } });
  }

  private include() {
    return {
      member: true,
      event: true,
    };
  }

  private toListItem(
    record: MemberEventRecord,
  ): MemberEventListItemResponseDto {
    return {
      id: record.id,
      member: this.toMemberSummary(record.member),
      event: this.toEventSummary(record.event),
      attended: record.attended,
      notes: record.notes,
    };
  }

  private toDetail(record: MemberEventRecord): MemberEventDetailResponseDto {
    return {
      id: record.id,
      member: this.toMemberSummary(record.member),
      event: this.toEventSummary(record.event),
      attended: record.attended,
      notes: record.notes,
      createdAt: record.createdAt ?? null,
    };
  }

  private toMemberSummary(
    member: MemberEventRecord['member'],
  ): MemberEventMemberSummaryResponseDto {
    return { id: member.id, name: member.name };
  }

  private toEventSummary(
    event: MemberEventRecord['event'],
  ): MemberEventEventSummaryResponseDto {
    return { id: event.id, name: event.title };
  }
}
