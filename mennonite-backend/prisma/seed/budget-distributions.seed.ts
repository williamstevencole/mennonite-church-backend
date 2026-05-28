import { Budget, Ministry, PrismaClient } from '@prisma/client';

const DEMO_DISTRIBUTIONS: Record<string, number> = {
  ALABANZA: 20,
  JOVENES: 20,
  NINOS: 15,
  DAMAS: 10,
  CABALLEROS: 10,
  EVANGELISMO: 15,
  SERVIDORES: 10,
};

export async function seedBudgetDistributions(
  prisma: PrismaClient,
  budget: Budget,
  ministriesByCode: Map<string, Ministry>,
): Promise<number> {
  const total = Object.values(DEMO_DISTRIBUTIONS).reduce((a, b) => a + b, 0);
  if (total !== 100) {
    throw new Error(
      `Seed budget distributions: los porcentajes suman ${total}, deben sumar 100.`,
    );
  }

  let count = 0;
  for (const [code, percentage] of Object.entries(DEMO_DISTRIBUTIONS)) {
    const ministry = ministriesByCode.get(code);
    if (!ministry) {
      throw new Error(
        `Seed budget distributions: no se encontro el ministerio "${code}".`,
      );
    }

    await prisma.budgetDistribution.upsert({
      where: {
        idBudget_idMinistry: {
          idBudget: budget.id,
          idMinistry: ministry.id,
        },
      },
      update: { percentage },
      create: {
        idBudget: budget.id,
        idMinistry: ministry.id,
        percentage,
      },
    });
    count++;
  }

  return count;
}
