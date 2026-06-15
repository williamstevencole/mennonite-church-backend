import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import { IdResponseDto } from '../../common/dto/id-response.dto';
import {
  buildPagination,
  toPaginated,
} from '../../common/pagination/paginate.util';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionCategoryType } from '../transaction-categories/transaction-category-type.enum';
import { BudgetCategoryResponseDto } from './dto/budget-category.response.dto';
import { BudgetCategoriesPageResponseDto } from './dto/budget-categories-page.response.dto';
import { CreateBudgetCategoryDto } from './dto/create-budget-category.dto';
import { FindBudgetCategoriesQueryDto } from './dto/find-budget-categories-query.dto';
import { UpdateBudgetCategoryDto } from './dto/update-budget-category.dto';

type BudgetCategoryWithCategory = Prisma.BudgetCategoryGetPayload<{
  include: {
    category: {
      select: {
        id: true;
        name: true;
        type: true;
      };
    };
  };
}>;

@Injectable()
export class BudgetCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertBudgetEditable(
    idChurch: number,
    budgetId: number,
  ): Promise<void> {
    const budget = await this.prisma.budget.findFirst({
      where: { id: budgetId, idChurch },
      select: { status: true },
    });

    if (!budget) {
      throw new NotFoundException('Budget no encontrado');
    }

    if (budget.status === 'Closed') {
      throw new ConflictException(
        'No se pueden modificar categorías de un presupuesto cerrado (inmutable)',
      );
    }
  }

  async create(
    user: JwtPayload,
    dto: CreateBudgetCategoryDto,
  ): Promise<IdResponseDto> {
    const idChurch = user.idChurch;

    await this.assertBudgetEditable(idChurch, dto.idBudget);

    const category = await this.prisma.transactionCategory.findFirst({
      where: { id: dto.idCategory, idChurch },
      select: { id: true },
    });

    if (!category) {
      throw new NotFoundException('Categoria no encontrada');
    }

    const existing = await this.prisma.budgetCategory.findFirst({
      where: {
        idBudget: dto.idBudget,
        idCategory: dto.idCategory,
      },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException('Categoria ya asignada al presupuesto');
    }

    const created = await this.prisma.budgetCategory.create({
      data: {
        idBudget: dto.idBudget,
        idCategory: dto.idCategory,
        annualAmount: dto.annualAmount,
        notes: dto.notes ?? null,
      },
      select: { id: true },
    });

    return { id: created.id };
  }

  async findByBudget(
    idChurch: number,
    budgetId: number,
    query: FindBudgetCategoriesQueryDto,
  ): Promise<BudgetCategoriesPageResponseDto> {
    const budget = await this.prisma.budget.findFirst({
      where: { id: budgetId, idChurch },
      select: { id: true },
    });

    if (!budget) {
      throw new NotFoundException('Budget no encontrado');
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.BudgetCategoryWhereInput = {
      idBudget: budgetId,
      active: true,
      ...(query.type ? { category: { is: { type: query.type } } } : {}),
    };

    const [incomeSumAgg, expenseSumAgg] = await Promise.all([
      this.prisma.budgetCategory.aggregate({
        where: {
          idBudget: budgetId,
          active: true,
          category: { type: 'income' },
        },
        _sum: { annualAmount: true },
      }),
      this.prisma.budgetCategory.aggregate({
        where: {
          idBudget: budgetId,
          active: true,
          category: { type: 'expense' },
        },
        _sum: { annualAmount: true },
      }),
    ]);

    const incomeSum = Number(incomeSumAgg._sum.annualAmount ?? 0);
    const expenseSum = Number(expenseSumAgg._sum.annualAmount ?? 0);

    const [total, items] = await this.prisma.$transaction([
      this.prisma.budgetCategory.count({ where }),
      this.prisma.budgetCategory.findMany({
        where,
        include: {
          category: {
            select: { id: true, name: true, type: true },
          },
        },
        orderBy: [{ category: { name: 'asc' } }, { id: 'asc' }],
        ...buildPagination(page, limit),
      }),
    ]);

    return toPaginated(
      items.map((item) => {
        const bucketSum =
          item.category.type === 'income' ? incomeSum : expenseSum;
        const percentageOfBucket =
          bucketSum > 0
            ? Number(((Number(item.annualAmount) / bucketSum) * 100).toFixed(2))
            : 0;
        return this.toResponse(item, percentageOfBucket);
      }),
      total,
      page,
      limit,
    );
  }

  async findOne(
    user: JwtPayload,
    id: number,
  ): Promise<BudgetCategoryResponseDto> {
    const item = await this.prisma.budgetCategory.findFirst({
      where: { id, active: true, budget: { idChurch: user.idChurch } },
      include: {
        category: {
          select: { id: true, name: true, type: true },
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Categoria de presupuesto no encontrada');
    }

    const bucketSumAgg = await this.prisma.budgetCategory.aggregate({
      where: {
        idBudget: item.idBudget,
        active: true,
        category: { type: item.category.type },
      },
      _sum: { annualAmount: true },
    });

    const bucketSum = Number(bucketSumAgg._sum.annualAmount ?? 0);
    const percentageOfBucket =
      bucketSum > 0
        ? Number(((Number(item.annualAmount) / bucketSum) * 100).toFixed(2))
        : 0;

    return this.toResponse(item, percentageOfBucket);
  }

  async update(
    user: JwtPayload,
    id: number,
    dto: UpdateBudgetCategoryDto,
  ): Promise<IdResponseDto> {
    const existing = await this.prisma.budgetCategory.findFirst({
      where: { id, active: true, budget: { idChurch: user.idChurch } },
      select: { id: true, idBudget: true, annualAmount: true, notes: true },
    });

    if (!existing) {
      throw new NotFoundException('Categoria de presupuesto no encontrada');
    }

    await this.assertBudgetEditable(user.idChurch, existing.idBudget);

    if (dto.annualAmount === undefined && dto.notes === undefined) {
      return { id: existing.id };
    }

    const updated = await this.prisma.budgetCategory.update({
      where: { id },
      data: {
        annualAmount: dto.annualAmount ?? existing.annualAmount,
        notes: dto.notes ?? existing.notes,
      },
      select: { id: true },
    });

    return { id: updated.id };
  }

  async remove(user: JwtPayload, id: number): Promise<void> {
    const existing = await this.prisma.budgetCategory.findFirst({
      where: { id, budget: { idChurch: user.idChurch } },
      select: { id: true, idBudget: true, active: true },
    });

    if (!existing) {
      throw new NotFoundException('Categoria de presupuesto no encontrada');
    }

    if (!existing.active) {
      return;
    }

    await this.assertBudgetEditable(user.idChurch, existing.idBudget);

    await this.prisma.budgetCategory.update({
      where: { id },
      data: { active: false },
    });
  }

  private toResponse(
    entity: BudgetCategoryWithCategory,
    percentageOfBucket: number,
  ): BudgetCategoryResponseDto {
    return {
      id: entity.id,
      budgetId: entity.idBudget,
      category: {
        id: entity.category.id,
        name: entity.category.name,
        type: entity.category.type as TransactionCategoryType,
      },
      annualAmount: Number(entity.annualAmount),
      percentageOfBucket,
      notes: entity.notes ?? null,
    };
  }
}
