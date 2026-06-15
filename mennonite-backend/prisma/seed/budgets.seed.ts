import { Budget, PrismaClient } from '@prisma/client';

const CURRENT_YEAR = new Date().getFullYear();
const SEED_YEARS = [CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR];

// Proyecciones por año. Índices = (year - 2, year - 1, year actual).
const EXPECTED_INCOME_BY_YEAR: Record<number, number> = {
  [SEED_YEARS[0]]: 1_700_000,
  [SEED_YEARS[1]]: 1_850_000,
  [SEED_YEARS[2]]: 2_000_000,
};

const EXPECTED_EXPENSE_BY_YEAR: Record<number, number> = {
  [SEED_YEARS[0]]: 1_550_000,
  [SEED_YEARS[1]]: 1_700_000,
  [SEED_YEARS[2]]: 1_800_000,
};

type BudgetLines = Record<string, number>;

const INCOME_LINES_BY_YEAR: Record<number, BudgetLines> = {
  [SEED_YEARS[0]]: {
    'Diezmos y Ofrendas': 1_200_000,
    Alquileres: 250_000,
    Barbacoas: 150_000,
    Ministerios: 65_000,
    'Otros Ingresos': 35_000,
  },
  [SEED_YEARS[1]]: {
    'Diezmos y Ofrendas': 1_300_000,
    Alquileres: 280_000,
    Barbacoas: 165_000,
    Ministerios: 75_000,
    'Otros Ingresos': 38_000,
  },
  [SEED_YEARS[2]]: {
    'Diezmos y Ofrendas': 1_400_000,
    Alquileres: 300_000,
    Barbacoas: 180_000,
    Ministerios: 80_000,
    'Otros Ingresos': 40_000,
  },
};

const EXPENSE_LINES_BY_YEAR: Record<number, BudgetLines> = {
  [SEED_YEARS[0]]: {
    'Salarios y Obligaciones Patronales': 480_000,
    Mantenimiento: 250_000,
    Mejoras: 80_000,
    'Mobiliario y Equipo': 60_000,
    'Servicios Públicos': 150_000,
    'Gastos Varios Administración': 190_000,
    Ministerios: 270_000,
    'Otros Egresos': 80_000,
  },
  [SEED_YEARS[1]]: {
    'Salarios y Obligaciones Patronales': 510_000,
    Mantenimiento: 270_000,
    Mejoras: 100_000,
    'Mobiliario y Equipo': 70_000,
    'Servicios Públicos': 165_000,
    'Gastos Varios Administración': 200_000,
    Ministerios: 285_000,
    'Otros Egresos': 80_000,
  },
  [SEED_YEARS[2]]: {
    'Salarios y Obligaciones Patronales': 540_000,
    Mantenimiento: 280_000,
    Mejoras: 120_000,
    'Mobiliario y Equipo': 80_000,
    'Servicios Públicos': 175_000,
    'Gastos Varios Administración': 220_000,
    Ministerios: 300_000,
    'Otros Egresos': 85_000,
  },
};

export async function seedBudgets(
  prisma: PrismaClient,
  idChurch: number,
): Promise<{ current: Budget; all: Budget[]; byYear: Map<number, Budget> }> {
  const all: Budget[] = [];
  const byYear = new Map<number, Budget>();

  const categories = await prisma.transactionCategory.findMany({
    where: { idChurch },
  });

  for (const year of SEED_YEARS) {
    const periodStart = new Date(year, 0, 1);
    const periodEnd = new Date(year, 11, 31);
    const status =
      year === CURRENT_YEAR
        ? 'Active'
        : year < CURRENT_YEAR
          ? 'Closed'
          : 'Draft';

    const budget = await prisma.budget.upsert({
      where: {
        idChurch_periodStart_periodEnd: {
          idChurch,
          periodStart,
          periodEnd,
        },
      },
      update: {
        description: `Presupuesto anual ${year}`,
        expectedIncome: EXPECTED_INCOME_BY_YEAR[year],
        expectedExpense: EXPECTED_EXPENSE_BY_YEAR[year],
        status,
      },
      create: {
        idChurch,
        periodStart,
        periodEnd,
        description: `Presupuesto anual ${year}`,
        expectedIncome: EXPECTED_INCOME_BY_YEAR[year],
        expectedExpense: EXPECTED_EXPENSE_BY_YEAR[year],
        status,
      },
    });
    all.push(budget);
    byYear.set(year, budget);

    const incomeLines = INCOME_LINES_BY_YEAR[year];
    const expenseLines = EXPENSE_LINES_BY_YEAR[year];

    for (const category of categories) {
      const map = category.type === 'income' ? incomeLines : expenseLines;
      const annualAmount = map[category.name];
      if (annualAmount === undefined) continue;

      await prisma.budgetCategory.upsert({
        where: {
          idBudget_idCategory: {
            idBudget: budget.id,
            idCategory: category.id,
          },
        },
        update: { annualAmount },
        create: {
          idBudget: budget.id,
          idCategory: category.id,
          annualAmount,
          notes:
            category.type === 'income'
              ? `Proyección anual de ingresos por ${category.name.toLowerCase()}`
              : `Asignación anual para ${category.name.toLowerCase()}`,
        },
      });
    }
  }

  const current = byYear.get(CURRENT_YEAR);
  if (!current) {
    throw new Error(
      'Seed budgets: no se encontró el presupuesto del año actual.',
    );
  }

  return { current, all, byYear };
}
