import { Member, Ministry, PrismaClient } from '@prisma/client';

import {
  loadChurch,
  loadMembersByName,
  loadMinistriesByName,
  runSeed,
} from './_bootstrap';

const DEMO_MINISTRY_MEMBERS = [
  {
    ministryName: 'Alabanza y Adoración',
    memberName: 'Jose Hernandez',
    roleName: 'Líder',
  },
  {
    ministryName: 'Alabanza y Adoración',
    memberName: 'Andrea Quin',
    roleName: 'Miembro',
  },
  {
    ministryName: 'Jóvenes',
    memberName: 'David Zelaya',
    roleName: 'Líder',
  },
  {
    ministryName: 'Jóvenes',
    memberName: 'William Cole',
    roleName: 'Co-líder',
  },
  {
    ministryName: 'Escuela Dominical',
    memberName: 'Sofia Gomez',
    roleName: 'Líder',
  },
  {
    ministryName: 'Escuela Dominical',
    memberName: 'Patricia Cruz',
    roleName: 'Maestro',
  },
  {
    ministryName: 'Damas',
    memberName: 'Maria Lopez',
    roleName: 'Líder',
  },
  {
    ministryName: 'Damas',
    memberName: 'Lucia Paredes',
    roleName: 'Miembro',
  },
  {
    ministryName: 'Caballeros',
    memberName: 'Luis Mejia',
    roleName: 'Líder',
  },
  {
    ministryName: 'Misiones',
    memberName: 'Manuel Rosales',
    roleName: 'Líder',
  },
  {
    ministryName: 'Ujieres',
    memberName: 'Ana Rivera',
    roleName: 'Líder',
  },
] as const;

export async function seedMinistryMembers(
  prisma: PrismaClient,
  ministriesByName: Map<string, Ministry>,
  membersByName: Map<string, Member>,
): Promise<number> {
  const startDate = new Date(new Date().getFullYear(), 0, 1);

  let count = 0;
  for (const data of DEMO_MINISTRY_MEMBERS) {
    const ministry = ministriesByName.get(data.ministryName);
    if (!ministry) {
      throw new Error(
        `Seed ministry members: no se encontro el ministerio "${data.ministryName}".`,
      );
    }
    const member = membersByName.get(data.memberName);
    if (!member) {
      throw new Error(
        `Seed ministry members: no se encontro el miembro "${data.memberName}".`,
      );
    }

    const roleType = await prisma.ministryRoleType.findFirst({
      where: { idMinistry: ministry.id, name: data.roleName },
    });
    if (!roleType) {
      throw new Error(
        `Seed ministry members: no se encontro el rol de ministerio "${data.roleName}" en "${data.ministryName}".`,
      );
    }

    const existing = await prisma.ministryMember.findFirst({
      where: {
        idMember: member.id,
        idMinistry: ministry.id,
        idMinistryRoleType: roleType.id,
      },
    });

    const payload = {
      idMember: member.id,
      idMinistry: ministry.id,
      idMinistryRoleType: roleType.id,
      startDate,
      active: true,
    };

    if (existing) {
      await prisma.ministryMember.update({
        where: { id: existing.id },
        data: payload,
      });
    } else {
      await prisma.ministryMember.create({ data: payload });
    }
    count++;
  }

  return count;
}

if (require.main === module) {
  runSeed('miembros de ministerio', async (prisma) => {
    const church = await loadChurch(prisma);
    const ministries = await loadMinistriesByName(prisma, church.id);
    const members = await loadMembersByName(prisma, church.id);
    const count = await seedMinistryMembers(prisma, ministries, members);
    console.log(`Miembros de ministerio seedeados: ${count}`);
  });
}
