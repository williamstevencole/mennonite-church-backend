import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  buildPagination,
  toPaginated,
} from '../../common/pagination/paginate.util';
import { CreateEventTypeDto } from './dto/create-event-type.dto';
import { EventTypeResponseDto } from './dto/event-type.response.dto';
import { EventTypesPageResponseDto } from './dto/event-types-page.response.dto';
import { ListEventTypesQueryDto } from './dto/list-event-types-query.dto';
import { UpdateEventTypeDto } from './dto/update-event-type.dto';
import { EventCategory } from './event-category.enum';
import { IdNameResponseDto } from '../../common/dto/id-name-response.dto';

@Injectable()
export class EventTypesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    idChurch: number,
    dto: CreateEventTypeDto,
  ): Promise<IdNameResponseDto> {
    await this.assertUniqueName(idChurch, dto.name);

    const created = await this.prisma.eventType.create({
      data: { idChurch, name: dto.name, eventCategory: dto.eventCategory },
      select: { id: true, name: true },
    });

    return { id: created.id, name: created.name };
  }

  async findAll(
    idChurch: number,
    query: ListEventTypesQueryDto,
  ): Promise<EventTypesPageResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = { idChurch, active: true };

    const [total, items] = await this.prisma.$transaction([
      this.prisma.eventType.count({ where }),
      this.prisma.eventType.findMany({
        where,
        orderBy: { name: 'asc' },
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

  async findOne(idChurch: number, id: number): Promise<EventTypeResponseDto> {
    const item = await this.prisma.eventType.findFirst({
      where: { id, idChurch, active: true },
    });
    if (!item) {
      throw new NotFoundException(`Tipo de evento ${id} no encontrado`);
    }
    return this.toResponse(item);
  }

  async update(
    idChurch: number,
    id: number,
    dto: UpdateEventTypeDto,
  ): Promise<IdNameResponseDto> {
    await this.assertExists(idChurch, id);

    if (dto.name) {
      await this.assertUniqueName(idChurch, dto.name, id);
    }

    const updated = await this.prisma.eventType.update({
      where: { id },
      data: { name: dto.name, eventCategory: dto.eventCategory },
      select: { id: true, name: true },
    });

    return { id: updated.id, name: updated.name };
  }

  async remove(idChurch: number, id: number): Promise<void> {
    const existing = await this.prisma.eventType.findFirst({
      where: { id, idChurch },
      select: { id: true, active: true },
    });
    if (!existing) {
      throw new NotFoundException(`Tipo de evento ${id} no encontrado`);
    }

    // idempotente: si ya está inactivo, no hacer nada
    if (!existing.active) {
      return;
    }

    const usageCount = await this.prisma.event.count({
      where: { idEventType: id, active: true },
    });

    if (usageCount > 0) {
      throw new ConflictException(
        `No se puede eliminar: ${usageCount} evento(s) usan este tipo`,
      );
    }

    await this.prisma.eventType.update({
      where: { id },
      data: { active: false },
    });
  }

  private async assertExists(idChurch: number, id: number): Promise<void> {
    const existing = await this.prisma.eventType.findFirst({
      where: { id, idChurch, active: true },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException(`Tipo de evento ${id} no encontrado`);
    }
  }

  private async assertUniqueName(
    idChurch: number,
    name: string,
    excludeId?: number,
  ) {
    const existing = await this.prisma.eventType.findFirst({
      where: {
        idChurch,
        name: { equals: name.trim(), mode: 'insensitive' },
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException(
        `Ya existe un tipo de evento con el nombre "${name}"`,
      );
    }
  }

  private toResponse(entity: EventType): EventTypeResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      eventCategory: (entity.eventCategory as EventCategory | null) ?? null,
    };
  }
}
