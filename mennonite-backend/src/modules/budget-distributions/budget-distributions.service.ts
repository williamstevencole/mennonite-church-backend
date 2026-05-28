import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBudgetDistributionDto } from './dto/create-budget-distribution.dto';
import type { JwtPayload } from 'src/auth/strategies/jwt.strategy';
import { FindBudgetDistributionsQueryDto } from './dto/find-budget-distribution.dto';
import { UpdateBudgetDistributionDto } from './dto/update-budget-distribution.dto';

@Injectable()
export class BudgetDistributionsService {
  constructor(private readonly prisma: PrismaService) {}

  private async getChurchId(user: JwtPayload): Promise<number> {
    const userRecord = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: { idChurch: true },
    });

    if (!userRecord?.idChurch) {
      throw new BadRequestException('Usuario no reconocido');
    }

    return userRecord.idChurch;
  }

  async create(dto: CreateBudgetDistributionDto, user: JwtPayload) {
    const idChurch = await this.getChurchId(user);

    const budget = await this.prisma.budget.findFirst({
      where: {
        id: dto.idBudget,
        idChurch,
      },
    });

    if (!budget) {
      throw new NotFoundException('Budget no encontrado');
    }

    const ministry = await this.prisma.ministry.findFirst({
      where: {
        id: dto.idMinistry,
        idChurch,
      },
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
    });

    if (existing) {
      throw new ConflictException('Distribucion ya existe.');
    }

    const agg = await this.prisma.budgetDistribution.aggregate({
      where: { idBudget: dto.idBudget },
      _sum: { percentage: true },
    });

    const currentTotal = Number(agg._sum.percentage ?? 0);
    const newTotal = currentTotal + Number(dto.percentage);

    if (newTotal > 100) {
      throw new BadRequestException(
        'Porcentaje total no se puede exceder del 100%',
      );
    }

    const created = await this.prisma.budgetDistribution.create({
      data: {
        idBudget: dto.idBudget,
        idMinistry: dto.idMinistry,
        percentage: dto.percentage,
        createdBy: user.sub,
      },
    });

    return {
      id: created.id,
    };
  }

  async findAll(query: FindBudgetDistributionsQueryDto, user: JwtPayload) {
    const idChurch = await this.getChurchId(user);

    const budget = await this.prisma.budget.findFirst({
      where: {
        id: query.budgetId,
        idChurch,
      },
      include: {
        budgetCategories: {
          select: {
            annualAmount: true,
          },
        },
      },
    });

    if (!budget) {
      throw new NotFoundException('Budget no fue encontrado');
    }

    const totalBudget = budget.budgetCategories.reduce(
      (sum, category) => sum + Number(category.annualAmount),
      0,
    );

    const distributions = await this.prisma.budgetDistribution.findMany({
      where: {
        idBudget: query.budgetId,
      },
      include: {
        ministry: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return distributions.map((distribution) => {
      const percentage = Number(distribution.percentage);

      return {
        id: distribution.id,
        ministry: distribution.ministry,
        percentage,
        allocatedAmount: Number(((totalBudget * percentage) / 100).toFixed(2)),
      };
    });
  }

  async findOne(id: number, user: JwtPayload) {
    const idChurch = await this.getChurchId(user);

    const distribution = await this.prisma.budgetDistribution.findFirst({
      where: { id },
      include: {
        ministry: {
          select: {
            id: true,
            name: true,
          },
        },
        budget: {
          include: {
            budgetCategories: {
              select: {
                annualAmount: true,
              },
            },
          },
        },
      },
    });

    if (!distribution) {
      throw new NotFoundException('Budget distribution no fue encontrado');
    }

    if (distribution.budget.idChurch !== idChurch) {
      throw new NotFoundException(
        'Budget distribution no pertenece a esta iglesia',
      );
    }

    const totalBudget = distribution.budget.budgetCategories.reduce(
      (sum, c) => sum + Number(c.annualAmount),
      0,
    );

    const percentage = Number(distribution.percentage);

    return {
      id: distribution.id,
      ministry: distribution.ministry,
      percentage,
      allocatedAmount: Number(((totalBudget * percentage) / 100).toFixed(2)),
    };
  }

  async update(id: number, dto: UpdateBudgetDistributionDto, user: JwtPayload) {
    const idChurch = await this.getChurchId(user);

    const distribution = await this.prisma.budgetDistribution.findFirst({
      where: {
        id,
        budget: {
          idChurch,
        },
      },
      include: {
        budget: true,
      },
    });

    if (!distribution) {
      throw new NotFoundException('Budget distribution no fue encontrado');
    }

    const newPercentage = dto.percentage ?? Number(distribution.percentage);

    const others = await this.prisma.budgetDistribution.findMany({
      where: {
        idBudget: distribution.idBudget,
        id: {
          not: id,
        },
      },
    });

    const currentTotalOthers = others.reduce(
      (sum, d) => sum + Number(d.percentage),
      0,
    );

    const newTotal = currentTotalOthers + newPercentage;

    if (newTotal > 100) {
      throw new BadRequestException(
        'La suma total de porcentajes no puede exceder 100%',
      );
    }

    const updated = await this.prisma.budgetDistribution.update({
      where: { id },
      data: {
        percentage: dto.percentage ?? distribution.percentage,
      },
      include: {
        ministry: true,
        budget: {
          include: {
            budgetCategories: {
              select: {
                annualAmount: true,
              },
            },
          },
        },
      },
    });

    const totalBudget = updated.budget.budgetCategories.reduce(
      (sum, c) => sum + Number(c.annualAmount),
      0,
    );

    const percentage = Number(updated.percentage);

    return {
      id: updated.id,
      ministry: updated.ministry,
      percentage,
      allocatedAmount: Number(((totalBudget * percentage) / 100).toFixed(2)),
    };
  }

  async remove(id: number, user: JwtPayload) {
    const idChurch = await this.getChurchId(user);

    const distribution = await this.prisma.budgetDistribution.findFirst({
      where: {
        id,
        budget: {
          idChurch,
        },
      },
      include: {
        budget: true,
      },
    });

    if (!distribution) {
      throw new NotFoundException('Budget distribution no fue encontrado');
    }

    if (distribution.budget.status === 'Active') {
      throw new BadRequestException(
        'No se puede eliminar una distribución de un budget activo',
      );
    }

    const others = await this.prisma.budgetDistribution.findMany({
      where: {
        idBudget: distribution.idBudget,
        id: {
          not: id,
        },
      },
    });

    const remainingTotal = others.reduce(
      (sum, d) => sum + Number(d.percentage),
      0,
    );

    if (remainingTotal > 100) {
      throw new BadRequestException(
        'La distribución restante excede 100% después del borrado',
      );
    }

    await this.prisma.budgetDistribution.delete({
      where: { id },
    });
  }
}
