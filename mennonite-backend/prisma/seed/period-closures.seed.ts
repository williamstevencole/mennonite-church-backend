import { PrismaClient } from '@prisma/client';

const CLOSURE_YEAR = new Date().getFullYear() - 1;

export async function seedPeriodClosures(
  prisma: PrismaClient,
  idChurch: number,
  createdBy: number,
): Promise<number> {
  await prisma.periodClosure.upsert({
    where: {
      idChurch_year: {
        idChurch,
        year: CLOSURE_YEAR,
      },
    },
    update: {
      ownFunds: 45000,
      accumulatedReserve: 180000,
      closureDate: new Date(CLOSURE_YEAR, 11, 31),
      notes: `Cierre contable del periodo ${CLOSURE_YEAR}.`,
    },
    create: {
      idChurch,
      year: CLOSURE_YEAR,
      ownFunds: 45000,
      accumulatedReserve: 180000,
      closureDate: new Date(CLOSURE_YEAR, 11, 31),
      notes: `Cierre contable del periodo ${CLOSURE_YEAR}.`,
      createdBy,
    },
  });

  return 1;
}
