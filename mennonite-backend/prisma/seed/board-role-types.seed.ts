import { Board, PrismaClient } from '@prisma/client';

// PRD §6.4 — cargos del concilio (pastorales + administrativos)
const BOARD_ROLE_TYPE_NAMES = [
  // Pastorales
  'Pastor',
  'Co-pastor',
  'Anciano',
  'Anciana',
  'Diácono',
  'Diácona',
  // Administrativos
  'Presidente',
  'Vicepresidente',
  'Secretario',
  'Tesorero',
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
