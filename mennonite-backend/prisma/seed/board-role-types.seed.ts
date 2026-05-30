import { Board, PrismaClient } from '@prisma/client';

const BOARD_ROLE_TYPE_NAMES = [
  'Presidente',
  'Vicepresidente',
  'Secretario',
  'Vocal',
] as const;

export async function seedBoardRoleTypes(
  prisma: PrismaClient,
  board: Board,
): Promise<void> {
  for (const name of BOARD_ROLE_TYPE_NAMES) {
    const existing = await prisma.boardRoleType.findFirst({
      where: { idBoard: board.id, name },
    });

    if (existing) {
      await prisma.boardRoleType.update({
        where: { id: existing.id },
        data: { active: true },
      });
      continue;
    }

    await prisma.boardRoleType.create({
      data: {
        idBoard: board.id,
        name,
        active: true,
      },
    });
  }
}
