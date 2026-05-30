import { PrismaClient } from '@prisma/client';

const YEAR = new Date().getFullYear();

type FinancialTransactionSeed = {
  categoryName: string;
  categoryType: 'income' | 'expense';
  amount: number;
  description: string;
  transactionDate: Date;
  paymentMethod: 'Cash' | 'Transfer' | 'Check' | 'Card';
  receiptType?: 'Receipt' | 'Invoice' | 'Certificate' | 'Note' | 'Other';
  receiptNumber?: string;
  ministryName?: string;
  eventTitle?: string;
};

const DEMO_TRANSACTIONS: FinancialTransactionSeed[] = [
  {
    categoryName: 'Diezmos',
    categoryType: 'income',
    amount: 28500,
    description: 'Diezmos recibidos en culto dominical',
    transactionDate: new Date(YEAR, 0, 7),
    paymentMethod: 'Cash',
    receiptType: 'Receipt',
    receiptNumber: 'D-0001',
  },
  {
    categoryName: 'Ofrendas',
    categoryType: 'income',
    amount: 8200,
    description: 'Ofrenda misionera de enero',
    transactionDate: new Date(YEAR, 0, 14),
    paymentMethod: 'Cash',
    receiptType: 'Receipt',
    receiptNumber: 'O-0001',
  },
  {
    categoryName: 'Servicios Publicos',
    categoryType: 'expense',
    amount: 4500,
    description: 'Pago de energia electrica enero',
    transactionDate: new Date(YEAR, 0, 20),
    paymentMethod: 'Transfer',
    receiptType: 'Invoice',
    receiptNumber: 'ENEE-2026-001',
  },
  {
    categoryName: 'Materiales Ministeriales',
    categoryType: 'expense',
    amount: 1800,
    description: 'Material didactico para escuela dominical',
    transactionDate: new Date(YEAR, 1, 5),
    paymentMethod: 'Cash',
    receiptType: 'Invoice',
    receiptNumber: 'F-2026-022',
    ministryName: 'Ministerio de Ninos',
  },
  {
    categoryName: 'Ingresos por Eventos',
    categoryType: 'income',
    amount: 15000,
    description: 'Recaudacion de cena benefica anual',
    transactionDate: new Date(YEAR, 10, 9),
    paymentMethod: 'Transfer',
    receiptType: 'Receipt',
    receiptNumber: 'EV-0001',
    eventTitle: 'Cena Benefica Anual',
  },
  {
    categoryName: 'Transporte',
    categoryType: 'expense',
    amount: 6500,
    description: 'Transporte para conferencia de jovenes',
    transactionDate: new Date(YEAR, 6, 18),
    paymentMethod: 'Cash',
    receiptType: 'Note',
    ministryName: 'Ministerio de Jovenes',
    eventTitle: 'Conferencia de Jovenes',
  },
];

export async function seedFinancialTransactions(
  prisma: PrismaClient,
  idChurch: number,
  createdBy: number,
): Promise<number> {
  let count = 0;
  for (const data of DEMO_TRANSACTIONS) {
    const category = await prisma.transactionCategory.findUnique({
      where: {
        idChurch_name_type: {
          idChurch,
          name: data.categoryName,
          type: data.categoryType,
        },
      },
    });
    if (!category) {
      throw new Error(
        `Seed financial transactions: no se encontro la categoria "${data.categoryName}" (${data.categoryType}).`,
      );
    }

    const ministry = data.ministryName
      ? await prisma.ministry.findUnique({
          where: {
            idChurch_name: { idChurch, name: data.ministryName },
          },
        })
      : null;

    const event = data.eventTitle
      ? await prisma.event.findFirst({
          where: { idChurch, title: data.eventTitle },
        })
      : null;

    const existing = await prisma.financialTransaction.findFirst({
      where: {
        idChurch,
        idCategory: category.id,
        description: data.description,
        transactionDate: data.transactionDate,
      },
    });

    const payload = {
      idChurch,
      idCategory: category.id,
      amount: data.amount,
      description: data.description,
      transactionDate: data.transactionDate,
      paymentMethod: data.paymentMethod,
      receiptType: data.receiptType ?? null,
      receiptNumber: data.receiptNumber ?? null,
      idEvent: event?.id ?? null,
      idMinistry: ministry?.id ?? null,
      createdBy,
    };

    if (existing) {
      await prisma.financialTransaction.update({
        where: { id: existing.id },
        data: payload,
      });
    } else {
      await prisma.financialTransaction.create({ data: payload });
    }
    count++;
  }

  return count;
}
