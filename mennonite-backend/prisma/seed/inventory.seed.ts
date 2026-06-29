import { PrismaClient } from '@prisma/client';

import { loadAdminUser, loadChurch, runSeed } from './_bootstrap';

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
    code: 'silla-001',
    name: 'Silla plegable',
    description: 'Silla plegable para uso en eventos y cultos.',
    brand: 'Generico',
    model: 'Standard',
    unitCost: 350,
    initialQuantity: 50,
  },
  {
    code: 'mic-001',
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
    const existingArticle = await prisma.article.findFirst({
      where: { idChurch, code: data.code },
      select: { id: true },
    });
    const article = existingArticle
      ? await prisma.article.update({
          where: { id: existingArticle.id },
          data: {
            name: data.name,
            description: data.description ?? null,
            brand: data.brand ?? null,
            model: data.model ?? null,
            unitCost: data.unitCost,
            active: true,
          },
          select: { id: true },
        })
      : await prisma.article.create({
          data: {
            idChurch,
            code: data.code,
            name: data.name,
            description: data.description ?? null,
            brand: data.brand ?? null,
            model: data.model ?? null,
            unitCost: data.unitCost,
            active: true,
          },
          select: { id: true },
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

if (require.main === module) {
  runSeed('inventario', async (prisma) => {
    const church = await loadChurch(prisma);
    const admin = await loadAdminUser(prisma, church.id);
    const counts = await seedInventory(prisma, church.id, admin.id);
    console.log(
      `artículos=${counts.articles}, movimientos=${counts.movements}`,
    );
  });
}
