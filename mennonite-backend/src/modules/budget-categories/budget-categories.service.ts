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

  async create(
    user: JwtPayload,
    dto: CreateBudgetCategoryDto,
  ): Promise<IdResponseDto> {
    const idChurch = user.idChurch;

    const budget = await this.prisma.budget.findFirst({
      where: { id: dto.idBudget, idChurch },
      select: { id: true },
    });

    if (!budget) {
      throw new NotFoundException('Budget no encontrado');
    }

    const category = await this.prisma.transactionCategory.findFirst({
      where: { id: dto.idCategory, idChurch },
      select: { id: true },
    });

    if (!category) {
      throw new NotFoundException('Categoria no encontrada');
    }

    const existing = await this.prisma.budgetCategory.findUnique({
      where: {
        idBudget_idCategory: {
          idBudget: dto.idBudget,
          idCategory: dto.idCategory,
        },
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

  async findAll(
    user: JwtPayload,
    query: FindBudgetCategoriesQueryDto,
  ): Promise<BudgetCategoriesPageResponseDto> {
    const idChurch = user.idChurch;
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const budget = await this.prisma.budget.findFirst({
      where: { id: query.budgetId, idChurch },
      select: { id: true },
    });

    if (!budget) {
      throw new NotFoundException('Budget no encontrado');
    }

    const where: Prisma.BudgetCategoryWhereInput = {
      idBudget: query.budgetId,
    };

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
      items.map((item) => this.toResponse(item)),
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
      where: { id, budget: { idChurch: user.idChurch } },
      include: {
        category: {
          select: { id: true, name: true, type: true },
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Categoria de presupuesto no encontrada');
    }

    return this.toResponse(item);
  }

  async update(
    user: JwtPayload,
    id: number,
    dto: UpdateBudgetCategoryDto,
  ): Promise<IdResponseDto> {
    const existing = await this.prisma.budgetCategory.findFirst({
      where: { id, budget: { idChurch: user.idChurch } },
      select: { id: true, annualAmount: true, notes: true },
    });

    if (!existing) {
      throw new NotFoundException('Categoria de presupuesto no encontrada');
    }

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
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Categoria de presupuesto no encontrada');
    }

    await this.prisma.budgetCategory.delete({ where: { id } });
  }

  private toResponse(
    entity: BudgetCategoryWithCategory,
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
      notes: entity.notes ?? null,
    };
  }
}
