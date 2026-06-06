import { PrismaClient } from '@prisma/client';

// PRD §6.6 — 13 categorias canonicas (5 ingreso + 8 gasto)
const INCOME_CATEGORIES = [
  'Diezmos y Ofrendas',
  'Alquileres',
  'Barbacoas',
  'Ministerios',
  'Otros Ingresos',
] as const;

const EXPENSE_CATEGORIES = [
  'Salarios y Obligaciones Patronales',
  'Mantenimiento',
  'Mejoras',
  'Mobiliario y Equipo',
  'Servicios Públicos',
  'Gastos Varios Administración',
  'Ministerios',
  'Otros Egresos',
] as const;

export async function seedTransactionCategories(
  prisma: PrismaClient,
  idChurch: number,
): Promise<void> {
  const incomeRows = INCOME_CATEGORIES.map((name) => ({
    name,
    type: 'income' as const,
  }));
  const expenseRows = EXPENSE_CATEGORIES.map((name) => ({
    name,
    type: 'expense' as const,
  }));
  const categories = [...incomeRows, ...expenseRows];

  await Promise.all(
    categories.map(({ name, type }) =>
      prisma.transactionCategory.upsert({
        where: {
          idChurch_name_type: {
            idChurch,
            name,
            type,
          },
        },
        update: {
          active: true,
        },
        create: {
          idChurch,
          name,
          type,
          active: true,
        },
      }),
    ),
  );
}
