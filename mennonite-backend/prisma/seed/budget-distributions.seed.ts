import { Budget, Ministry, PrismaClient } from '@prisma/client';

// Reparto demo en Lempiras de la categoría "Ministerios" expense (L.300,000).
// La suma debe ser ≤ MinisteriosBudgetCategory.annualAmount.
const DEMO_DISTRIBUTIONS: Record<string, number> = {
  'Alabanza y Adoración': 75000,
  Jóvenes: 60000,
  'Escuela Dominical': 45000,
  Damas: 30000,
  Caballeros: 30000,
  Misiones: 45000,
  Ujieres: 15000,
};

const MINISTERIOS_CATEGORY_AMOUNT = 300000;

export async function seedBudgetDistributions(
  prisma: PrismaClient,
  budget: Budget,
  ministriesByName: Map<string, Ministry>,
): Promise<number> {
  const total = Object.values(DEMO_DISTRIBUTIONS).reduce((a, b) => a + b, 0);
  if (total > MINISTERIOS_CATEGORY_AMOUNT) {
    throw new Error(
      `Seed budget distributions: la suma de distribuciones (${total}) excede el monto de la categoría Ministerios (${MINISTERIOS_CATEGORY_AMOUNT}).`,
    );
  }

  let count = 0;
  for (const [name, annualAmount] of Object.entries(DEMO_DISTRIBUTIONS)) {
    const ministry = ministriesByName.get(name);
    if (!ministry) {
      throw new Error(
        `Seed budget distributions: no se encontro el ministerio "${name}".`,
      );
    }

    const existing = await prisma.budgetDistribution.findFirst({
      where: { idBudget: budget.id, idMinistry: ministry.id },
      select: { id: true },
    });
    if (existing) {
      await prisma.budgetDistribution.update({
        where: { id: existing.id },
        data: { annualAmount },
      });
    } else {
      await prisma.budgetDistribution.create({
        data: {
          idBudget: budget.id,
          idMinistry: ministry.id,
          annualAmount,
        },
      });
    }
    count++;
  }

  return count;
}
