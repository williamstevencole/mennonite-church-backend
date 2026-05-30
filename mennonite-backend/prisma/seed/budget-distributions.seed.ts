import { Budget, Ministry, PrismaClient } from '@prisma/client';

const DEMO_DISTRIBUTIONS: Record<string, number> = {
  'Ministerio de Alabanza': 20,
  'Ministerio de Jovenes': 20,
  'Ministerio de Ninos': 15,
  'Ministerio de Damas': 10,
  'Ministerio de Caballeros': 10,
  'Ministerio de Evangelismo': 15,
  'Ministerio de Servidores': 10,
};

export async function seedBudgetDistributions(
  prisma: PrismaClient,
  budget: Budget,
  ministriesByName: Map<string, Ministry>,
): Promise<number> {
  const total = Object.values(DEMO_DISTRIBUTIONS).reduce((a, b) => a + b, 0);
  if (total !== 100) {
    throw new Error(
      `Seed budget distributions: los porcentajes suman ${total}, deben sumar 100.`,
    );
  }

  let count = 0;
  for (const [name, percentage] of Object.entries(DEMO_DISTRIBUTIONS)) {
    const ministry = ministriesByName.get(name);
    if (!ministry) {
      throw new Error(
        `Seed budget distributions: no se encontro el ministerio "${name}".`,
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
