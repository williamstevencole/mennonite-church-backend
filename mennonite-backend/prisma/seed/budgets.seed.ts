import { Budget, PrismaClient } from '@prisma/client';

const YEAR = new Date().getFullYear();

// Valores demo (no son los reales del informe del cliente).
// Total Ingresos: 2,000,000  |  Total Egresos: 1,800,000  |  Superávit planificado: 200,000
const EXPECTED_INCOME = 2000000;
const EXPECTED_EXPENSE = 1800000;

const EXPENSE_BUDGETS: Record<string, number> = {
  'Salarios y Obligaciones Patronales': 540000,
  Mantenimiento: 280000,
  Mejoras: 120000,
  'Mobiliario y Equipo': 80000,
  'Servicios Públicos': 175000,
  'Gastos Varios Administración': 220000,
  Ministerios: 300000,
  'Otros Egresos': 85000,
};

const INCOME_PROJECTIONS: Record<string, number> = {
  'Diezmos y Ofrendas': 1400000,
  Alquileres: 300000,
  Barbacoas: 180000,
  Ministerios: 80000,
  'Otros Ingresos': 40000,
};

export async function seedBudgets(
  prisma: PrismaClient,
  idChurch: number,
): Promise<Budget> {
  const periodStart = new Date(YEAR, 0, 1);
  const periodEnd = new Date(YEAR, 11, 31);

  const budget = await prisma.budget.upsert({
    where: {
      idChurch_periodStart_periodEnd: {
        idChurch,
        periodStart,
        periodEnd,
      },
    },
    update: {
      description: `Presupuesto anual ${YEAR}`,
      expectedIncome: EXPECTED_INCOME,
      expectedExpense: EXPECTED_EXPENSE,
      status: 'Active',
    },
    create: {
      idChurch,
      periodStart,
      periodEnd,
      description: `Presupuesto anual ${YEAR}`,
      expectedIncome: EXPECTED_INCOME,
      expectedExpense: EXPECTED_EXPENSE,
      status: 'Active',
    },
  });

  // "Ministerios" existe tanto en income como expense — necesitamos resolver por (name, type)
  const incomeMap = new Map(
    Object.entries(INCOME_PROJECTIONS).map(([name, amount]) => [
      `income:${name}`,
      amount,
    ]),
  );
  const expenseMap = new Map(
    Object.entries(EXPENSE_BUDGETS).map(([name, amount]) => [
      `expense:${name}`,
      amount,
    ]),
  );
  const allBudgetLines = new Map([...incomeMap, ...expenseMap]);

  const categoryNames = [
    ...Object.keys(INCOME_PROJECTIONS),
    ...Object.keys(EXPENSE_BUDGETS),
  ];
  const categories = await prisma.transactionCategory.findMany({
    where: { idChurch, name: { in: categoryNames } },
  });

  for (const category of categories) {
    const key = `${category.type}:${category.name}`;
    const annualAmount = allBudgetLines.get(key);
    if (annualAmount === undefined) continue;

    await prisma.budgetCategory.upsert({
      where: {
        idBudget_idCategory: {
          idBudget: budget.id,
          idCategory: category.id,
        },
      },
      update: {
        annualAmount,
      },
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

  return budget;
}
