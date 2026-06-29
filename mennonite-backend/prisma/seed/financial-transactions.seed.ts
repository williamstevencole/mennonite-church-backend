import { PrismaClient } from '@prisma/client';

import { loadAdminUser, loadChurch, runSeed } from './_bootstrap';

const CURRENT_YEAR = new Date().getFullYear();
const SEED_YEARS = [CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR];

type PaymentMethod = 'Cash' | 'Transfer' | 'Check' | 'Card';
type ReceiptType = 'Receipt' | 'Invoice' | 'Certificate' | 'Note' | 'Other';

type CategoryPlan = {
  name: string;
  type: 'income' | 'expense';
  /** Monto anual aproximado por año (orden: hace 2 años, año pasado, actual) */
  annualByYear: [number, number, number];
  /** Cuántas transacciones por año generamos */
  txPerYear: number;
  defaultPayment: PaymentMethod;
  defaultReceipt: ReceiptType;
  /** Mes(es) en los que se concentra; si vacío, distribuye en todo el año */
  monthsHint?: number[];
  ministryName?: string;
};

const PLANS: CategoryPlan[] = [
  // ─── Ingresos ─────────────────────────────────────────────────────────
  {
    name: 'Diezmos y Ofrendas',
    type: 'income',
    annualByYear: [1_180_000, 1_260_000, 1_340_000],
    txPerYear: 48,
    defaultPayment: 'Cash',
    defaultReceipt: 'Receipt',
  },
  {
    name: 'Alquileres',
    type: 'income',
    annualByYear: [260_000, 280_000, 295_000],
    txPerYear: 12,
    defaultPayment: 'Transfer',
    defaultReceipt: 'Receipt',
  },
  {
    name: 'Barbacoas',
    type: 'income',
    annualByYear: [150_000, 165_000, 175_000],
    txPerYear: 4,
    defaultPayment: 'Cash',
    defaultReceipt: 'Receipt',
    monthsHint: [3, 6, 9, 11],
  },
  {
    name: 'Ministerios',
    type: 'income',
    annualByYear: [62_000, 72_000, 78_000],
    txPerYear: 6,
    defaultPayment: 'Cash',
    defaultReceipt: 'Receipt',
    monthsHint: [2, 4, 6, 8, 10, 11],
  },
  {
    name: 'Otros Ingresos',
    type: 'income',
    annualByYear: [32_000, 36_000, 40_000],
    txPerYear: 4,
    defaultPayment: 'Cash',
    defaultReceipt: 'Note',
    monthsHint: [3, 6, 9, 12],
  },
  // ─── Egresos ──────────────────────────────────────────────────────────
  {
    name: 'Salarios y Obligaciones Patronales',
    type: 'expense',
    annualByYear: [480_000, 510_000, 540_000],
    txPerYear: 12,
    defaultPayment: 'Transfer',
    defaultReceipt: 'Receipt',
  },
  {
    name: 'Mantenimiento',
    type: 'expense',
    annualByYear: [240_000, 270_000, 285_000],
    txPerYear: 10,
    defaultPayment: 'Cash',
    defaultReceipt: 'Invoice',
  },
  {
    name: 'Mejoras',
    type: 'expense',
    annualByYear: [60_000, 90_000, 115_000],
    txPerYear: 4,
    defaultPayment: 'Transfer',
    defaultReceipt: 'Invoice',
    monthsHint: [2, 5, 8, 11],
  },
  {
    name: 'Mobiliario y Equipo',
    type: 'expense',
    annualByYear: [55_000, 65_000, 78_000],
    txPerYear: 4,
    defaultPayment: 'Card',
    defaultReceipt: 'Invoice',
    monthsHint: [3, 6, 9, 12],
  },
  {
    name: 'Servicios Públicos',
    type: 'expense',
    annualByYear: [140_000, 160_000, 175_000],
    txPerYear: 24,
    defaultPayment: 'Transfer',
    defaultReceipt: 'Invoice',
  },
  {
    name: 'Gastos Varios Administración',
    type: 'expense',
    annualByYear: [170_000, 190_000, 215_000],
    txPerYear: 12,
    defaultPayment: 'Cash',
    defaultReceipt: 'Invoice',
  },
  {
    name: 'Ministerios',
    type: 'expense',
    annualByYear: [225_000, 260_000, 290_000],
    txPerYear: 18,
    defaultPayment: 'Cash',
    defaultReceipt: 'Note',
    ministryName: 'rotate', // rotamos entre ministerios
  },
  {
    name: 'Otros Egresos',
    type: 'expense',
    annualByYear: [70_000, 78_000, 85_000],
    txPerYear: 6,
    defaultPayment: 'Cash',
    defaultReceipt: 'Note',
    monthsHint: [2, 4, 6, 8, 10, 12],
  },
];

const MINISTRY_ROTATION = [
  'Alabanza y Adoración',
  'Jóvenes',
  'Escuela Dominical',
  'Damas',
  'Caballeros',
  'Misiones',
  'Ujieres',
];

/** Determinismo: hash simple para variar montos sin Math.random. */
function jitter(seed: number, range: number): number {
  // Variación pseudo-aleatoria determinista entre -range y +range
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  const frac = x - Math.floor(x);
  return Math.round((frac * 2 - 1) * range);
}

type FinancialTransactionSeed = {
  categoryName: string;
  categoryType: 'income' | 'expense';
  amount: number;
  description: string;
  transactionDate: Date;
  paymentMethod: PaymentMethod;
  receiptType: ReceiptType;
  receiptNumber: string;
  ministryName?: string;
};

