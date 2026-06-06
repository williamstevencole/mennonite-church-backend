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
import { CreateBudgetDistributionDto } from './dto/create-budget-distribution.dto';
import { UpdateBudgetDistributionDto } from './dto/update-budget-distribution.dto';
import { FindBudgetDistributionsQueryDto } from './dto/find-budget-distribution.dto';
import { BudgetDistributionsPageResponseDto } from './dto/budget-distributions-page.response.dto';
import { BudgetDistributionResponseDto } from './dto/budget-distribution.response.dto';
import { BudgetDistributionsSummaryResponseDto } from './dto/budget-distributions-summary.response.dto';
import { BulkReplaceBudgetDistributionsDto } from './dto/bulk-replace-budget-distributions.dto';
import { IdResponseDto } from '../../common/dto/id-response.dto';

// PRD §6.6.4: la distribución por ministerio se calcula sobre el monto
// presupuestado en la categoría de gasto "Ministerios", NO sobre el total
// del presupuesto.
const MINISTRIES_CATEGORY_NAME = 'Ministerios';

// Upper page limit for bulkReplace response; distributions per budget are
// bounded by ministry count, which is well under this threshold.
const BULK_REPLACE_RESPONSE_LIMIT = 50;

type BudgetCategoryWithName = Prisma.BudgetCategoryGetPayload<{
  select: {
    annualAmount: true;
    category: { select: { name: true; type: true } };
  };
}>;

function resolveMinistriesAmount(categories: BudgetCategoryWithName[]): number {
  const match = categories.find(
    (bc) =>
      bc.category.name === MINISTRIES_CATEGORY_NAME &&
      bc.category.type === 'expense',
  );
  return match ? Number(match.annualAmount) : 0;
}

@Injectable()
export class BudgetDistributionsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getMinisteriosBudgetAmount(budgetId: number): Promise<number> {
    const budgetCategories = await this.prisma.budgetCategory.findMany({
      where: { idBudget: budgetId },
      select: {
        annualAmount: true,
        category: { select: { name: true, type: true } },
      },
    });

