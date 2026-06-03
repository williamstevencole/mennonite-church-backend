import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTripDetailDto } from './dto/create-trip-detail.dto';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import { IdResponseDto } from '../../common/dto/id-response.dto';

@Injectable()
export class TripDetailsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateTripDetailDto,
    user: JwtPayload,
  ): Promise<IdResponseDto> {
    // 1. Buscar evento
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

    // 2. Validar que sea TRIP
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
      select: { id: true },
    });

    return created;
  }
}
