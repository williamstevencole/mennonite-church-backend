import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ReportsService } from '../reports/reports.service';
import { DashboardCashflowResponseDto } from './dto/dashboard-cashflow.response.dto';
import { DashboardKpisResponseDto } from './dto/dashboard-kpis.response.dto';

const MONTH_NAMES = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
];

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reportsService: ReportsService,
  ) {}

  async getCashflow(
    idChurch: number,
    months: number,
  ): Promise<DashboardCashflowResponseDto> {
    if (![3, 6, 12].includes(months)) {
      throw new BadRequestException('months debe ser 3, 6 o 12');
    }

    const now = new Date();
    const startYear = now.getFullYear();
    const startMonth = now.getMonth() - (months - 1);
    const from = new Date(startYear, startMonth, 1);

    type Row = { month: Date; type: string; total: number };
    const rows = await this.prisma.$queryRaw<Row[]>(Prisma.sql`
      SELECT date_trunc('month', ft.transaction_date)::date AS month,
             tc.type,
             SUM(ft.amount)::float AS total
      FROM financial_transaction ft
      JOIN transaction_category tc ON tc.id = ft.id_category
      WHERE ft.id_church = ${idChurch}
        AND ft.active = true
        AND tc.active = true
        AND ft.transaction_date >= ${from}
      GROUP BY 1, 2
      ORDER BY 1 ASC
    `);

    const points: { name: string; income: number; expense: number }[] = [];
    for (let i = 0; i < months; i++) {
      const d = new Date(startYear, startMonth + i, 1);
      const y = d.getFullYear();
      const m = d.getMonth();
      const monthRows = rows.filter((r) => {
        const rd = new Date(r.month); // pg date → UTC midnight
        return rd.getUTCFullYear() === y && rd.getUTCMonth() === m;
      });
      const income = monthRows
        .filter((r) => r.type === 'income')
        .reduce((s, r) => s + r.total, 0);
      const expense = monthRows
        .filter((r) => r.type === 'expense')
        .reduce((s, r) => s + r.total, 0);
      points.push({ name: MONTH_NAMES[d.getMonth()], income, expense });
    }

    return { points };
  }

  async getKpis(idChurch: number): Promise<DashboardKpisResponseDto> {
    const [membersActive, inventoryItems, ministriesActive, availability] =
      await Promise.all([
        this.prisma.member.count({ where: { idChurch, active: true } }),
        this.prisma.article.count({ where: { idChurch, active: true } }),
        this.prisma.ministry.count({ where: { idChurch, active: true } }),
        this.reportsService.getAvailabilityLive(idChurch),
      ]);

    return {
      membersActive,
      currentBalance: availability.disponibilidadTotal,
      inventoryItems,
      ministriesActive,
    };
  }
}
