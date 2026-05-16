import { PrismaClient } from '@prisma/client';

const INCOME_CATEGORIES = [
  'Diezmos',
  'Ofrendas',
  'Donaciones',
  'Actividades Especiales',
  'Ingresos por Eventos',
] as const;

const EXPENSE_CATEGORIES = [
  'Servicios Publicos',
  'Mantenimiento',
  'Ayuda Social',
  'Materiales Ministeriales',
  'Transporte',
  'Alimentacion',
  'Equipo y Tecnologia',
  'Papeleria y Suministros',
] as const;

export async function seedTransactionCategories(prisma: PrismaClient): Promise<void> {
  const incomeRows = INCOME_CATEGORIES.map((name) => ({ name, type: 'income' as const }));
  const expenseRows = EXPENSE_CATEGORIES.map((name) => ({ name, type: 'expense' as const }));
  const categories = [...incomeRows, ...expenseRows];

  await Promise.all(
    categories.map(({ name, type }) =>
      prisma.transactionCategory.upsert({
        where: {
          name_type: {
            name,
            type,
          },
        },
        update: {
          active: true,
        },
        create: {
          name,
          type,
          active: true,
        },
      }),
    ),
  );
}
