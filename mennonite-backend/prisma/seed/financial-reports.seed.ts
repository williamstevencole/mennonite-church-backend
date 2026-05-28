import { PrismaClient } from '@prisma/client';

const YEAR = new Date().getFullYear();

export async function seedFinancialReports(
  prisma: PrismaClient,
  idChurch: number,
  createdBy: number,
): Promise<number> {
  const periodStart = new Date(YEAR, 0, 1);
  const periodEnd = new Date(YEAR, 11, 31);
  const title = `Reporte Financiero Anual ${YEAR}`;

  const existing = await prisma.financialReport.findFirst({
    where: { idChurch, periodStart, periodEnd, title },
  });

  const payload = {
    idChurch,
    reportType: 'annual',
    periodStart,
    periodEnd,
    title,
    summary: `Reporte preliminar de ingresos y egresos del ${YEAR}.`,
    status: 'Draft',
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

  return 1;
}
