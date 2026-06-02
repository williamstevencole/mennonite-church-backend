import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PeriodClosure, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  buildPagination,
  toPaginated,
} from '../../common/pagination/paginate.util';
import { IdResponseDto } from '../../common/dto/id-response.dto';
import { CreatePeriodClosureDto } from './dto/create-period-closure.dto';
import { ListPeriodClosuresQueryDto } from './dto/list-period-closures-query.dto';
import { PeriodClosureResponseDto } from './dto/period-closure.response.dto';
import { PeriodClosuresPageResponseDto } from './dto/period-closures-page.response.dto';
import { UpdatePeriodClosureDto } from './dto/update-period-closure.dto';

@Injectable()
export class PeriodClosuresService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    idChurch: number,
    createdBy: number,
    dto: CreatePeriodClosureDto,
  ): Promise<IdResponseDto> {
    await this.assertYearAvailable(idChurch, dto.year);

    const created = await this.prisma.periodClosure.create({
      data: {
        idChurch,
        year: dto.year,
        ownFunds: new Prisma.Decimal(dto.ownFunds),
        accumulatedReserve: new Prisma.Decimal(dto.accumulatedReserve),
        closureDate: dto.closureDate ? new Date(dto.closureDate) : undefined,
        notes: dto.notes,
        createdBy,
      },
      select: { id: true },
    });

    return { id: created.id };
  }

  async findAll(
    idChurch: number,
    query: ListPeriodClosuresQueryDto,
  ): Promise<PeriodClosuresPageResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.PeriodClosureWhereInput = { idChurch };
    if (query.yearFrom !== undefined || query.yearTo !== undefined) {
      where.year = {};
      if (query.yearFrom !== undefined) where.year.gte = query.yearFrom;
      if (query.yearTo !== undefined) where.year.lte = query.yearTo;
    }

    const [total, items] = await this.prisma.$transaction([
      this.prisma.periodClosure.count({ where }),
      this.prisma.periodClosure.findMany({
        where,
        orderBy: [{ year: 'desc' }],
        ...buildPagination(page, limit),
      }),
    ]);

    const withNet = await Promise.all(
      items.map(async (closure) => {
        const net = await this.computeNetResult(idChurch, closure.year);
        return this.toResponse(closure, net);
      }),
    );

    return toPaginated(withNet, total, page, limit);
  }

  async findOne(
    idChurch: number,
    id: number,
  ): Promise<PeriodClosureResponseDto> {
    const closure = await this.prisma.periodClosure.findFirst({
      where: { id, idChurch },
    });

    if (!closure) {
      throw new NotFoundException();
    }

    const netResult = await this.computeNetResult(idChurch, closure.year);
    return this.toResponse(closure, netResult);
  }

  async update(
    idChurch: number,
    id: number,
    dto: UpdatePeriodClosureDto,
  ): Promise<IdResponseDto> {
    const existing = await this.prisma.periodClosure.findFirst({
      where: { id, idChurch },
      select: { id: true, year: true },
    });

    if (!existing) {
      throw new NotFoundException();
    }

    if (dto.year !== undefined && dto.year !== existing.year) {
      await this.assertYearAvailable(idChurch, dto.year, id);
    }

    const updated = await this.prisma.periodClosure.update({
      where: { id },
      data: {
        year: dto.year,
        ownFunds:
          dto.ownFunds !== undefined
            ? new Prisma.Decimal(dto.ownFunds)
            : undefined,
        accumulatedReserve:
          dto.accumulatedReserve !== undefined
            ? new Prisma.Decimal(dto.accumulatedReserve)
            : undefined,
        closureDate:
          dto.closureDate !== undefined ? new Date(dto.closureDate) : undefined,
        notes: dto.notes,
      },
      select: { id: true },
    });

    return { id: updated.id };
  }

  async remove(idChurch: number, id: number): Promise<void> {
    const existing = await this.prisma.periodClosure.findFirst({
      where: { id, idChurch },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException();
    }

    await this.prisma.periodClosure.delete({ where: { id } });
  }

  private async assertYearAvailable(
    idChurch: number,
    year: number,
    excludeId?: number,
  ): Promise<void> {
    const conflict = await this.prisma.periodClosure.findFirst({
      where: {
        idChurch,
        year,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });

    if (conflict) {
      throw new ConflictException(
        `Ya existe un cierre para el año ${year} en esta iglesia`,
      );
    }
  }

  private async computeNetResult(
    idChurch: number,
    year: number,
  ): Promise<number> {
    const start = new Date(Date.UTC(year, 0, 1));
    const end = new Date(Date.UTC(year + 1, 0, 1));

    const grouped = await this.prisma.financialTransaction.groupBy({
      by: ['idCategory'],
      where: {
        idChurch,
        transactionDate: { gte: start, lt: end },
      },
      _sum: { amount: true },
    });

    if (grouped.length === 0) return 0;

    const categoryIds = grouped.map((row) => row.idCategory);
    const categories = await this.prisma.transactionCategory.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, type: true },
    });
    const typeById = new Map(categories.map((c) => [c.id, c.type]));

    let net = 0;
    for (const row of grouped) {
      const sum = Number(row._sum.amount ?? 0);
      const type = typeById.get(row.idCategory);
      net += type === 'income' ? sum : -sum;
    }
    return net;
  }

  private toResponse(
    entity: PeriodClosure,
    netResult: number,
  ): PeriodClosureResponseDto {
    const ownFunds = Number(entity.ownFunds);
    const accumulatedReserve = Number(entity.accumulatedReserve);
    return {
      id: entity.id,
      year: entity.year,
      ownFunds,
      accumulatedReserve,
      total: ownFunds + accumulatedReserve,
      netResult,
      closureDate: entity.closureDate
        ? entity.closureDate.toISOString().slice(0, 10)
        : null,
      notes: entity.notes ?? null,
      createdAt: entity.createdAt ? entity.createdAt.toISOString() : null,
      createdBy: entity.createdBy ?? null,
    };
  }
}
