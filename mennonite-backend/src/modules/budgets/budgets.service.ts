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
import { BudgetSummaryResponseDto } from './dto/budget-summary.response.dto';

type BudgetRow = {
  id: number;
  periodStart: Date;
  description: string | null;
  expectedIncome: Prisma.Decimal;
  expectedExpense: Prisma.Decimal;
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
        expectedIncome: dto.expectedIncome,
        expectedExpense: dto.expectedExpense,
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
          expectedIncome: true,
          expectedExpense: true,
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
        expectedIncome: true,
        expectedExpense: true,
        status: true,
        createdAt: true,
        createdBy: true,
      },
    });

    if (!budget) {
      throw new NotFoundException('Presupuesto no encontrado');
    }

    const year = budget.periodStart.getUTCFullYear();

    const [incomeAgg, expenseAgg, distributionCount] =
      await this.prisma.$transaction([
        this.prisma.budgetCategory.aggregate({
          where: { idBudget: id, category: { type: 'income' } },
          _sum: { annualAmount: true },
        }),
        this.prisma.budgetCategory.aggregate({
          where: { idBudget: id, category: { type: 'expense' } },
          _sum: { annualAmount: true },
        }),
        this.prisma.budgetDistribution.count({ where: { idBudget: id } }),
      ]);

    const totalIncome = Number(incomeAgg._sum.annualAmount ?? 0);
    const totalExpenses = Number(expenseAgg._sum.annualAmount ?? 0);

    return {
      id: budget.id,
      year,
      description: budget.description,
      expectedIncome: Number(budget.expectedIncome),
      expectedExpense: Number(budget.expectedExpense),
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
        'Un presupuesto cerrado es inmutable y no puede modificarse',
      );
    }

    const data: Prisma.BudgetUpdateInput = {};
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.expectedIncome !== undefined)
      data.expectedIncome = dto.expectedIncome;
    if (dto.expectedExpense !== undefined)
      data.expectedExpense = dto.expectedExpense;

    if (Object.keys(data).length === 0) {
      return { id: existing.id };
    }

    const updated = await this.prisma.budget.update({
      where: { id },
      data,
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
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.budget.findFirst({
        where: { id, idChurch },
        select: {
          id: true,
          status: true,
          expectedIncome: true,
          expectedExpense: true,
        },
      });

      if (!existing) {
        throw new NotFoundException('Presupuesto no encontrado');
      }

      if (existing.status !== 'Draft') {
        throw new ConflictException(
          `El presupuesto debe estar en estado Draft para activarse (estado actual: ${existing.status})`,
        );
      }

      const incomeAgg = await tx.budgetCategory.aggregate({
        where: { idBudget: id, category: { type: 'income' } },
        _sum: { annualAmount: true },
      });
      const expenseAgg = await tx.budgetCategory.aggregate({
        where: { idBudget: id, category: { type: 'expense' } },
        _sum: { annualAmount: true },
      });
      const totalIncome = Number(incomeAgg._sum.annualAmount ?? 0);
      const totalExpense = Number(expenseAgg._sum.annualAmount ?? 0);

      const expectedIncomeNum = Number(existing.expectedIncome);
      const expectedExpenseNum = Number(existing.expectedExpense);
      if (totalIncome > expectedIncomeNum + 0.001) {
        throw new BadRequestException(
          `Suma de categorías de ingreso (${totalIncome}) excede el ingreso esperado (${expectedIncomeNum})`,
        );
      }
      if (totalExpense > expectedExpenseNum + 0.001) {
        throw new BadRequestException(
          `Suma de categorías de egreso (${totalExpense}) excede el egreso esperado (${expectedExpenseNum})`,
        );
      }

      const ministeriosCategory = await tx.budgetCategory.findFirst({
        where: {
          idBudget: id,
          category: { name: 'Ministerios', type: 'expense' },
        },
        select: { annualAmount: true },
      });
      if (ministeriosCategory) {
        const distAgg = await tx.budgetDistribution.aggregate({
          where: { idBudget: id },
          _sum: { annualAmount: true },
        });
        const totalDistributions = Number(distAgg._sum.annualAmount ?? 0);
        const target = Number(ministeriosCategory.annualAmount);
        if (totalDistributions > target + 0.001) {
          throw new BadRequestException(
            `Suma de distribuciones (${totalDistributions}) excede el presupuesto de Ministerios (${target})`,
          );
        }
      }

      const updated = await tx.budget.update({
        where: { id },
        data: { status: 'Active' },
        select: { id: true },
      });

      return { id: updated.id };
    });
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

  async getSummary(
    idChurch: number,
    budgetId: number,
  ): Promise<BudgetSummaryResponseDto> {
    const budget = await this.prisma.budget.findFirst({
      where: { id: budgetId, idChurch },
      select: { id: true, expectedIncome: true, expectedExpense: true },
    });
    if (!budget) {
      throw new NotFoundException('Presupuesto no encontrado');
    }

    const [incomeAgg, expenseAgg] = await this.prisma.$transaction([
      this.prisma.budgetCategory.aggregate({
        where: { idBudget: budgetId, category: { type: 'income' } },
        _sum: { annualAmount: true },
      }),
      this.prisma.budgetCategory.aggregate({
        where: { idBudget: budgetId, category: { type: 'expense' } },
        _sum: { annualAmount: true },
      }),
    ]);

    const expectedIncome = Number(budget.expectedIncome);
    const expectedExpense = Number(budget.expectedExpense);
    const plannedIncome = Number(incomeAgg._sum.annualAmount ?? 0);
    const plannedExpense = Number(expenseAgg._sum.annualAmount ?? 0);

    return {
      expectedIncome,
      plannedIncome,
      incomeRemaining: Math.max(0, expectedIncome - plannedIncome),
      expectedExpense,
      plannedExpense,
      expenseRemaining: Math.max(0, expectedExpense - plannedExpense),
      plannedResult: expectedIncome - expectedExpense,
    };
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
      expectedIncome: Number(row.expectedIncome),
      expectedExpense: Number(row.expectedExpense),
      status: row.status,
      createdAt: row.createdAt ? row.createdAt.toISOString() : null,
      createdBy: row.createdBy,
    };
  }
}
