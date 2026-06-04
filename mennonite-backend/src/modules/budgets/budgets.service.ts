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
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { ListBudgetsQueryDto } from './dto/list-budgets-query.dto';
import { BudgetDetailResponseDto } from './dto/budget-detail.response.dto';
import { BudgetListItemResponseDto } from './dto/budget-list-item.response.dto';
import { BudgetsPageResponseDto } from './dto/budgets-page.response.dto';

type BudgetRow = {
  id: number;
  periodStart: Date;
  description: string | null;
  status: string;
  createdAt: Date | null;
  createdBy: number | null;
};

@Injectable()
export class BudgetsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    idChurch: number,
    createdBy: number,
    dto: CreateBudgetDto,
  ): Promise<IdResponseDto> {
    await this.assertYearAvailable(idChurch, dto.year);

    const periodStart = new Date(Date.UTC(dto.year, 0, 1));
    const periodEnd = new Date(Date.UTC(dto.year, 11, 31));

    const created = await this.prisma.budget.create({
      data: {
        idChurch,
        periodStart,
        periodEnd,
        description: dto.description ?? null,
        status: 'Draft',
        createdBy,
      },
      select: { id: true },
    });

    return { id: created.id };
  }

  async findAll(
    idChurch: number,
    query: ListBudgetsQueryDto,
  ): Promise<BudgetsPageResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.BudgetWhereInput = { idChurch };
    if (query.status !== undefined) {
      where.status = query.status;
    }

    const [total, items] = await this.prisma.$transaction([
      this.prisma.budget.count({ where }),
      this.prisma.budget.findMany({
        where,
        orderBy: [{ periodStart: 'desc' }, { id: 'desc' }],
        ...buildPagination(page, limit),
        select: {
          id: true,
          periodStart: true,
          description: true,
          status: true,
          createdAt: true,
          createdBy: true,
        },
      }),
    ]);

    return toPaginated(
      items.map((item) => this.toListItem(item)),
      total,
      page,
      limit,
    );
  }

  async findOne(
    idChurch: number,
    id: number,
  ): Promise<BudgetDetailResponseDto> {
    const budget = await this.prisma.budget.findFirst({
      where: { id, idChurch },
      select: {
        id: true,
        periodStart: true,
        description: true,
        status: true,
        createdAt: true,
        createdBy: true,
      },
    });

    if (!budget) {
      throw new NotFoundException('Presupuesto no encontrado');
    }

    const year = budget.periodStart.getUTCFullYear();

    const [categoryAggregates, distributionCount] =
      await this.prisma.$transaction([
        this.prisma.budgetCategory.findMany({
          where: { idBudget: id },
          select: {
            annualAmount: true,
            category: { select: { type: true } },
          },
        }),
        this.prisma.budgetDistribution.count({ where: { idBudget: id } }),
      ]);

    let totalIncome = 0;
    let totalExpenses = 0;
    for (const row of categoryAggregates) {
      const amount = Number(row.annualAmount);
      if (row.category.type === 'income') {
        totalIncome += amount;
      } else {
        totalExpenses += amount;
      }
    }

    return {
      id: budget.id,
      year,
      description: budget.description,
      status: budget.status,
      createdAt: budget.createdAt ? budget.createdAt.toISOString() : null,
      createdBy: budget.createdBy,
      totals: {
        totalIncome,
        totalExpenses,
        distributionCount,
      },
    };
  }

  async update(
    idChurch: number,
    id: number,
    dto: UpdateBudgetDto,
  ): Promise<IdResponseDto> {
    const existing = await this.prisma.budget.findFirst({
      where: { id, idChurch },
      select: { id: true, status: true },
    });

    if (!existing) {
      throw new NotFoundException('Presupuesto no encontrado');
    }

    if (existing.status === 'Closed') {
      throw new ConflictException(
        'No se puede modificar un presupuesto cerrado',
      );
    }

    const updated = await this.prisma.budget.update({
      where: { id },
      data: { description: dto.description },
      select: { id: true },
    });

    return { id: updated.id };
  }

  async remove(idChurch: number, id: number): Promise<void> {
    const existing = await this.prisma.budget.findFirst({
      where: { id, idChurch },
      select: { id: true, status: true },
    });

    if (!existing) {
      throw new NotFoundException('Presupuesto no encontrado');
    }

    if (existing.status !== 'Draft') {
      throw new ConflictException('Solo se pueden eliminar borradores');
    }

    await this.prisma.$transaction([
      this.prisma.budgetDistribution.deleteMany({ where: { idBudget: id } }),
      this.prisma.budgetCategory.deleteMany({ where: { idBudget: id } }),
      this.prisma.budget.delete({ where: { id } }),
    ]);
  }

  async activate(idChurch: number, id: number): Promise<IdResponseDto> {
    const existing = await this.prisma.budget.findFirst({
      where: { id, idChurch },
      select: { id: true, status: true },
    });

    if (!existing) {
      throw new NotFoundException('Presupuesto no encontrado');
    }

    if (existing.status !== 'Draft') {
      throw new ConflictException(
        `El presupuesto debe estar en estado Draft para activarse (estado actual: ${existing.status})`,
      );
    }

    const percentageSum = await this.prisma.budgetDistribution.aggregate({
      where: { idBudget: id },
      _sum: { percentage: true },
    });

    const total = Number(percentageSum._sum.percentage ?? 0);
    if (Math.abs(total - 100) > 0.001) {
      throw new BadRequestException(
        `La suma de porcentajes de distribución debe ser exactamente 100 (actual: ${total})`,
      );
    }

    const updated = await this.prisma.budget.update({
      where: { id },
      data: { status: 'Active' },
      select: { id: true },
    });

    return { id: updated.id };
  }

  async close(idChurch: number, id: number): Promise<IdResponseDto> {
    const existing = await this.prisma.budget.findFirst({
      where: { id, idChurch },
      select: { id: true, status: true },
    });

    if (!existing) {
      throw new NotFoundException('Presupuesto no encontrado');
    }

    if (existing.status !== 'Active') {
      throw new ConflictException(
        `El presupuesto debe estar en estado Active para cerrarse (estado actual: ${existing.status})`,
      );
    }

    const updated = await this.prisma.budget.update({
      where: { id },
      data: { status: 'Closed' },
      select: { id: true },
    });

    return { id: updated.id };
  }

  private async assertYearAvailable(
    idChurch: number,
    year: number,
  ): Promise<void> {
    const periodStart = new Date(Date.UTC(year, 0, 1));
    const periodEnd = new Date(Date.UTC(year, 11, 31));

    const conflict = await this.prisma.budget.findFirst({
      where: { idChurch, periodStart, periodEnd },
      select: { id: true },
    });

    if (conflict) {
      throw new ConflictException(
        `Ya existe un presupuesto para el año ${year} en esta iglesia`,
      );
    }
  }

  private toListItem(row: BudgetRow): BudgetListItemResponseDto {
    return {
      id: row.id,
      year: row.periodStart.getUTCFullYear(),
      description: row.description,
      status: row.status,
      createdAt: row.createdAt ? row.createdAt.toISOString() : null,
      createdBy: row.createdBy,
    };
  }
}
