import { PrismaClient } from '@prisma/client';

const BOARD_ROLE_TYPES = [
  { name: 'Presidente', belongsTo: 'Council' },
  { name: 'Vicepresidente', belongsTo: 'Council' },
  { name: 'Secretario', belongsTo: 'Council' },
  { name: 'Vocal', belongsTo: 'Council' },
] as const;

const MINISTRY_ROLE_TYPES = [
  { name: 'Lider de Ministerio', belongsTo: 'Ministry' },
  { name: 'Coordinador', belongsTo: 'Ministry' },
  { name: 'Servidor', belongsTo: 'Ministry' },
  { name: 'Colaborador', belongsTo: 'Ministry' },
] as const;

export async function seedMemberRoleTypes(
  prisma: PrismaClient,
  idChurch: number,
): Promise<void> {
  const allRoleTypes = [...BOARD_ROLE_TYPES, ...MINISTRY_ROLE_TYPES];

  await Promise.all(
    allRoleTypes.map(async ({ name, belongsTo }) => {
      const existing = await prisma.memberRoleType.findFirst({
        where: {
          idChurch,
          name,
          belongsTo,
        },
      });

      if (existing) {
        await prisma.memberRoleType.update({
          where: { id: existing.id },
          data: { active: true },
        });
        return;
      }

      await prisma.memberRoleType.create({
        data: {
          idChurch,
          name,
          belongsTo,
          active: true,
        },
      });
    }),
  );
}
