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

const DETAIL_SELECT = {
  id: true,
  targetAmount: true,
  notes: true,
  event: {
    select: {
      id: true,
      title: true,
      startDatetime: true,
      status: true,
      responsibleMembers: {
        select: { member: { select: { id: true, name: true } } },
      },
    },
  },
} satisfies Prisma.FundraisingDetailSelect;

type DetailRecord = Prisma.FundraisingDetailGetPayload<{
  select: typeof DETAIL_SELECT;
}>;

@Injectable()
export class FundraisingDetailsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateFundraisingDetailDto,
    user: JwtPayload,
  ): Promise<IdResponseDto> {
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

    if (event.eventType?.eventCategory !== 'fundraising') {
      throw new BadRequestException('El evento no es de categoria fundraising');
    }

    const existing = await this.prisma.fundraisingDetail.findUnique({
      where: { idEvent: dto.idEvent },
      select: { id: true, active: true },
    });

    if (existing?.active) {
      throw new ConflictException(
        'Este evento ya tiene un detalle de recaudacion registrado',
      );
    }

    const targetAmount =
      dto.targetAmount !== undefined
        ? new Prisma.Decimal(dto.targetAmount)
        : undefined;

    if (existing) {
      const reactivated = await this.prisma.fundraisingDetail.update({
        where: { id: existing.id },
        data: {
          targetAmount,
          notes: dto.notes,
          active: true,
        },
        select: { id: true },
      });
      return { id: reactivated.id };
    }

    const created = await this.prisma.fundraisingDetail.create({
      data: {
        idEvent: dto.idEvent,
        targetAmount,
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
    const orderDir =
      query.orderBy === 'date_asc'
        ? Prisma.SortOrder.asc
        : Prisma.SortOrder.desc;

    const where: Prisma.FundraisingDetailWhereInput = {
      active: true,
      event: { idChurch: user.idChurch },
    };

    if (query.idEvent !== undefined) {
      where.idEvent = query.idEvent;
    }

    const [total, items] = await this.prisma.$transaction([
      this.prisma.fundraisingDetail.count({ where }),
      this.prisma.fundraisingDetail.findMany({
        where,
        orderBy: { event: { startDatetime: orderDir } },
        ...buildPagination(page, limit),
        select: DETAIL_SELECT,
      }),
    ]);

    const eventIds = items.map((i) => i.event.id);
    const totalsByEvent = await this.computeEventTotals(
      eventIds,
      user.idChurch,
    );

    const data: FundraisingDetailListItemResponseDto[] = items.map((item) =>
      this.toResponse(item, totalsByEvent.get(item.event.id)),
    );

    return toPaginated(data, total, page, limit);
  }

  async findOne(
    id: number,
    user: JwtPayload,
  ): Promise<FundraisingDetailDetailResponseDto> {
    const detail = await this.prisma.fundraisingDetail.findFirst({
      where: {
        id,
        active: true,
        event: { idChurch: user.idChurch },
      },
      select: DETAIL_SELECT,
    });

    if (!detail) {
      throw new NotFoundException(`Detalle de recaudacion ${id} no encontrado`);
    }

    const typedDetail: DetailRecord = detail;
    const eventId = typedDetail.event.id;

    const totalsByEvent = await this.computeEventTotals(
      [eventId],
      user.idChurch,
    );

    return this.toResponse(typedDetail, totalsByEvent.get(eventId));
  }

  async update(
    id: number,
    dto: UpdateFundraisingDetailDto,
    user: JwtPayload,
  ): Promise<IdResponseDto> {
    const existing = await this.prisma.fundraisingDetail.findFirst({
      where: {
        id,
        active: true,
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
      select: { id: true, active: true },
    });

    if (!existing) {
      throw new NotFoundException(`Detalle de recaudacion ${id} no encontrado`);
    }

    if (!existing.active) {
      return;
    }

    await this.prisma.fundraisingDetail.update({
      where: { id },
      data: { active: false },
    });
  }

  /**
   * One-shot aggregate of income/expense totals per event from
   * financial_transaction joined with transaction_category.type.
   * Returns Map<idEvent, { income, expense }>.
   */
  private async computeEventTotals(
    eventIds: number[],
    idChurch: number,
  ): Promise<Map<number, { income: number; expense: number }>> {
    const totals = new Map<number, { income: number; expense: number }>();
    if (eventIds.length === 0) return totals;

    const rows = await this.prisma.financialTransaction.groupBy({
      by: ['idEvent', 'idCategory'],
      where: {
        idChurch,
        idEvent: { in: eventIds },
      },
      _sum: { amount: true },
    });

    if (rows.length === 0) return totals;

    const categoryIds = Array.from(new Set(rows.map((r) => r.idCategory)));
    const categories = await this.prisma.transactionCategory.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, type: true },
    });
    const categoryType = new Map(categories.map((c) => [c.id, c.type]));

    for (const row of rows) {
      if (row.idEvent === null) continue;
      const type = categoryType.get(row.idCategory);
      const amount = row._sum.amount !== null ? Number(row._sum.amount) : 0;
      const current = totals.get(row.idEvent) ?? { income: 0, expense: 0 };
      if (type === 'income') current.income += amount;
      else if (type === 'expense') current.expense += amount;
      totals.set(row.idEvent, current);
    }

    return totals;
  }

  private toResponse(
    record: DetailRecord,
    totals: { income: number; expense: number } | undefined,
  ): FundraisingDetailListItemResponseDto {
    const income = totals?.income ?? 0;
    const expense = totals?.expense ?? 0;
    return {
      id: record.id,
      targetAmount:
        record.targetAmount !== null ? Number(record.targetAmount) : null,
      notes: record.notes ?? null,
      event: {
        id: record.event.id,
        title: record.event.title,
        startDate: record.event.startDatetime.toISOString(),
        status: record.event.status,
      },
      responsibles: record.event.responsibleMembers.map((r) => ({
        id: r.member.id,
        name: r.member.name,
      })),
      actualIncome: income,
      actualExpense: expense,
      profit: income - expense,
    };
  }
}
