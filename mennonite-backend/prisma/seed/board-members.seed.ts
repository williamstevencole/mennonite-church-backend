import { Board, Member, PrismaClient } from '@prisma/client';

import {
  loadActiveBoard,
  loadChurch,
  loadMembersByName,
  runSeed,
} from './_bootstrap';

const DEMO_BOARD_MEMBERS = [
  { memberName: 'Oscar Martinez', roleName: 'Pastor' },
  { memberName: 'Oscar Martinez', roleName: 'Presidente' },
  { memberName: 'Roberto Aguilar', roleName: 'Vicepresidente' },
  { memberName: 'Patricia Cruz', roleName: 'Secretario' },
  { memberName: 'Carlos Fernandez', roleName: 'Vocal' },
] as const;

export async function seedBoardMembers(
  prisma: PrismaClient,
  board: Board,
  membersByName: Map<string, Member>,
): Promise<number> {
  const roleTypes = await prisma.boardRoleType.findMany({
    where: { idBoard: board.id },
  });
  const roleTypesByName = new Map(roleTypes.map((r) => [r.name, r]));

  let count = 0;
  for (const data of DEMO_BOARD_MEMBERS) {
    const member = membersByName.get(data.memberName);
    if (!member) {
      throw new Error(
        `Seed board members: no se encontro el miembro "${data.memberName}".`,
      );
    }
    const roleType = roleTypesByName.get(data.roleName);
    if (!roleType) {
      throw new Error(
        `Seed board members: no se encontro el rol de concilio "${data.roleName}".`,
      );
    }

    const existing = await prisma.boardMember.findFirst({
      where: {
        idMember: member.id,
        idBoard: board.id,
        idBoardRoleType: roleType.id,
      },
    });

    const payload = {
      idMember: member.id,
      idBoard: board.id,
      idBoardRoleType: roleType.id,
      startDate: board.startDate,
      endDate: null, // "en funciones" — sin fecha de conclusion
      active: true,
    };

    if (existing) {
      await prisma.boardMember.update({
        where: { id: existing.id },
        data: payload,
      });
    } else {
      await prisma.boardMember.create({ data: payload });
    }
    count++;
  }

  return count;
}

if (require.main === module) {
  runSeed('miembros del concilio', async (prisma) => {
    const church = await loadChurch(prisma);
    const board = await loadActiveBoard(prisma, church.id);
    const members = await loadMembersByName(prisma, church.id);
    const count = await seedBoardMembers(prisma, board, members);
    console.log(`Miembros del concilio seedeados: ${count}`);
  });
}
