import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateBudgetDistributionDto } from './dto/create-budget-distribution.dto';
import type { JwtPayload } from 'src/auth/strategies/jwt.strategy';

@Injectable()
export class BudgetDistributionService {
  constructor(private readonly prisma: PrismaService) {}

  private async getChurchId(user: JwtPayload): Promise<number> {
    const userRecord = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: { idChurch: true },
    });

    if (!userRecord?.idChurch) {
      throw new BadRequestException('User not recognized');
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
      throw new NotFoundException('Budget not found');
    }

    const ministry = await this.prisma.ministry.findFirst({
      where: {
        id: dto.idMinistry,
        idChurch,
      },
    });

    if (!ministry) {
      throw new NotFoundException('Ministry not found');
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
      throw new ConflictException('Distribution already exists');
    }

    const agg = await this.prisma.budgetDistribution.aggregate({
      where: { idBudget: dto.idBudget },
      _sum: { percentage: true },
    });

    const currentTotal = Number(agg._sum.percentage ?? 0);
    const newTotal = currentTotal + Number(dto.percentage);

    if (newTotal > 100) {
      throw new BadRequestException(
        `Total percentage cannot exceed 100% (current: ${currentTotal}%)`,
      );
    }

    // 5. Create ONLY what exists in DB
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
}
