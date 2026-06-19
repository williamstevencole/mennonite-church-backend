import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FinancialTransaction, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  buildPagination,
  toPaginated,
} from '../../common/pagination/paginate.util';
import { TransactionCategoryType } from '../transaction-categories/transaction-category-type.enum';
import {
  CreateFinancialTransactionDto,
  PaymentMethod,
  ReceiptType,
} from './dto/create-financial-transaction.dto';
import { FinancialTransactionResponseDto } from './dto/financial-transaction.response.dto';
import { FinancialTransactionsPageResponseDto } from './dto/financial-transactions-page.response.dto';
import {
  ListFinancialTransactionsQueryDto,
  TransactionOrigin,
} from './dto/list-financial-transactions-query.dto';
import { UpdateFinancialTransactionDto } from './dto/update-financial-transaction.dto';
import {
  FinancialTransactionsSeriesQueryDto,
  SeriesRange,
} from './dto/series-query.dto';
import {
  FinancialTransactionsSeriesResponseDto,
  MonthlySeriesPointDto,
} from './dto/financial-transactions-series.response.dto';
import { FinancialTransactionsSummaryQueryDto } from './dto/summary-query.dto';
import {
  CategorySummaryDto,
  FinancialTransactionsSummaryResponseDto,
  MinistrySummaryDto,
} from './dto/financial-transactions-summary.response.dto';
import { IdResponseDto } from '../../common/dto/id-response.dto';

const TOP_CATEGORY_LIMIT = 3;

const MONTHLY_SERIES_ROW_SELECT = {
  amount: true,
  transactionDate: true,
  category: { select: { type: true } },
} satisfies Prisma.FinancialTransactionSelect;

type MonthlySeriesRow = Prisma.FinancialTransactionGetPayload<{
  select: typeof MONTHLY_SERIES_ROW_SELECT;
}>;

const MONTH_LABELS = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
];

const RANGE_MONTHS: Record<SeriesRange, number> = {
  '3m': 3,
  '6m': 6,
  '12m': 12,
};

type FinancialTransactionWithCategory = FinancialTransaction & {
  category?: { type: string } | null;
};

