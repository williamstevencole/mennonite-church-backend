import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEventTypeDto } from './dto/create-event-type.dto';
import { EventTypeResponseDto } from './dto/event-type.response.dto';
import { UpdateEventTypeDto } from './dto/update-event-type.dto';
import { EventCategory } from './event-category.enum';

@Injectable()
export class EventTypesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    idChurch: number,
    dto: CreateEventTypeDto,
  ): Promise<EventTypeResponseDto> {
    await this.assertUniqueName(idChurch, dto.name);

    const created = await this.prisma.eventType.create({
      data: { idChurch, name: dto.name, eventCategory: dto.eventCategory },
    });

    return this.toResponse(created);
  }

  async findAll(idChurch: number): Promise<EventTypeResponseDto[]> {
    const items = await this.prisma.eventType.findMany({
      where: { idChurch },
      orderBy: { name: 'asc' },
    });
    return items.map((item) => this.toResponse(item));
  }

  async findOne(idChurch: number, id: number): Promise<EventTypeResponseDto> {
    const item = await this.prisma.eventType.findFirst({
      where: { id, idChurch },
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
  ): Promise<EventTypeResponseDto> {
    await this.assertExists(idChurch, id);

    if (dto.name) {
      await this.assertUniqueName(idChurch, dto.name, id);
    }

    const updated = await this.prisma.eventType.update({
      where: { id },
      data: { name: dto.name, eventCategory: dto.eventCategory },
    });

    return this.toResponse(updated);
  }

  async remove(idChurch: number, id: number): Promise<void> {
    await this.assertExists(idChurch, id);

    const usageCount = await this.prisma.event.count({
      where: { idEventType: id },
    });

    if (usageCount > 0) {
      throw new ConflictException(
        `No se puede eliminar: ${usageCount} evento(s) usan este tipo`,
      );
    }

    await this.prisma.eventType.delete({ where: { id } });
  }

  private async assertExists(idChurch: number, id: number): Promise<void> {
    const existing = await this.prisma.eventType.findFirst({
      where: { id, idChurch },
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
    const existing = await this.prisma.eventType.findUnique({
      where: { idChurch_name: { idChurch, name } },
      select: { id: true },
    });

    if (existing && existing.id !== excludeId) {
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
