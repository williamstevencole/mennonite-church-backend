import { Board, PrismaClient } from '@prisma/client';

const ACTIVE_BOARD = {
  name: 'Concilio Pastoral 2026-2027',
  description:
    'Concilio pastoral encargado del gobierno y direccion de la iglesia durante el periodo 2026-2027.',
  startDate: new Date('2026-01-01'),
  endDate: new Date('2027-12-31'),
} as const;

export async function seedBoards(
  prisma: PrismaClient,
  idChurch: number,
): Promise<Board> {
  const existing = await prisma.board.findFirst({
    where: { idChurch, name: ACTIVE_BOARD.name },
  });

  if (existing) {
    return prisma.board.update({
      where: { id: existing.id },
      data: {
        description: ACTIVE_BOARD.description,
        startDate: ACTIVE_BOARD.startDate,
        endDate: ACTIVE_BOARD.endDate,
        active: true,
      },
    });
  }

  return prisma.board.create({
    data: {
      idChurch,
      name: ACTIVE_BOARD.name,
      description: ACTIVE_BOARD.description,
      startDate: ACTIVE_BOARD.startDate,
      endDate: ACTIVE_BOARD.endDate,
      active: true,
    },
  });
}
