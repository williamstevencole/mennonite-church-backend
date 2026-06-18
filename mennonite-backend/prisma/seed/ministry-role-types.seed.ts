import { Ministry, PrismaClient } from '@prisma/client';

// PRD §6.3 — cargos dentro de un ministerio
// 'Miembro' is the base role; 'Servidor' and 'Colaborador' were renamed to 'Miembro'
// so that area computation correctly yields 'miembro' for non-leaders.
const MINISTRY_ROLE_TYPE_NAMES = [
  'Líder',
  'Co-líder',
  'Maestro',
  'Miembro',
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