@Injectable()
export class FinancialTransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateFinancialTransactionDto,
    createdBy?: number,
  ): Promise<IdResponseDto> {
    await this.assertChurchExists(dto.idChurch);
    await this.assertCategoryExists(dto.idCategory);
    if (dto.idEvent !== undefined) await this.assertEventExists(dto.idEvent);
    if (dto.idMinistry !== undefined)
      await this.assertMinistryExists(dto.idMinistry);

    const transactionDate = new Date(dto.transactionDate);
    await this.assertYearOpen(dto.idChurch, transactionDate.getUTCFullYear());

    const created = await this.prisma.financialTransaction.create({
      data: {
        idChurch: dto.idChurch,
        idCategory: dto.idCategory,
        amount: new Prisma.Decimal(dto.amount),
        description: dto.description,
        transactionDate,
        paymentMethod: dto.paymentMethod,
        receiptType: dto.receiptType,
        receiptNumber: dto.receiptNumber,
        notes: dto.notes,
        idEvent: dto.idEvent,
        idMinistry: dto.idMinistry,
        createdBy,
      },
      select: { id: true },
    });

    return { id: created.id };
  }

  async findAll(
    query: ListFinancialTransactionsQueryDto,
  ): Promise<FinancialTransactionsPageResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.FinancialTransactionWhereInput = { active: true };

    if (query.idChurch !== undefined) where.idChurch = query.idChurch;
    if (query.categoryId !== undefined) where.idCategory = query.categoryId;
    if (query.ministryId !== undefined) {
      where.idMinistry = query.ministryId;
    } else if (query.origin === TransactionOrigin.General) {
      where.idMinistry = null;
    } else if (query.origin === TransactionOrigin.Ministry) {
      where.idMinistry = { not: null };
    }
    if (query.type) where.category = { type: query.type };

    if (query.year !== undefined) {
      const year = query.year;
      if (query.month !== undefined) {
        const month = query.month;
        where.transactionDate = {
          gte: new Date(Date.UTC(year, month - 1, 1)),
          lt: new Date(Date.UTC(year, month, 1)),
        };
      } else {
        where.transactionDate = {
          gte: new Date(Date.UTC(year, 0, 1)),
          lt: new Date(Date.UTC(year + 1, 0, 1)),
        };
      }
    }

    const [total, items] = await this.prisma.$transaction([
      this.prisma.financialTransaction.count({ where }),
      this.prisma.financialTransaction.findMany({
        where,
        orderBy: [{ transactionDate: 'desc' }, { id: 'desc' }],
        ...buildPagination(page, limit),
        include: { category: { select: { type: true } } },
      }),
    ]);

    return toPaginated(
      items.map((item) => this.toResponse(item)),
      total,
      page,
      limit,
    );
  }

  async findOne(id: number): Promise<FinancialTransactionResponseDto> {
    const item = await this.prisma.financialTransaction.findFirst({
      where: { id, active: true },
      include: { category: { select: { type: true } } },
    });
    if (!item) {
      throw new NotFoundException(`Transaccion ${id} no encontrada`);
    }
    return this.toResponse(item);
  }

  async update(
    id: number,
    dto: UpdateFinancialTransactionDto,
  ): Promise<IdResponseDto> {
    const current = await this.prisma.financialTransaction.findFirst({
      where: { id, active: true },
    });
    if (!current) {
      throw new NotFoundException(`Transaccion ${id} no encontrada`);
    }

    const idChurch = dto.idChurch ?? current.idChurch;
    const currentYear = current.transactionDate.getUTCFullYear();
    await this.assertYearOpen(current.idChurch, currentYear);

    if (dto.idChurch !== undefined && dto.idChurch !== current.idChurch) {
      await this.assertChurchExists(dto.idChurch);
    }
    if (dto.idCategory !== undefined && dto.idCategory !== current.idCategory) {
      await this.assertCategoryExists(dto.idCategory);
    }
    if (dto.idEvent !== undefined && dto.idEvent !== current.idEvent) {
      await this.assertEventExists(dto.idEvent);
    }
    if (dto.idMinistry !== undefined && dto.idMinistry !== current.idMinistry) {
      await this.assertMinistryExists(dto.idMinistry);
    }

    let nextDate: Date | undefined;
    if (dto.transactionDate !== undefined) {
      nextDate = new Date(dto.transactionDate);
      const nextYear = nextDate.getUTCFullYear();
      if (nextYear !== currentYear || idChurch !== current.idChurch) {
        await this.assertYearOpen(idChurch, nextYear);
      }
    }

    const updated = await this.prisma.financialTransaction.update({
      where: { id },
      data: {
        idChurch: dto.idChurch,
        idCategory: dto.idCategory,
        amount:
          dto.amount !== undefined ? new Prisma.Decimal(dto.amount) : undefined,
        description: dto.description,
        transactionDate: nextDate,
        paymentMethod: dto.paymentMethod,
        receiptType: dto.receiptType,
        receiptNumber: dto.receiptNumber,
        notes: dto.notes,
        idEvent: dto.idEvent,
        idMinistry: dto.idMinistry,
      },
      select: { id: true },
    });

    return { id: updated.id };
  }

  async remove(id: number): Promise<void> {
    const existing = await this.prisma.financialTransaction.findUnique({
      where: { id },
      select: {
        id: true,
        idChurch: true,
        transactionDate: true,
        active: true,
      },
    });
    if (!existing) {
      throw new NotFoundException(`Transaccion ${id} no encontrada`);
    }

    if (!existing.active) {
      return;
    }

    await this.assertYearOpen(
      existing.idChurch,
      existing.transactionDate.getUTCFullYear(),
    );

    await this.prisma.financialTransaction.update({
      where: { id },
      data: { active: false },
    });
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

  private async assertCategoryExists(idCategory: number): Promise<void> {
    const exists = await this.prisma.transactionCategory.findUnique({
      where: { id: idCategory },
      select: { id: true },
    });
    if (!exists) {
      throw new BadRequestException(
        `La categoria con id ${idCategory} no existe`,
      );
    }
  }

  private async assertEventExists(idEvent: number): Promise<void> {
    const exists = await this.prisma.event.findUnique({
      where: { id: idEvent },
      select: { id: true },
    });
    if (!exists) {
      throw new BadRequestException(`El evento con id ${idEvent} no existe`);
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

  private async assertYearOpen(idChurch: number, year: number): Promise<void> {
    const closure = await this.prisma.periodClosure.findFirst({
      where: { idChurch, year, active: true },
      select: { id: true },
    });
    if (closure) {
      throw new ConflictException(`Año ${year} ya cerrado para esta iglesia`);
    }
  }

  async getMonthlySeries(
    query: FinancialTransactionsSeriesQueryDto,
    idChurch: number,
  ): Promise<FinancialTransactionsSeriesResponseDto> {
    const range: SeriesRange = query.range ?? '12m';
    const months = RANGE_MONTHS[range];

    const now = new Date();
    const endExclusive = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
    );
    const start = new Date(
      Date.UTC(
        endExclusive.getUTCFullYear(),
        endExclusive.getUTCMonth() - months,
        1,
      ),
    );

    const rows: MonthlySeriesRow[] =
      await this.prisma.financialTransaction.findMany({
        where: {
          idChurch,
          active: true,
          transactionDate: { gte: start, lt: endExclusive },
        },
        select: MONTHLY_SERIES_ROW_SELECT,
      });

    const bucket = new Map<string, { income: number; expense: number }>();
    for (let i = 0; i < months; i++) {
      const d = new Date(
        Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + i, 1),
      );
      bucket.set(this.monthKey(d), { income: 0, expense: 0 });
    }

    for (const row of rows) {
      const key = this.monthKey(row.transactionDate);
      const current = bucket.get(key);
      if (!current) continue;
      const amount = Number(row.amount);
      const categoryType = row.category?.type;
      if (categoryType === 'income') current.income += amount;
      else if (categoryType === 'expense') current.expense += amount;
    }

    const data: MonthlySeriesPointDto[] = [];
    for (const [key, totals] of bucket.entries()) {
      const [yearStr, monthStr] = key.split('-');
      const year = Number(yearStr);
      const month = Number(monthStr);
      data.push({
        year,
        month,
        label: `${MONTH_LABELS[month - 1]}-${year}`,
        income: totals.income,
        expense: totals.expense,
        net: totals.income - totals.expense,
      });
    }

    return { range, data };
  }

  async getSummary(
    query: FinancialTransactionsSummaryQueryDto,
    userIdChurch: number,
  ): Promise<FinancialTransactionsSummaryResponseDto> {
    const idChurch = query.idChurch ?? userIdChurch;
    const where: Prisma.FinancialTransactionWhereInput = {
      idChurch,
      active: true,
    };

    if (query.year !== undefined) {
      where.transactionDate = {
        gte: new Date(Date.UTC(query.year, 0, 1)),
        lt: new Date(Date.UTC(query.year + 1, 0, 1)),
      };
    }

    const rows = await this.prisma.financialTransaction.findMany({
      where,
      select: {
        amount: true,
        idMinistry: true,
        idCategory: true,
        category: { select: { type: true, name: true } },
        ministry: { select: { id: true, name: true } },
      },
    });

    let totalIncome = 0;
    let totalExpense = 0;
    let generalIncome = 0;
    let generalExpense = 0;
    let ministryIncome = 0;
    let ministryExpense = 0;
    let incomeCount = 0;
    let expenseCount = 0;

    const byMinistry = new Map<
      number,
      {
        ministryName: string;
        income: number;
        expense: number;
        count: number;
      }
    >();
    const byCategoryIncome = new Map<
      number,
      { categoryName: string; amount: number }
    >();
    const byCategoryExpense = new Map<
      number,
      { categoryName: string; amount: number }
    >();

    for (const row of rows) {
      const amount = Number(row.amount);
      const type = row.category?.type;
      const isIncome = type === 'income';
      const isExpense = type === 'expense';

      if (isIncome) {
        totalIncome += amount;
        incomeCount += 1;
      } else if (isExpense) {
        totalExpense += amount;
        expenseCount += 1;
      }

      if (row.idMinistry === null) {
        if (isIncome) generalIncome += amount;
        else if (isExpense) generalExpense += amount;
      } else if (row.ministry) {
        if (isIncome) ministryIncome += amount;
        else if (isExpense) ministryExpense += amount;

        const bucket = byMinistry.get(row.ministry.id) ?? {
          ministryName: row.ministry.name,
          income: 0,
          expense: 0,
          count: 0,
        };
        if (isIncome) bucket.income += amount;
        else if (isExpense) bucket.expense += amount;
        bucket.count += 1;
        byMinistry.set(row.ministry.id, bucket);
      }

      if (row.category && isIncome) {
        const current = byCategoryIncome.get(row.idCategory) ?? {
          categoryName: row.category.name,
          amount: 0,
        };
        current.amount += amount;
        byCategoryIncome.set(row.idCategory, current);
      } else if (row.category && isExpense) {
        const current = byCategoryExpense.get(row.idCategory) ?? {
          categoryName: row.category.name,
          amount: 0,
        };
        current.amount += amount;
        byCategoryExpense.set(row.idCategory, current);
      }
    }

    const byMinistryList: MinistrySummaryDto[] = Array.from(
      byMinistry.entries(),
    )
      .map(([idMinistry, b]) => ({
        idMinistry,
        ministryName: b.ministryName,
        income: b.income,
        expense: b.expense,
        net: b.income - b.expense,
        count: b.count,
      }))
      .sort((a, b) => Math.abs(b.net) - Math.abs(a.net));

    const topIncome: CategorySummaryDto[] = Array.from(
      byCategoryIncome.entries(),
    )
      .map(([idCategory, c]) => ({
        idCategory,
        categoryName: c.categoryName,
        amount: c.amount,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, TOP_CATEGORY_LIMIT);

    const topExpense: CategorySummaryDto[] = Array.from(
      byCategoryExpense.entries(),
    )
      .map(([idCategory, c]) => ({
        idCategory,
        categoryName: c.categoryName,
        amount: c.amount,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, TOP_CATEGORY_LIMIT);

    return {
      year: query.year ?? null,
      idChurch,
      totalIncome,
      totalExpense,
      totalNet: totalIncome - totalExpense,
      generalIncome,
      generalExpense,
      generalNet: generalIncome - generalExpense,
      ministryIncome,
      ministryExpense,
      ministryNet: ministryIncome - ministryExpense,
      totalCount: rows.length,
      incomeCount,
      expenseCount,
      byMinistry: byMinistryList,
      topIncome,
      topExpense,
    };
  }

  private monthKey(date: Date): string {
    const y = date.getUTCFullYear();
    const m = date.getUTCMonth() + 1;
    return `${y}-${String(m).padStart(2, '0')}`;
  }

  private toResponse(
    entity: FinancialTransactionWithCategory,
  ): FinancialTransactionResponseDto {
    return {
      id: entity.id,
      idChurch: entity.idChurch,
      idCategory: entity.idCategory,
      categoryType: entity.category
        ? (entity.category.type as TransactionCategoryType)
        : undefined,
      amount: Number(entity.amount),
      description: entity.description,
      transactionDate: entity.transactionDate.toISOString().slice(0, 10),
      paymentMethod: (entity.paymentMethod as PaymentMethod | null) ?? null,
      receiptType: (entity.receiptType as ReceiptType | null) ?? null,
      receiptNumber: entity.receiptNumber ?? null,
      notes: entity.notes ?? null,
      idEvent: entity.idEvent ?? null,
      idMinistry: entity.idMinistry ?? null,
      createdAt: entity.createdAt ? entity.createdAt.toISOString() : null,
      createdBy: entity.createdBy ?? null,
    };
  }
}
