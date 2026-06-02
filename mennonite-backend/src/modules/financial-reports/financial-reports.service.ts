import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FinancialReport, Ministry, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  buildPagination,
  toPaginated,
} from '../../common/pagination/paginate.util';
import { IdResponseDto } from '../../common/dto/id-response.dto';
import { CreateFinancialReportDto } from './dto/create-financial-report.dto';
import { FinancialReportResponseDto } from './dto/financial-report.response.dto';
import { FinancialReportsPageResponseDto } from './dto/financial-reports-page.response.dto';
import { ListFinancialReportsQueryDto } from './dto/list-financial-reports-query.dto';
import {
  FinancialReportStatus,
  UpdateFinancialReportDto,
} from './dto/update-financial-report.dto';

const ALLOWED_TRANSITIONS: Record<string, FinancialReportStatus[]> = {
  Draft: [FinancialReportStatus.PRESENTED],
  Presented: [FinancialReportStatus.APPROVED],
  Approved: [],
};

type FinancialReportWithMinistry = FinancialReport & {
  ministry: Pick<Ministry, 'id' | 'name'> | null;
};

@Injectable()
export class FinancialReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    idChurch: number,
    createdBy: number,
    dto: CreateFinancialReportDto,
  ): Promise<IdResponseDto> {
    const periodStart = new Date(dto.periodStart);
    const periodEnd = new Date(dto.periodEnd);
    if (periodEnd < periodStart) {
      throw new BadRequestException(
        'periodEnd debe ser mayor o igual a periodStart',
      );
    }

    if (dto.idMinistry !== undefined) {
      await this.assertMinistryInChurch(idChurch, dto.idMinistry);
    }

    const totalIncome = dto.totalIncome ?? 0;
    const totalExpenses = dto.totalExpenses ?? 0;

    const created = await this.prisma.financialReport.create({
      data: {
        idChurch,
        idMinistry: dto.idMinistry,
        reportType: dto.reportType,
        periodStart,
        periodEnd,
        title: dto.title,
        summary: dto.summary,
        totalIncome: new Prisma.Decimal(totalIncome),
        totalExpenses: new Prisma.Decimal(totalExpenses),
        netResult: new Prisma.Decimal(totalIncome - totalExpenses),
        status: 'Draft',
        createdBy,
      },
      select: { id: true },
    });

    return { id: created.id };
  }

  async findAll(
    idChurch: number,
    query: ListFinancialReportsQueryDto,
  ): Promise<FinancialReportsPageResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.FinancialReportWhereInput = { idChurch };
    if (query.idMinistry !== undefined) where.idMinistry = query.idMinistry;
    if (query.status !== undefined) where.status = query.status;
    if (query.year !== undefined) {
      const start = new Date(Date.UTC(query.year, 0, 1));
      const end = new Date(Date.UTC(query.year + 1, 0, 1));
      where.periodStart = { gte: start, lt: end };
    }

    const [total, items] = await this.prisma.$transaction([
      this.prisma.financialReport.count({ where }),
      this.prisma.financialReport.findMany({
        where,
        orderBy: [{ periodStart: 'desc' }, { id: 'desc' }],
        ...buildPagination(page, limit),
        include: {
          ministry: { select: { id: true, name: true } },
        },
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
    idChurch: number,
    id: number,
  ): Promise<FinancialReportResponseDto> {
    const report = await this.prisma.financialReport.findFirst({
      where: { id, idChurch },
      include: { ministry: { select: { id: true, name: true } } },
    });

    if (!report) {
      throw new NotFoundException();
    }

    return this.toResponse(report);
  }

  async update(
    idChurch: number,
    userId: number,
    id: number,
    dto: UpdateFinancialReportDto,
  ): Promise<IdResponseDto> {
    const existing = await this.prisma.financialReport.findFirst({
      where: { id, idChurch },
    });

    if (!existing) {
      throw new NotFoundException();
    }

    if (existing.status === 'Approved') {
      throw new ConflictException(
        'Reporte aprobado: no se puede modificar (snapshot inmutable)',
      );
    }

    if (
      dto.idMinistry !== undefined &&
      dto.idMinistry !== existing.idMinistry
    ) {
      await this.assertMinistryInChurch(idChurch, dto.idMinistry);
    }

    const periodStart =
      dto.periodStart !== undefined ? new Date(dto.periodStart) : null;
    const periodEnd =
      dto.periodEnd !== undefined ? new Date(dto.periodEnd) : null;

    const nextStart = periodStart ?? existing.periodStart;
    const nextEnd = periodEnd ?? existing.periodEnd;
    if (nextEnd < nextStart) {
      throw new BadRequestException(
        'periodEnd debe ser mayor o igual a periodStart',
      );
    }

    const totalIncome =
      dto.totalIncome !== undefined
        ? dto.totalIncome
        : Number(existing.totalIncome);
    const totalExpenses =
      dto.totalExpenses !== undefined
        ? dto.totalExpenses
        : Number(existing.totalExpenses);

    const statusChange = dto.status;
    if (
      statusChange &&
      statusChange !== (existing.status as FinancialReportStatus)
    ) {
      const allowed = ALLOWED_TRANSITIONS[existing.status] ?? [];
      if (!allowed.includes(statusChange)) {
        throw new BadRequestException(
          `Transición de estado inválida: ${existing.status} → ${statusChange}`,
        );
      }
    }

    const data: Prisma.FinancialReportUpdateInput = {
      reportType: dto.reportType,
      title: dto.title,
      summary: dto.summary,
      totalIncome: new Prisma.Decimal(totalIncome),
      totalExpenses: new Prisma.Decimal(totalExpenses),
      netResult: new Prisma.Decimal(totalIncome - totalExpenses),
    };

    if (periodStart) data.periodStart = periodStart;
    if (periodEnd) data.periodEnd = periodEnd;
    if (dto.idMinistry !== undefined) {
      data.ministry = { connect: { id: dto.idMinistry } };
    }

    if (statusChange === FinancialReportStatus.PRESENTED) {
      data.status = 'Presented';
      data.presentedAt = new Date();
      data.presentedByUser = { connect: { id: userId } };
    } else if (statusChange === FinancialReportStatus.APPROVED) {
      data.status = 'Approved';
      data.approvedAt = new Date();
      data.approvedByUser = { connect: { id: userId } };
    }

    const updated = await this.prisma.financialReport.update({
      where: { id },
      data,
      select: { id: true },
    });

    return { id: updated.id };
  }

  async remove(idChurch: number, id: number): Promise<void> {
    const existing = await this.prisma.financialReport.findFirst({
      where: { id, idChurch },
      select: { id: true, status: true },
    });

    if (!existing) {
      throw new NotFoundException();
    }

    if (existing.status === 'Approved') {
      throw new ConflictException(
        'Reporte aprobado: no se puede eliminar (snapshot histórico)',
      );
    }

    await this.prisma.financialReport.delete({ where: { id } });
  }

  private async assertMinistryInChurch(
    idChurch: number,
    idMinistry: number,
  ): Promise<void> {
    const ministry = await this.prisma.ministry.findFirst({
      where: { id: idMinistry, idChurch },
      select: { id: true },
    });

    if (!ministry) {
      throw new NotFoundException();
    }
  }

  private toResponse(
    entity: FinancialReportWithMinistry,
  ): FinancialReportResponseDto {
    return {
      id: entity.id,
      ministry: entity.ministry
        ? { id: entity.ministry.id, name: entity.ministry.name }
        : null,
      reportType: entity.reportType,
      periodStart: entity.periodStart.toISOString().slice(0, 10),
      periodEnd: entity.periodEnd.toISOString().slice(0, 10),
      title: entity.title,
      summary: entity.summary ?? null,
      totalIncome: Number(entity.totalIncome),
      totalExpenses: Number(entity.totalExpenses),
      netResult: Number(entity.netResult),
      status: entity.status,
      presentedAt: entity.presentedAt ? entity.presentedAt.toISOString() : null,
      approvedAt: entity.approvedAt ? entity.approvedAt.toISOString() : null,
      createdAt: entity.createdAt ? entity.createdAt.toISOString() : null,
    };
  }
}