function buildTransactions(): FinancialTransactionSeed[] {
  const out: FinancialTransactionSeed[] = [];
  let seqGlobal = 0;

  for (let yi = 0; yi < SEED_YEARS.length; yi++) {
    const year = SEED_YEARS[yi];
    for (const plan of PLANS) {
      const annual = plan.annualByYear[yi];
      const baseAmount = annual / plan.txPerYear;
      const months =
        plan.monthsHint && plan.monthsHint.length > 0
          ? plan.monthsHint
          : Array.from({ length: 12 }, (_, m) => m + 1);

      for (let i = 0; i < plan.txPerYear; i++) {
        seqGlobal++;
        const month = months[i % months.length] - 1; // 0-indexed
        const day = ((i * 17) % 26) + 2;
        const date = new Date(year, month, day);

        const variance = Math.round(baseAmount * 0.18);
        const amount = Math.max(
          100,
          Math.round(baseAmount + jitter(seqGlobal, variance)),
        );

        const ministryName =
          plan.ministryName === 'rotate'
            ? MINISTRY_ROTATION[i % MINISTRY_ROTATION.length]
            : plan.ministryName;

        const description = buildDescription(plan, year, i + 1, ministryName);
        const receiptNumber = buildReceiptNumber(plan, year, i + 1);

        out.push({
          categoryName: plan.name,
          categoryType: plan.type,
          amount,
          description,
          transactionDate: date,
          paymentMethod: plan.defaultPayment,
          receiptType: plan.defaultReceipt,
          receiptNumber,
          ministryName,
        });
      }
    }
  }

  return out;
}

function buildDescription(
  plan: CategoryPlan,
  year: number,
  seq: number,
  ministry?: string,
): string {
  const monthLabel = [
    'ene',
    'feb',
    'mar',
    'abr',
    'may',
    'jun',
    'jul',
    'ago',
    'sep',
    'oct',
    'nov',
    'dic',
  ];
  const tag = ministry ? ` (${ministry})` : '';
  const m = monthLabel[(seq - 1) % 12];

  switch (plan.name) {
    case 'Diezmos y Ofrendas':
      return `Diezmos y ofrendas — culto dominical ${m}/${year}`;
    case 'Alquileres':
      return `Alquiler de salón parroquial — ${m}/${year}`;
    case 'Barbacoas':
      return `Recaudación barbacoa benéfica — ${m}/${year}`;
    case 'Ministerios':
      return plan.type === 'income'
        ? `Recaudación ministerio${tag} — ${m}/${year}`
        : `Gasto operativo ministerio${tag} — ${m}/${year}`;
    case 'Otros Ingresos':
      return `Ingreso varios — ${m}/${year}`;
    case 'Salarios y Obligaciones Patronales':
      return `Planilla y aportes patronales — ${m}/${year}`;
    case 'Mantenimiento':
      return `Mantenimiento de instalaciones — ${m}/${year}`;
    case 'Mejoras':
      return `Mejoras a la propiedad — ${m}/${year}`;
    case 'Mobiliario y Equipo':
      return `Adquisición mobiliario / equipo — ${m}/${year}`;
    case 'Servicios Públicos':
      return `Pago servicios públicos — ${m}/${year}`;
    case 'Gastos Varios Administración':
      return `Gastos administrativos — ${m}/${year}`;
    case 'Otros Egresos':
      return `Gasto varios — ${m}/${year}`;
    default:
      return `${plan.name} — ${m}/${year}`;
  }
}

function buildReceiptNumber(
  plan: CategoryPlan,
  year: number,
  seq: number,
): string {
  const prefix = plan.type === 'income' ? 'I' : 'E';
  const code = `${prefix}${plan.name.slice(0, 3).toUpperCase()}`;
  return `${code}-${year}-${String(seq).padStart(4, '0')}`;
}

export async function seedFinancialTransactions(
  prisma: PrismaClient,
  idChurch: number,
  createdBy: number,
): Promise<number> {
  const transactions = buildTransactions();

  // Cache de categorías y ministerios
  const categories = await prisma.transactionCategory.findMany({
    where: { idChurch },
  });
  const categoryByKey = new Map(
    categories.map((c) => [`${c.type}:${c.name}`, c]),
  );

  const ministries = await prisma.ministry.findMany({ where: { idChurch } });
  const ministryByName = new Map(ministries.map((m) => [m.name, m]));

  let count = 0;
  for (const data of transactions) {
    const cat = categoryByKey.get(`${data.categoryType}:${data.categoryName}`);
    if (!cat) {
      throw new Error(
        `Seed financial transactions: categoría "${data.categoryName}" (${data.categoryType}) no encontrada.`,
      );
    }

    const ministry = data.ministryName
      ? (ministryByName.get(data.ministryName) ?? null)
      : null;

    const existing = await prisma.financialTransaction.findFirst({
      where: {
        idChurch,
        idCategory: cat.id,
        description: data.description,
        transactionDate: data.transactionDate,
      },
    });

    const payload = {
      idChurch,
      idCategory: cat.id,
      amount: data.amount,
      description: data.description,
      transactionDate: data.transactionDate,
      paymentMethod: data.paymentMethod,
      receiptType: data.receiptType,
      receiptNumber: data.receiptNumber,
      idEvent: null,
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

if (require.main === module) {
  runSeed('transacciones financieras', async (prisma) => {
    const church = await loadChurch(prisma);
    const admin = await loadAdminUser(prisma, church.id);
    const count = await seedFinancialTransactions(prisma, church.id, admin.id);
    console.log(`Transacciones seedeadas: ${count}`);
  });
}
