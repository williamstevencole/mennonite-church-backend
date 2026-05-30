import { Ministry, PrismaClient } from '@prisma/client';

const DEMO_MINISTRIES = [
  { name: 'Ministerio de Alabanza' },
  { name: 'Ministerio de Jovenes' },
  { name: 'Ministerio de Ninos' },
  { name: 'Ministerio de Damas' },
  { name: 'Ministerio de Caballeros' },
  { name: 'Ministerio de Evangelismo' },
  { name: 'Ministerio de Servidores' },
] as const;

export async function seedMinistries(
  prisma: PrismaClient,
  idChurch: number,
): Promise<Map<string, Ministry>> {
  const ministriesByName = new Map<string, Ministry>();

  for (const data of DEMO_MINISTRIES) {
    const ministry = await prisma.ministry.upsert({
      where: {
        idChurch_name: {
          idChurch,
          name: data.name,
        },
      },
      update: {
        active: true,
      },
      create: {
        idChurch,
        name: data.name,
        active: true,
      },
    });
    ministriesByName.set(ministry.name, ministry);
  }

  return ministriesByName;
}
