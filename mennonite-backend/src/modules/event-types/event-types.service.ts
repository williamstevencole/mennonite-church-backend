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

  async create(dto: CreateEventTypeDto): Promise<EventTypeResponseDto> {
    await this.assertUniqueName(dto.name);

    const created = await this.prisma.eventType.create({
      data: { name: dto.name, eventCategory: dto.eventCategory },
    });

    return this.toResponse(created);
  }

  async findAll(): Promise<EventTypeResponseDto[]> {
    const items = await this.prisma.eventType.findMany({
      orderBy: { name: 'asc' },
    });
    return items.map((item) => this.toResponse(item));
  }

  async findOne(id: number): Promise<EventTypeResponseDto> {
    const item = await this.prisma.eventType.findUnique({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Tipo de evento ${id} no encontrado`);
    }
    return this.toResponse(item);
  }

  async update(
    id: number,
    dto: UpdateEventTypeDto,
  ): Promise<EventTypeResponseDto> {
    await this.assertExists(id);

    if (dto.name) {
      await this.assertUniqueName(dto.name, id);
    }

    const updated = await this.prisma.eventType.update({
      where: { id },
      data: { name: dto.name, eventCategory: dto.eventCategory },
    });

    return this.toResponse(updated);
  }

  async remove(id: number): Promise<void> {
    await this.assertExists(id);

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

  private async assertExists(id: number): Promise<void> {
    const existing = await this.prisma.eventType.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundException(`Tipo de evento ${id} no encontrado`);
    }
  }

  private async assertUniqueName(name: string, excludeId?: number) {
    const existing = await this.prisma.eventType.findUnique({
      where: { name },
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
