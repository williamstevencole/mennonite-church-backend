import { Ministry, PrismaClient } from '@prisma/client';

import { loadChurch, runSeed } from './_bootstrap';

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
    const existing = await prisma.ministry.findFirst({
      where: { idChurch, name: data.name },
      select: { id: true },
    });
    const ministry = existing
      ? await prisma.ministry.update({
          where: { id: existing.id },
          data: { active: true },
        })
      : await prisma.ministry.create({
          data: {
            idChurch,
            name: data.name,
            active: true,
          },
        });
    ministriesByName.set(ministry.name, ministry);
  }

  return ministriesByName;
}

if (require.main === module) {
  runSeed('ministerios', async (prisma) => {
    const church = await loadChurch(prisma);
    const ministries = await seedMinistries(prisma, church.id);
    console.log(`Ministerios seedeados: ${ministries.size}`);
  });
}
