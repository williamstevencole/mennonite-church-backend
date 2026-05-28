import { PrismaClient } from '@prisma/client';

type ArticleSeed = {
  code: string;
  name: string;
  description?: string;
  brand?: string;
  model?: string;
  unitCost: number;
  initialQuantity: number;
};

const DEMO_ARTICLES: ArticleSeed[] = [
  {
    code: 'SILLA-001',
    name: 'Silla plegable',
    description: 'Silla plegable para uso en eventos y cultos.',
    brand: 'Generico',
    model: 'Standard',
    unitCost: 350,
    initialQuantity: 50,
  },
  {
    code: 'MIC-001',
    name: 'Microfono inalambrico',
    description: 'Microfono inalambrico para predicacion y alabanza.',
    brand: 'Shure',
    model: 'BLX24',
    unitCost: 4800,
    initialQuantity: 4,
  },
];

export async function seedInventory(
  prisma: PrismaClient,
  idChurch: number,
  idUser: number,
): Promise<{ articles: number; movements: number }> {
  let articles = 0;
  let movements = 0;

  for (const data of DEMO_ARTICLES) {
    const article = await prisma.article.upsert({
      where: {
        idChurch_code: { idChurch, code: data.code },
      },
      update: {
        name: data.name,
        description: data.description ?? null,
        brand: data.brand ?? null,
        model: data.model ?? null,
        unitCost: data.unitCost,
        active: true,
      },
      create: {
        idChurch,
        code: data.code,
        name: data.name,
        description: data.description ?? null,
        brand: data.brand ?? null,
        model: data.model ?? null,
        unitCost: data.unitCost,
        active: true,
      },
    });
    articles++;

    const documentNumber = `INV-${data.code}-INIT`;
    const datetime = new Date(new Date().getFullYear(), 0, 1, 8, 0, 0);

    const existing = await prisma.inventoryMovement.findFirst({
      where: {
        idChurch,
        idArticle: article.id,
        documentNumber,
      },
    });

    const payload = {
      idChurch,
      type: 'Inbound',
      documentNumber,
      datetime,
      idUser,
      idArticle: article.id,
      quantity: data.initialQuantity,
      notes: 'Carga inicial de inventario.',
    };

    if (existing) {
      await prisma.inventoryMovement.update({
        where: { id: existing.id },
        data: payload,
      });
    } else {
      await prisma.inventoryMovement.create({ data: payload });
    }
    movements++;
  }

  return { articles, movements };
}
