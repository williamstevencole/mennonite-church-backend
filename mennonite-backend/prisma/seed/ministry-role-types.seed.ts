import { Ministry, PrismaClient } from '@prisma/client';

const MINISTRY_ROLE_TYPE_NAMES = [
  'Lider de Ministerio',
  'Coordinador',
  'Servidor',
  'Colaborador',
] as const;

export async function seedMinistryRoleTypes(
  prisma: PrismaClient,
  ministriesByName: Map<string, Ministry>,
): Promise<void> {
  for (const ministry of ministriesByName.values()) {
    for (const name of MINISTRY_ROLE_TYPE_NAMES) {
      const existing = await prisma.ministryRoleType.findFirst({
        where: { idMinistry: ministry.id, name },
      });

      if (existing) {
        await prisma.ministryRoleType.update({
          where: { id: existing.id },
          data: { active: true },
        });
        continue;
      }

      await prisma.ministryRoleType.create({
        data: {
          idMinistry: ministry.id,
          name,
          active: true,
        },
      });
    }
  }
}
