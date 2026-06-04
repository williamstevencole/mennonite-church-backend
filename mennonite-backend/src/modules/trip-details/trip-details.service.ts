import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTripDetailDto } from './dto/create-trip-detail.dto';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import { IdResponseDto } from '../../common/dto/id-response.dto';

import {
  buildPagination,
  toPaginated,
} from '../../common/pagination/paginate.util';

import { PaginationQueryDto } from '../../common/pagination/pagination-query.dto';
import { TripDetailResponseDto } from './dto/trip-detail-response.dto';
import { ApiProperty } from '@nestjs/swagger';
import { PaginatedResponseDto } from '../../common/pagination/paginated-response.dto';
import { UpdateTripDetailDto } from './dto/update-trip-detail.dto';

export class TripDetailListResponseDto extends PaginatedResponseDto<TripDetailResponseDto> {
  @ApiProperty({
    type: [TripDetailResponseDto],
  })
  data!: TripDetailResponseDto[];
}

@Injectable()
export class TripDetailsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateTripDetailDto,
    user: JwtPayload,
  ): Promise<IdResponseDto> {
    // 1. Buscar evento (con seguridad por iglesia)
    const event = await this.prisma.event.findFirst({
      where: {
        id: dto.idEvent,
        idChurch: user.idChurch,
      },
      include: { eventType: true },
    });

    if (!event) {
      throw new BadRequestException('El evento no existe');
    }

    // 2. Validar tipo TRIP
    if (event.eventType?.eventCategory !== 'trip') {
      throw new BadRequestException('Este evento no es tipo trip');
    }

    // 3. Evitar duplicados
    const existing = await this.prisma.tripDetail.findUnique({
      where: { idEvent: dto.idEvent },
    });

    if (existing) {
      throw new BadRequestException('Este evento ya tiene trip details');
    }

    // 4. Crear
    const created = await this.prisma.tripDetail.create({
      data: {
        idEvent: dto.idEvent,
        origin: dto.origin,
        destination: dto.destination,
        notes: dto.notes ?? null,
      },
      select: {
        id: true,
      },
    });

    return { id: created.id };
  }

  async findAll(user: JwtPayload, query: PaginationQueryDto) {
    const { skip, take } = buildPagination(query.page ?? 1, query.limit ?? 20);

    const where = {
      event: {
        idChurch: user.idChurch,
        eventType: {
          eventCategory: 'trip',
        },
      },
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.tripDetail.findMany({
        where,
        skip,
        take,
        orderBy: { id: 'desc' },
        select: {
          id: true,
          origin: true,
          destination: true,
          notes: true,
          event: {
            select: {
              title: true,
            },
          },
        },
      }),
      this.prisma.tripDetail.count({ where }),
    ]);

    const mapped = data.map((t) => ({
      id: t.id,
      origin: t.origin,
      destination: t.destination,
      notes: t.notes,
      eventTitle: t.event.title,
    }));

    return toPaginated(mapped, total, query.page ?? 1, query.limit ?? 20);
  }

  async findOne(id: number, user: JwtPayload): Promise<TripDetailResponseDto> {
    const tripDetail = await this.prisma.tripDetail.findFirst({
      where: {
        id,
        event: {
          idChurch: user.idChurch,
        },
      },
      select: {
        id: true,
        origin: true,
        destination: true,
        notes: true,
        event: {
          select: {
            title: true,
          },
        },
      },
    });

    if (!tripDetail) {
      throw new NotFoundException('Trip detail no encontrado');
    }

    return {
      id: tripDetail.id,
      origin: tripDetail.origin,
      destination: tripDetail.destination,
      notes: tripDetail.notes,
      eventTitle: tripDetail.event.title,
    };
  }

  async update(
    id: number,
    dto: UpdateTripDetailDto,
    user: JwtPayload,
  ): Promise<IdResponseDto> {
    const tripDetail = await this.prisma.tripDetail.findFirst({
      where: {
        id,
        event: {
          idChurch: user.idChurch,
        },
      },
      include: {
        event: {
          include: {
            eventType: true,
          },
        },
      },
    });

    if (!tripDetail) {
      throw new NotFoundException('Trip detail no encontrado');
    }

    if (tripDetail.event.eventType?.eventCategory !== 'trip') {
      throw new BadRequestException('Este evento no es tipo trip');
    }

    const updated = await this.prisma.tripDetail.update({
      where: { id },
      data: {
        origin: dto.origin,
        destination: dto.destination,
        notes: dto.notes ?? null,
      },
      select: { id: true },
    });

    return updated;
  }
}
