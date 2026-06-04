import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  buildPagination,
  toPaginated,
} from '../../common/pagination/paginate.util';
import { IdResponseDto } from '../../common/dto/id-response.dto';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import { CreateFundraisingDetailDto } from './dto/create-fundraising-detail.dto';
import { UpdateFundraisingDetailDto } from './dto/update-fundraising-detail.dto';
import { ListFundraisingDetailsQueryDto } from './dto/list-fundraising-details-query.dto';
import { FundraisingDetailDetailResponseDto } from './dto/fundraising-detail-detail.response.dto';
import { FundraisingDetailListItemResponseDto } from './dto/fundraising-detail-list-item.response.dto';
import { FundraisingDetailsPageResponseDto } from './dto/fundraising-details-page.response.dto';

@Injectable()
export class FundraisingDetailsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateFundraisingDetailDto,
    user: JwtPayload,
  ): Promise<IdResponseDto> {
    // 1. Verificar que el evento existe y pertenece a la iglesia del usuario
    const event = await this.prisma.event.findFirst({
      where: {
        id: dto.idEvent,
        idChurch: user.idChurch,
      },
      include: { eventType: true },
    });

    if (!event) {
      throw new BadRequestException(
        'El evento no existe o no pertenece a tu iglesia',
      );
    }

    // 2. Validar que el evento sea de categoria fundraising
    if (event.eventType?.eventCategory !== 'fundraising') {
      throw new BadRequestException('El evento no es de categoria fundraising');
    }

    // 3. Verificar que no exista ya un fundraising detail para este evento
    const existing = await this.prisma.fundraisingDetail.findUnique({
      where: { idEvent: dto.idEvent },
    });

    if (existing) {
      throw new ConflictException(
        'Este evento ya tiene un detalle de recaudacion registrado',
      );
    }

    // 4. Crear el detalle
    const created = await this.prisma.fundraisingDetail.create({
      data: {
        idEvent: dto.idEvent,
        targetAmount:
          dto.targetAmount !== undefined
            ? new Prisma.Decimal(dto.targetAmount)
            : undefined,
        notes: dto.notes,
      },
      select: { id: true },
    });

    return { id: created.id };
  }

  async findAll(
    query: ListFundraisingDetailsQueryDto,
    user: JwtPayload,
  ): Promise<FundraisingDetailsPageResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.FundraisingDetailWhereInput = {
      event: { idChurch: user.idChurch },
    };

    if (query.idEvent !== undefined) {
      where.idEvent = query.idEvent;
    }

    const [total, items] = await this.prisma.$transaction([
      this.prisma.fundraisingDetail.count({ where }),
      this.prisma.fundraisingDetail.findMany({
        where,
        orderBy: { id: 'asc' },
        ...buildPagination(page, limit),
        select: {
          id: true,
          targetAmount: true,
          notes: true,
          event: {
            select: { id: true, title: true },
          },
        },
      }),
    ]);

    const data: FundraisingDetailListItemResponseDto[] = items.map((item) => ({
      id: item.id,
      targetAmount:
        item.targetAmount !== null ? Number(item.targetAmount) : null,
      notes: item.notes ?? null,
      event: { id: item.event.id, title: item.event.title },
    }));

    return toPaginated(data, total, page, limit);
  }

  async findOne(
    id: number,
    user: JwtPayload,
  ): Promise<FundraisingDetailDetailResponseDto> {
    const detail = await this.prisma.fundraisingDetail.findFirst({
      where: {
        id,
        event: { idChurch: user.idChurch },
      },
      select: {
        id: true,
        targetAmount: true,
        notes: true,
        event: {
          select: { id: true, title: true },
        },
      },
    });

    if (!detail) {
      throw new NotFoundException(`Detalle de recaudacion ${id} no encontrado`);
    }

    return {
      id: detail.id,
      targetAmount:
        detail.targetAmount !== null ? Number(detail.targetAmount) : null,
      notes: detail.notes ?? null,
      event: { id: detail.event.id, title: detail.event.title },
    };
  }

  async update(
    id: number,
    dto: UpdateFundraisingDetailDto,
    user: JwtPayload,
  ): Promise<IdResponseDto> {
    const existing = await this.prisma.fundraisingDetail.findFirst({
      where: {
        id,
        event: { idChurch: user.idChurch },
      },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException(`Detalle de recaudacion ${id} no encontrado`);
    }

    const data: Prisma.FundraisingDetailUpdateInput = {};

    if (dto.targetAmount !== undefined) {
      data.targetAmount = new Prisma.Decimal(dto.targetAmount);
    }

    // Use undefined (not null) so unset fields are not overwritten
    if (dto.notes !== undefined) {
      data.notes = dto.notes;
    }

    const updated = await this.prisma.fundraisingDetail.update({
      where: { id },
      data,
      select: { id: true },
    });

    return { id: updated.id };
  }

  async remove(id: number, user: JwtPayload): Promise<void> {
    const existing = await this.prisma.fundraisingDetail.findFirst({
      where: {
        id,
        event: { idChurch: user.idChurch },
      },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException(`Detalle de recaudacion ${id} no encontrado`);
    }

    await this.prisma.fundraisingDetail.delete({ where: { id } });
  }
}
