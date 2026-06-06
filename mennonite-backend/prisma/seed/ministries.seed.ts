import { Ministry, PrismaClient } from '@prisma/client';

// PRD §6.3 + §6.6.4 ejemplo de distribucion — 7 ministerios canonicos
const DEMO_MINISTRIES = [
  { name: 'Alabanza y Adoración' },
  { name: 'Jóvenes' },
  { name: 'Escuela Dominical' },
  { name: 'Damas' },
  { name: 'Caballeros' },
  { name: 'Misiones' },
  { name: 'Ujieres' },
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
