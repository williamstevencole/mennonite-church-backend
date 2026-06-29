import { Church, City, PrismaClient } from '@prisma/client';

import { loadCitiesByName, runSeed } from './_bootstrap';

export const CHURCH_SEED = {
  name: 'Iglesia Menonita Central San Pedro Sula',
  contactPhone: null,
  founderName: null,
  mission:
    'Servir a Dios y a la comunidad de San Pedro Sula a traves del evangelio, el discipulado y el servicio.',
  vision:
    'Ser una iglesia viva, comprometida con la transformacion espiritual y social de Honduras.',
  values:
    'Fe, comunidad, servicio, integridad y compromiso con el reino de Dios.',
} as const;

export async function seedChurch(
  prisma: PrismaClient,
  citiesByName: Map<string, City>,
): Promise<Church> {
  const sps = citiesByName.get('San Pedro Sula');
  if (!sps) {
    throw new Error('Ciudad San Pedro Sula no encontrada durante el seed.');
  }

  const existing = await prisma.church.findFirst({
    where: { name: CHURCH_SEED.name },
  });

  if (existing) {
    return prisma.church.update({
      where: { id: existing.id },
      data: {
        idCity: sps.id,
        mission: CHURCH_SEED.mission,
        vision: CHURCH_SEED.vision,
        values: CHURCH_SEED.values,
        active: true,
      },
    });
  }

  return prisma.church.create({
    data: {
      name: CHURCH_SEED.name,
      idCity: sps.id,
      mission: CHURCH_SEED.mission,
      vision: CHURCH_SEED.vision,
      values: CHURCH_SEED.values,
      active: true,
    },
  });
}

if (require.main === module) {
  runSeed('iglesia', async (prisma) => {
    const citiesByName = await loadCitiesByName(prisma);
    const church = await seedChurch(prisma, citiesByName);
    console.log(`Iglesia: ${church.name} (id=${church.id})`);
  });
}