    return resolveMinistriesAmount(budgetCategories);
  }

  private async assertBudgetDraft(
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

    if (budget.status !== 'Draft') {
      throw new ConflictException(
        'Solo se pueden modificar distribuciones de presupuestos en estado Draft',
      );
    }
  }

  async create(
    idChurch: number,
    createdBy: number,
    dto: CreateBudgetDistributionDto,
  ): Promise<IdResponseDto> {
    await this.assertBudgetDraft(idChurch, dto.idBudget);

    const ministry = await this.prisma.ministry.findFirst({
      where: { id: dto.idMinistry, idChurch },
      select: { id: true },
    });

    if (!ministry) {
      throw new NotFoundException('Ministerio no encontrado');
    }

    const existing = await this.prisma.budgetDistribution.findUnique({
      where: {
        idBudget_idMinistry: {
          idBudget: dto.idBudget,
          idMinistry: dto.idMinistry,
        },
      },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException(
        'Distribución ya existe para este ministerio',
      );
    }

    const target = await this.getMinisteriosBudgetAmount(dto.idBudget);

    if (target === 0) {
      throw new BadRequestException(
        'El presupuesto no tiene categoría "Ministerios" de gasto configurada',
      );
    }

    const agg = await this.prisma.budgetDistribution.aggregate({
      where: { idBudget: dto.idBudget },
      _sum: { annualAmount: true },
    });

    const currentTotal = Number(agg._sum.annualAmount ?? 0);

    if (currentTotal + dto.annualAmount > target + 0.001) {
      throw new BadRequestException(
        'El monto total de distribuciones excedería el monto de la categoría Ministerios',
      );
    }

    const created = await this.prisma.budgetDistribution.create({
      data: {
        idBudget: dto.idBudget,
        idMinistry: dto.idMinistry,
        annualAmount: dto.annualAmount,
        createdBy,
      },
      select: { id: true },
    });

    return { id: created.id };
  }

  async findByBudget(
    idChurch: number,
    budgetId: number,
    query: FindBudgetDistributionsQueryDto,
  ): Promise<BudgetDistributionsPageResponseDto> {
    const budget = await this.prisma.budget.findFirst({
      where: { id: budgetId, idChurch },
      select: { id: true },
    });

    if (!budget) {
      throw new NotFoundException('Budget no encontrado');
    }

    const ministeriosAmount = await this.getMinisteriosBudgetAmount(budgetId);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = { idBudget: budgetId };

    const [total, distributions] = await this.prisma.$transaction([
      this.prisma.budgetDistribution.count({ where }),
      this.prisma.budgetDistribution.findMany({
        where,
        include: {
          ministry: {
            select: { id: true, name: true },
          },
        },
        orderBy: { id: 'asc' },
        ...buildPagination(page, limit),
      }),
    ]);

    const data = distributions.map((d) => {
      const annualAmount = Number(d.annualAmount);
      return {
        id: d.id,
        ministry: d.ministry,
        annualAmount,
        percentageOfMinisteriosBudget:
          ministeriosAmount > 0
            ? Number(((annualAmount / ministeriosAmount) * 100).toFixed(2))
            : 0,
      };
    });

    return toPaginated(data, total, page, limit);
  }

  async findOne(
    idChurch: number,
    id: number,
  ): Promise<BudgetDistributionResponseDto> {
    const distribution = await this.prisma.budgetDistribution.findFirst({
      where: { id, budget: { idChurch } },
      include: {
        ministry: {
          select: { id: true, name: true },
        },
        budget: {
          include: {
            budgetCategories: {
              select: {
                annualAmount: true,
                category: { select: { name: true, type: true } },
              },
            },
          },
        },
      },
    });

    if (!distribution) {
      throw new NotFoundException('Budget distribution no fue encontrado');
    }

    const ministeriosAmount = resolveMinistriesAmount(
      distribution.budget.budgetCategories,
    );

    const annualAmount = Number(distribution.annualAmount);

    return {
      id: distribution.id,
      ministry: distribution.ministry,
      annualAmount,
      percentageOfMinisteriosBudget:
        ministeriosAmount > 0
          ? Number(((annualAmount / ministeriosAmount) * 100).toFixed(2))
          : 0,
    };
  }

  async update(
    idChurch: number,
    id: number,
    dto: UpdateBudgetDistributionDto,
  ): Promise<IdResponseDto> {
    const distribution = await this.prisma.budgetDistribution.findFirst({
      where: { id, budget: { idChurch } },
      select: { id: true, idBudget: true },
    });

    if (!distribution) {
      throw new NotFoundException('Budget distribution no fue encontrado');
    }

    await this.assertBudgetDraft(idChurch, distribution.idBudget);

    if (dto.annualAmount === undefined) {
      return { id };
    }

    const agg = await this.prisma.budgetDistribution.aggregate({
      where: { idBudget: distribution.idBudget, id: { not: id } },
      _sum: { annualAmount: true },
    });

    const otherSum = Number(agg._sum.annualAmount ?? 0);
    const target = await this.getMinisteriosBudgetAmount(distribution.idBudget);

    if (otherSum + dto.annualAmount > target + 0.001) {
      throw new BadRequestException(
        'El monto total de distribuciones excedería el monto de la categoría Ministerios',
      );
    }

    const updated = await this.prisma.budgetDistribution.update({
      where: { id },
      data: { annualAmount: dto.annualAmount },
      select: { id: true },
    });

    return { id: updated.id };
  }

  async remove(idChurch: number, id: number): Promise<void> {
    const distribution = await this.prisma.budgetDistribution.findFirst({
      where: { id, budget: { idChurch } },
      select: { id: true, idBudget: true },
    });

    if (!distribution) {
      throw new NotFoundException('Budget distribution no fue encontrado');
    }

    await this.assertBudgetDraft(idChurch, distribution.idBudget);

    await this.prisma.budgetDistribution.delete({ where: { id } });
  }

  async getSummary(
    idChurch: number,
    budgetId: number,
  ): Promise<BudgetDistributionsSummaryResponseDto> {
    const budget = await this.prisma.budget.findFirst({
      where: { id: budgetId, idChurch },
      select: { id: true },
    });

    if (!budget) {
      throw new NotFoundException('Budget no encontrado');
    }

    const target = await this.getMinisteriosBudgetAmount(budgetId);

    const agg = await this.prisma.budgetDistribution.aggregate({
      where: { idBudget: budgetId },
      _sum: { annualAmount: true },
    });

    const total = Number(agg._sum.annualAmount ?? 0);
    const remaining = Math.max(0, target - total);
    const isComplete = target > 0 && Math.abs(total - target) < 0.01;

    return { targetAmount: target, total, remaining, isComplete };
  }

  async bulkReplace(
    idChurch: number,
    createdBy: number,
    budgetId: number,
    dto: BulkReplaceBudgetDistributionsDto,
  ): Promise<BudgetDistributionsPageResponseDto> {
    await this.assertBudgetDraft(idChurch, budgetId);

    const ministryIds = dto.items.map((i) => i.idMinistry);
    const uniqueIds = new Set(ministryIds);

    if (uniqueIds.size !== ministryIds.length) {
      throw new BadRequestException('La lista contiene ministerios duplicados');
    }

    const foundMinistries = await this.prisma.ministry.count({
      where: { id: { in: ministryIds }, idChurch },
    });

    if (foundMinistries !== ministryIds.length) {
      throw new BadRequestException('Uno o más ministerio(s) no encontrado(s)');
    }

    const target = await this.getMinisteriosBudgetAmount(budgetId);

    if (target === 0) {
      throw new BadRequestException(
        'El presupuesto no tiene categoría "Ministerios" de gasto configurada',
      );
    }

    const sum = dto.items.reduce((acc, i) => acc + i.annualAmount, 0);

    if (sum > target + 0.001) {
      throw new BadRequestException(
        'La suma de montos excedería el monto de la categoría Ministerios',
      );
    }

    await this.prisma.$transaction([
      this.prisma.budgetDistribution.deleteMany({
        where: { idBudget: budgetId },
      }),
      this.prisma.budgetDistribution.createMany({
        data: dto.items.map((i) => ({
          idBudget: budgetId,
          idMinistry: i.idMinistry,
          annualAmount: i.annualAmount,
          createdBy,
        })),
      }),
    ]);

    return this.findByBudget(idChurch, budgetId, {
      page: 1,
      limit: BULK_REPLACE_RESPONSE_LIMIT,
    });
  }
}
