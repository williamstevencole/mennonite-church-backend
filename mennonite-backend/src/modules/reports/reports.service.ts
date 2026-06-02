import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AvailabilityClosureResponseDto } from './dto/availability-closure.response.dto';
import { AvailabilityLiveResponseDto } from './dto/availability-live.response.dto';
import {
  ResultsSummaryResponseDto,
  ResultsSummaryRowDto,
} from './dto/results-summary.response.dto';

type CategoryTotals = {
  current: number;
  previous: number;
  budget: number;
};

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAvailabilityLive(
    idChurch: number,
    year?: number,
  ): Promise<AvailabilityLiveResponseDto> {
    const currentYear = year ?? new Date().getUTCFullYear();

    const lastClosure = await this.prisma.periodClosure.findFirst({
      where: { idChurch, year: { lt: currentYear } },
      orderBy: { year: 'desc' },
      select: { year: true, ownFunds: true, accumulatedReserve: true },
    });

    const fondosPropios = lastClosure ? Number(lastClosure.ownFunds) : 0;
    const reservaAcumulada = lastClosure
      ? Number(lastClosure.accumulatedReserve)
      : 0;
    const deltaAnio = await this.netForYear(idChurch, currentYear);

    return {
      year: currentYear,
      fondosPropios,
      reservaAcumulada,
      deltaAnio,
      disponibilidadTotal: fondosPropios + reservaAcumulada + deltaAnio,
      baseClosureYear: lastClosure?.year ?? null,
    };
  }

  async getAvailabilityAtClosure(
    idChurch: number,
    year: number,
  ): Promise<AvailabilityClosureResponseDto> {
    const closure = await this.prisma.periodClosure.findFirst({
      where: { idChurch, year },
    });

    if (!closure) {
      throw new NotFoundException(`No existe cierre para el año ${year}`);
    }

    const fondosPropios = Number(closure.ownFunds);
    const reservaAcumulada = Number(closure.accumulatedReserve);
    const total = fondosPropios + reservaAcumulada;
    const resultadoNeto = await this.netForYear(idChurch, year);

    return {
      year: closure.year,
      fondosPropios,
      reservaAcumulada,
      total,
      pctFondos: total > 0 ? round2((fondosPropios / total) * 100) : 0,
      pctReserva: total > 0 ? round2((reservaAcumulada / total) * 100) : 0,
      resultadoNeto,
      fechaCierre: closure.closureDate
        ? closure.closureDate.toISOString().slice(0, 10)
        : null,
      notas: closure.notes ?? null,
    };
  }

  async getResultsSummary(
    idChurch: number,
    year: number,
  ): Promise<ResultsSummaryResponseDto> {
    const categories = await this.prisma.transactionCategory.findMany({
      where: { idChurch, active: true },
      orderBy: [{ type: 'asc' }, { id: 'asc' }],
      select: { id: true, name: true, type: true },
    });

    const currentTotals = await this.aggregateTransactionsByCategory(
      idChurch,
      year,
    );
    const previousTotals = await this.aggregateTransactionsByCategory(
      idChurch,
      year - 1,
    );
    const budgetTotals = await this.aggregateBudgetByCategory(idChurch, year);

    const incomeRows: ResultsSummaryRowDto[] = [];
    const expenseRows: ResultsSummaryRowDto[] = [];

    for (const cat of categories) {
      const totals: CategoryTotals = {
        current: currentTotals.get(cat.id) ?? 0,
        previous: previousTotals.get(cat.id) ?? 0,
        budget: budgetTotals.get(cat.id) ?? 0,
      };
      const row = this.buildRow(
        cat.name,
        cat.type as 'income' | 'expense',
        totals,
      );
      if (cat.type === 'income') incomeRows.push(row);
      else expenseRows.push(row);
    }

    const totalIncomeRow = this.buildAggregateRow(
      'Total Ingresos',
      'total_income',
      incomeRows,
    );
    const totalExpenseRow = this.buildAggregateRow(
      'Total Egresos',
      'total_expense',
      expenseRows,
    );
    const netRow: ResultsSummaryRowDto = {
      categoria: 'Resultado',
      tipo: 'net_result',
      montoAnio: totalIncomeRow.montoAnio - totalExpenseRow.montoAnio,
      montoAnioAnterior:
        totalIncomeRow.montoAnioAnterior - totalExpenseRow.montoAnioAnterior,
      variacion: 0,
      variacionPct: 0,
      montoPresupuesto:
        totalIncomeRow.montoPresupuesto - totalExpenseRow.montoPresupuesto,
      variacionPresup: 0,
      variacionPresupPct: 0,
    };
    netRow.variacion = netRow.montoAnio - netRow.montoAnioAnterior;
    netRow.variacionPct = pctDelta(netRow.montoAnioAnterior, netRow.montoAnio);
    netRow.variacionPresup = netRow.montoAnio - netRow.montoPresupuesto;
    netRow.variacionPresupPct = pctDelta(
      netRow.montoPresupuesto,
      netRow.montoAnio,
    );

    return {
      year,
      rows: [
        ...incomeRows,
        totalIncomeRow,
        ...expenseRows,
        totalExpenseRow,
        netRow,
      ],
    };
  }

  private buildRow(
    name: string,
    type: 'income' | 'expense',
    totals: CategoryTotals,
  ): ResultsSummaryRowDto {
    return {
      categoria: name,
      tipo: type,
      montoAnio: totals.current,
      montoAnioAnterior: totals.previous,
      variacion: totals.current - totals.previous,
      variacionPct: pctDelta(totals.previous, totals.current),
      montoPresupuesto: totals.budget,
      variacionPresup: totals.current - totals.budget,
      variacionPresupPct: pctDelta(totals.budget, totals.current),
    };
  }

  private buildAggregateRow(
    label: string,
    tipo: 'total_income' | 'total_expense',
    rows: ResultsSummaryRowDto[],
  ): ResultsSummaryRowDto {
    const current = rows.reduce((s, r) => s + r.montoAnio, 0);
    const previous = rows.reduce((s, r) => s + r.montoAnioAnterior, 0);
    const budget = rows.reduce((s, r) => s + r.montoPresupuesto, 0);
    return {
      categoria: label,
      tipo,
      montoAnio: current,
      montoAnioAnterior: previous,
      variacion: current - previous,
      variacionPct: pctDelta(previous, current),
      montoPresupuesto: budget,
      variacionPresup: current - budget,
      variacionPresupPct: pctDelta(budget, current),
    };
  }

  private async aggregateTransactionsByCategory(
    idChurch: number,
    year: number,
  ): Promise<Map<number, number>> {
    const start = new Date(Date.UTC(year, 0, 1));
    const end = new Date(Date.UTC(year + 1, 0, 1));

    const grouped = await this.prisma.financialTransaction.groupBy({
      by: ['idCategory'],
      where: { idChurch, transactionDate: { gte: start, lt: end } },
      _sum: { amount: true },
    });

    return new Map(
      grouped.map((row) => [row.idCategory, Number(row._sum.amount ?? 0)]),
    );
  }

  private async aggregateBudgetByCategory(
    idChurch: number,
    year: number,
  ): Promise<Map<number, number>> {
    const start = new Date(Date.UTC(year, 0, 1));
    const end = new Date(Date.UTC(year, 11, 31));

    const budgets = await this.prisma.budget.findMany({
      where: {
        idChurch,
        periodStart: { lte: end },
        periodEnd: { gte: start },
      },
      select: { id: true },
    });

    if (budgets.length === 0) return new Map();

    const lines = await this.prisma.budgetCategory.findMany({
      where: { idBudget: { in: budgets.map((b) => b.id) } },
      select: { idCategory: true, annualAmount: true },
    });

    const map = new Map<number, number>();
    for (const line of lines) {
      map.set(
        line.idCategory,
        (map.get(line.idCategory) ?? 0) + Number(line.annualAmount),
      );
    }
    return map;
  }

  private async netForYear(idChurch: number, year: number): Promise<number> {
    const start = new Date(Date.UTC(year, 0, 1));
    const end = new Date(Date.UTC(year + 1, 0, 1));

    const grouped = await this.prisma.financialTransaction.groupBy({
      by: ['idCategory'],
      where: { idChurch, transactionDate: { gte: start, lt: end } },
      _sum: { amount: true },
    });

    if (grouped.length === 0) return 0;

    const categoryIds = grouped.map((row) => row.idCategory);
    const categories = await this.prisma.transactionCategory.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, type: true },
    });
    const typeById = new Map(categories.map((c) => [c.id, c.type]));

    let net = 0;
    for (const row of grouped) {
      const sum = Number(row._sum.amount ?? 0);
      const type = typeById.get(row.idCategory);
      net += type === 'income' ? sum : -sum;
    }
    return net;
  }
}

function pctDelta(previous: number, current: number): number {
  if (previous === 0) return 0;
  return round2(((current - previous) / previous) * 100);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
