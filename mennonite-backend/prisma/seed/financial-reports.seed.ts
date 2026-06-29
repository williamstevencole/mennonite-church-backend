import { PrismaClient } from '@prisma/client';

import { loadAdminUser, loadChurch, runSeed } from './_bootstrap';

const CURRENT_YEAR = new Date().getFullYear();

type ReportStatus = 'Draft' | 'Presented' | 'Approved';

type ReportSeed = {
  ministryName: string;
  year: number;
  status: ReportStatus;
  reportType: 'annual' | 'quarterly' | 'monthly';
  totalIncome: number;
  totalExpenses: number;
  observacion?: string;
};

const REPORTS: ReportSeed[] = [
  // Año pasado: la mayoría aprobados (rendición de cuentas cerrada).
  {
    ministryName: 'Alabanza y Adoración',
    year: CURRENT_YEAR - 1,
    status: 'Approved',
    reportType: 'annual',
    totalIncome: 38_000,
    totalExpenses: 32_500,
  },
  {
    ministryName: 'Jóvenes',
    year: CURRENT_YEAR - 1,
    status: 'Approved',
    reportType: 'annual',
    totalIncome: 52_000,
    totalExpenses: 48_000,
  },
  {
    ministryName: 'Escuela Dominical',
    year: CURRENT_YEAR - 1,
    status: 'Approved',
    reportType: 'annual',
    totalIncome: 22_000,
    totalExpenses: 19_500,
  },
  {
    ministryName: 'Damas',
    year: CURRENT_YEAR - 1,
    status: 'Approved',
    reportType: 'annual',
    totalIncome: 18_000,
    totalExpenses: 14_200,
  },
  {
    ministryName: 'Misiones',
    year: CURRENT_YEAR - 1,
    status: 'Approved',
    reportType: 'annual',
    totalIncome: 41_000,
    totalExpenses: 37_500,
  },
  // Año actual: mezcla de pendientes (Presented), borradores y un par aprobados.
  {
    ministryName: 'Alabanza y Adoración',
    year: CURRENT_YEAR,
    status: 'Presented',
    reportType: 'quarterly',
    totalIncome: 12_500,
    totalExpenses: 9_800,
  },
  {
    ministryName: 'Jóvenes',
    year: CURRENT_YEAR,
    status: 'Presented',
    reportType: 'quarterly',
    totalIncome: 24_000,
    totalExpenses: 21_500,
  },
  {
    ministryName: 'Escuela Dominical',
    year: CURRENT_YEAR,
    status: 'Presented',
    reportType: 'quarterly',
    totalIncome: 9_500,
    totalExpenses: 7_800,
  },
  {
    ministryName: 'Caballeros',
    year: CURRENT_YEAR,
    status: 'Draft',
    reportType: 'quarterly',
    totalIncome: 6_200,
    totalExpenses: 5_400,
  },
  {
    ministryName: 'Damas',
    year: CURRENT_YEAR,
    status: 'Draft',
    reportType: 'quarterly',
    totalIncome: 8_400,
    totalExpenses: 7_100,
    observacion:
      'Faltan dos transacciones del mes de marzo en el detalle. Por favor agregalas y vuelve a enviar.',
  },
  {
    ministryName: 'Ujieres',
    year: CURRENT_YEAR,
    status: 'Approved',
    reportType: 'monthly',
    totalIncome: 2_400,
    totalExpenses: 1_950,
  },
];

export async function seedFinancialReports(
  prisma: PrismaClient,
  idChurch: number,
  createdBy: number,
): Promise<number> {
  const ministries = await prisma.ministry.findMany({ where: { idChurch } });
  const ministryByName = new Map(ministries.map((m) => [m.name, m]));

  let count = 0;
  for (const r of REPORTS) {
    const ministry = ministryByName.get(r.ministryName);
    if (!ministry) {
      throw new Error(
        `Seed financial reports: ministerio "${r.ministryName}" no encontrado.`,
      );
    }

    const periodStart =
      r.reportType === 'annual'
        ? new Date(r.year, 0, 1)
        : r.reportType === 'quarterly'
          ? new Date(r.year, 0, 1)
          : new Date(r.year, 0, 1);
    const periodEnd =
      r.reportType === 'annual'
        ? new Date(r.year, 11, 31)
        : r.reportType === 'quarterly'
          ? new Date(r.year, 2, 31)
          : new Date(r.year, 0, 31);

    const periodLabel =
      r.reportType === 'annual'
        ? `Anual ${r.year}`
        : r.reportType === 'quarterly'
          ? `Q1 ${r.year}`
          : `Enero ${r.year}`;
    const title = `Reporte ${periodLabel} — ${r.ministryName}`;

    const presentedAt =
      r.status === 'Presented' || r.status === 'Approved'
        ? new Date(periodEnd.getTime() + 7 * 86400_000)
        : null;
    const approvedAt =
      r.status === 'Approved'
        ? new Date(periodEnd.getTime() + 14 * 86400_000)
        : null;

    const existing = await prisma.financialReport.findFirst({
      where: { idChurch, periodStart, periodEnd, title },
    });

    const payload = {
      idChurch,
      idMinistry: ministry.id,
      reportType: r.reportType,
      periodStart,
      periodEnd,
      title,
      summary: `Resumen del período ${periodLabel} para el ministerio ${r.ministryName}.`,
      totalIncome: r.totalIncome,
      totalExpenses: r.totalExpenses,
      netResult: r.totalIncome - r.totalExpenses,
      status: r.status,
      observacion: r.observacion ?? null,
      presentedAt,
      approvedAt,
      createdBy,
    };

    if (existing) {
      await prisma.financialReport.update({
        where: { id: existing.id },
        data: payload,
      });
    } else {
      await prisma.financialReport.create({ data: payload });
    }
    count++;
  }

  return count;
}

if (require.main === module) {
  runSeed('reportes financieros', async (prisma) => {
    const church = await loadChurch(prisma);
    const admin = await loadAdminUser(prisma, church.id);
    const count = await seedFinancialReports(prisma, church.id, admin.id);
    console.log(`Reportes seedeados: ${count}`);
  });
}
