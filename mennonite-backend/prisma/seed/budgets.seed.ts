import { Budget, PrismaClient } from '@prisma/client';

const YEAR = new Date().getFullYear();

const EXPENSE_BUDGETS: Record<string, number> = {
  'Servicios Publicos': 60000,
  Mantenimiento: 80000,
  'Ayuda Social': 120000,
  'Materiales Ministeriales': 40000,
  Transporte: 30000,
  Alimentacion: 25000,
  'Equipo y Tecnologia': 50000,
  'Papeleria y Suministros': 15000,
};

const INCOME_PROJECTIONS: Record<string, number> = {
  Diezmos: 350000,
  Ofrendas: 120000,
  Donaciones: 40000,
  'Actividades Especiales': 60000,
  'Ingresos por Eventos': 50000,
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
      status: 'Active',
    },
    create: {
      idChurch,
      periodStart,
      periodEnd,
      description: `Presupuesto anual ${YEAR}`,
      status: 'Active',
    },
  });

  const allBudgetLines = { ...EXPENSE_BUDGETS, ...INCOME_PROJECTIONS };
  const categoryNames = Object.keys(allBudgetLines);
  const categories = await prisma.transactionCategory.findMany({
    where: { name: { in: categoryNames } },
  });

  for (const category of categories) {
    const annualAmount = allBudgetLines[category.name];
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
            ? `Proyeccion anual de ingresos por ${category.name.toLowerCase()}`
            : `Asignacion anual para ${category.name.toLowerCase()}`,
      },
    });
  }

  return budget;
}
