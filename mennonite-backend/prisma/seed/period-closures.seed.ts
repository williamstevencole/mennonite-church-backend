import { PrismaClient } from '@prisma/client';

const CURRENT_YEAR = new Date().getFullYear();

type ClosureSeed = {
  year: number;
  ownFunds: number;
  accumulatedReserve: number;
  notes: string;
};

const CLOSURES: ClosureSeed[] = [
  {
    year: CURRENT_YEAR - 3,
    ownFunds: 28_000,
    accumulatedReserve: 120_000,
    notes: `Cierre contable del período ${CURRENT_YEAR - 3}.`,
  },
  {
    year: CURRENT_YEAR - 2,
    ownFunds: 36_000,
    accumulatedReserve: 150_000,
    notes: `Cierre contable del período ${CURRENT_YEAR - 2}.`,
  },
  {
    year: CURRENT_YEAR - 1,
    ownFunds: 45_000,
    accumulatedReserve: 180_000,
    notes: `Cierre contable del período ${CURRENT_YEAR - 1}.`,
  },
];

export async function seedPeriodClosures(
  prisma: PrismaClient,
  idChurch: number,
  createdBy: number,
): Promise<number> {
  let count = 0;
  for (const c of CLOSURES) {
    const existing = await prisma.periodClosure.findFirst({
      where: { idChurch, year: c.year },
      select: { id: true },
    });
    if (existing) {
      await prisma.periodClosure.update({
        where: { id: existing.id },
        data: {
          ownFunds: c.ownFunds,
          accumulatedReserve: c.accumulatedReserve,
          closureDate: new Date(c.year, 11, 31),
          notes: c.notes,
        },
      });
    } else {
      await prisma.periodClosure.create({
        data: {
          idChurch,
          year: c.year,
          ownFunds: c.ownFunds,
          accumulatedReserve: c.accumulatedReserve,
          closureDate: new Date(c.year, 11, 31),
          notes: c.notes,
          createdBy,
        },
      });
    }
    count++;
  }
  return 1 * count;
}
