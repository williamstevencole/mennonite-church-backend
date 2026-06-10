import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Event, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  buildPagination,
  toPaginated,
} from '../../common/pagination/paginate.util';
import { CalendarEventResponseDto } from './dto/calendar-event.response.dto';
import { CalendarEventsPageResponseDto } from './dto/calendar-events-page.response.dto';
import { IdResponseDto } from '../../common/dto/id-response.dto';
import {
  CreateCalendarEventDto,
  DayOfWeek,
  EventFrequency,
  EventStatus,
} from './dto/create-calendar-event.dto';
import {
  CalendarEventOrigin,
  CalendarEventsSort,
  ListCalendarEventsQueryDto,
} from './dto/list-calendar-events-query.dto';
import { UpdateCalendarEventDto } from './dto/update-calendar-event.dto';

@Injectable()
export class CalendarEventsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateCalendarEventDto,
    createdBy?: number,
  ): Promise<IdResponseDto> {
    this.assertDateRange(dto.startDatetime, dto.endDatetime);
    const isRecurrent = dto.isRecurrent ?? false;
    this.assertRecurrence(isRecurrent, dto.frequency, dto.dayOfWeek);

    await this.assertChurchExists(dto.idChurch);
    if (dto.idEventType !== undefined)
      await this.assertEventTypeExists(dto.idEventType);
    if (dto.idMinistry !== undefined)
      await this.assertMinistryExists(dto.idMinistry);

    const created = await this.prisma.event.create({
      data: {
        idChurch: dto.idChurch,
        idEventType: dto.idEventType,
        idMinistry: dto.idMinistry,
        title: dto.title,
        description: dto.description,
        location: dto.location,
        estimatedBudget:
          dto.estimatedBudget !== undefined
            ? new Prisma.Decimal(dto.estimatedBudget)
            : undefined,
        isRecurrent,
        frequency: dto.frequency,
        dayOfWeek: dto.dayOfWeek,
        recurrenceEndDate: dto.recurrenceEndDate
          ? new Date(dto.recurrenceEndDate)
          : undefined,
        startDatetime: new Date(dto.startDatetime),
        endDatetime: new Date(dto.endDatetime),
        status: dto.status ?? EventStatus.Planned,
        createdBy,
      },
      select: { id: true },
    });

    return { id: created.id };
  }

  async findAll(
    query: ListCalendarEventsQueryDto,
  ): Promise<CalendarEventsPageResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.EventWhereInput = {};

    if (query.idChurch !== undefined) where.idChurch = query.idChurch;
    if (query.idMinistry !== undefined) {
      where.idMinistry = query.idMinistry;
    } else if (query.origin === CalendarEventOrigin.General) {
      where.idMinistry = null;
    } else if (query.origin === CalendarEventOrigin.Ministry) {
      where.idMinistry = { not: null };
    }
    if (query.idEventType !== undefined) where.idEventType = query.idEventType;
    if (query.status) where.status = query.status;

    if (query.from || query.to) {
      const startFilter: Prisma.DateTimeFilter = {};
      if (query.from) startFilter.gte = new Date(query.from);
      if (query.to) startFilter.lte = new Date(query.to);
      where.startDatetime = startFilter;
    }

    if (query.q) {
      where.title = { contains: query.q, mode: 'insensitive' };
    }

    const direction: Prisma.SortOrder =
      query.sort === CalendarEventsSort.StartDesc ? 'desc' : 'asc';

    const [total, items] = await this.prisma.$transaction([
      this.prisma.event.count({ where }),
      this.prisma.event.findMany({
        where,
        orderBy: [{ startDatetime: direction }, { id: direction }],
        ...buildPagination(page, limit),
      }),
    ]);

    return toPaginated(
      items.map((item) => this.toResponse(item)),
      total,
      page,
      limit,
    );
  }

  async findOne(id: number): Promise<CalendarEventResponseDto> {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) {
      throw new NotFoundException(`Evento ${id} no encontrado`);
    }
    return this.toResponse(event);
  }

  async update(
    id: number,
    dto: UpdateCalendarEventDto,
  ): Promise<IdResponseDto> {
    const current = await this.prisma.event.findUnique({ where: { id } });
    if (!current) {
      throw new NotFoundException(`Evento ${id} no encontrado`);
    }

    const nextStart = dto.startDatetime
      ? new Date(dto.startDatetime)
      : current.startDatetime;
    const nextEnd = dto.endDatetime
      ? new Date(dto.endDatetime)
      : current.endDatetime;
    if (nextEnd <= nextStart) {
      throw new BadRequestException(
        'endDatetime debe ser posterior a startDatetime',
      );
    }

    const nextIsRecurrent = dto.isRecurrent ?? current.isRecurrent;
    const nextFrequency =
      dto.frequency ?? (current.frequency as EventFrequency | null);
    const nextDayOfWeek =
      dto.dayOfWeek ?? (current.dayOfWeek as DayOfWeek | null);
    this.assertRecurrence(
      nextIsRecurrent,
      nextFrequency ?? undefined,
      nextDayOfWeek ?? undefined,
    );

    if (dto.idChurch !== undefined && dto.idChurch !== current.idChurch) {
      await this.assertChurchExists(dto.idChurch);
    }
    if (
      dto.idEventType !== undefined &&
      dto.idEventType !== current.idEventType
    ) {
      await this.assertEventTypeExists(dto.idEventType);
    }
    if (dto.idMinistry !== undefined && dto.idMinistry !== current.idMinistry) {
      await this.assertMinistryExists(dto.idMinistry);
    }

    const updated = await this.prisma.event.update({
      where: { id },
      data: {
        idChurch: dto.idChurch,
        idEventType: dto.idEventType,
        idMinistry: dto.idMinistry,
        title: dto.title,
        description: dto.description,
        location: dto.location,
        estimatedBudget:
          dto.estimatedBudget !== undefined
            ? new Prisma.Decimal(dto.estimatedBudget)
            : undefined,
        isRecurrent: dto.isRecurrent,
        frequency: dto.frequency,
        dayOfWeek: dto.dayOfWeek,
        recurrenceEndDate:
          dto.recurrenceEndDate !== undefined
            ? new Date(dto.recurrenceEndDate)
            : undefined,
        startDatetime: dto.startDatetime ? nextStart : undefined,
        endDatetime: dto.endDatetime ? nextEnd : undefined,
        status: dto.status,
      },
      select: { id: true },
    });

    return { id: updated.id };
  }

  async remove(id: number): Promise<void> {
    const event = await this.prisma.event.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!event) {
      throw new NotFoundException(`Evento ${id} no encontrado`);
    }
    await this.prisma.event.delete({ where: { id } });
  }

  private assertDateRange(start: string, end: string): void {
    if (new Date(end) <= new Date(start)) {
      throw new BadRequestException(
        'endDatetime debe ser posterior a startDatetime',
      );
    }
  }

  private assertRecurrence(
    isRecurrent: boolean,
    frequency?: EventFrequency | null,
    dayOfWeek?: DayOfWeek | null,
  ): void {
    if (!isRecurrent) {
      if (frequency || dayOfWeek) {
        throw new BadRequestException(
          'frequency y dayOfWeek solo aplican cuando isRecurrent=true',
        );
      }
      return;
    }

    if (!frequency) {
      throw new BadRequestException(
        'frequency es requerido cuando isRecurrent=true',
      );
    }

    if (frequency === EventFrequency.Weekly && !dayOfWeek) {
      throw new BadRequestException(
        'dayOfWeek es requerido cuando frequency=weekly',
      );
    }

    if (frequency !== EventFrequency.Weekly && dayOfWeek) {
      throw new BadRequestException(
        'dayOfWeek solo aplica cuando frequency=weekly',
      );
    }
  }

  private async assertChurchExists(idChurch: number): Promise<void> {
    const exists = await this.prisma.church.findUnique({
      where: { id: idChurch },
      select: { id: true },
    });
    if (!exists) {
      throw new BadRequestException(`La iglesia con id ${idChurch} no existe`);
    }
  }

  private async assertEventTypeExists(idEventType: number): Promise<void> {
    const exists = await this.prisma.eventType.findUnique({
      where: { id: idEventType },
      select: { id: true },
    });
    if (!exists) {
      throw new BadRequestException(
        `El tipo de evento con id ${idEventType} no existe`,
      );
    }
  }

  private async assertMinistryExists(idMinistry: number): Promise<void> {
    const exists = await this.prisma.ministry.findUnique({
      where: { id: idMinistry },
      select: { id: true },
    });
    if (!exists) {
      throw new BadRequestException(
        `El ministerio con id ${idMinistry} no existe`,
      );
    }
  }

  private toResponse(event: Event): CalendarEventResponseDto {
    return {
      id: event.id,
      idChurch: event.idChurch,
      idEventType: event.idEventType ?? null,
      idMinistry: event.idMinistry ?? null,
      title: event.title,
      description: event.description ?? null,
      location: event.location ?? null,
      estimatedBudget:
        event.estimatedBudget !== null ? Number(event.estimatedBudget) : null,
      isRecurrent: event.isRecurrent,
      frequency: (event.frequency as EventFrequency | null) ?? null,
      dayOfWeek: (event.dayOfWeek as DayOfWeek | null) ?? null,
      recurrenceEndDate: event.recurrenceEndDate
        ? event.recurrenceEndDate.toISOString().slice(0, 10)
        : null,
      startDatetime: event.startDatetime.toISOString(),
      endDatetime: event.endDatetime.toISOString(),
      status: event.status as EventStatus,
      cancelReason: event.cancelReason ?? null,
      cancelledAt: event.cancelledAt ? event.cancelledAt.toISOString() : null,
      cancelledBy: event.cancelledBy ?? null,
      createdAt: event.createdAt ? event.createdAt.toISOString() : null,
      createdBy: event.createdBy ?? null,
    };
  }
}
