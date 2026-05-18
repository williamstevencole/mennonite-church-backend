import { Ministry, PrismaClient } from '@prisma/client';

const DEMO_MINISTRIES = [
  { code: 'ALABANZA', name: 'Ministerio de Alabanza' },
  { code: 'JOVENES', name: 'Ministerio de Jovenes' },
  { code: 'NINOS', name: 'Ministerio de Ninos' },
  { code: 'DAMAS', name: 'Ministerio de Damas' },
  { code: 'CABALLEROS', name: 'Ministerio de Caballeros' },
  { code: 'EVANGELISMO', name: 'Ministerio de Evangelismo' },
  { code: 'SERVIDORES', name: 'Ministerio de Servidores' },
] as const;

export async function seedMinistries(
  prisma: PrismaClient,
  idChurch: number,
): Promise<Map<string, Ministry>> {
  const ministriesByCode = new Map<string, Ministry>();

  for (const data of DEMO_MINISTRIES) {
    const ministry = await prisma.ministry.upsert({
      where: {
        idChurch_code: {
          idChurch,
          code: data.code,
        },
      },
      update: {
        name: data.name,
        active: true,
      },
      create: {
        idChurch,
        code: data.code,
        name: data.name,
        active: true,
      },
    });
    ministriesByCode.set(ministry.code, ministry);
  }

  return ministriesByCode;
}
