import { Member, Ministry, PrismaClient } from '@prisma/client';

const DEMO_MINISTRY_MEMBERS = [
  {
    ministryName: 'Ministerio de Alabanza',
    memberName: 'Jose Hernandez',
    roleName: 'Lider de Ministerio',
  },
  {
    ministryName: 'Ministerio de Alabanza',
    memberName: 'Andrea Quin',
    roleName: 'Servidor',
  },
  {
    ministryName: 'Ministerio de Jovenes',
    memberName: 'David Zelaya',
    roleName: 'Lider de Ministerio',
  },
  {
    ministryName: 'Ministerio de Jovenes',
    memberName: 'William Cole',
    roleName: 'Coordinador',
  },
  {
    ministryName: 'Ministerio de Ninos',
    memberName: 'Sofia Gomez',
    roleName: 'Lider de Ministerio',
  },
  {
    ministryName: 'Ministerio de Damas',
    memberName: 'Maria Lopez',
    roleName: 'Lider de Ministerio',
  },
  {
    ministryName: 'Ministerio de Damas',
    memberName: 'Lucia Paredes',
    roleName: 'Colaborador',
  },
  {
    ministryName: 'Ministerio de Caballeros',
    memberName: 'Luis Mejia',
    roleName: 'Lider de Ministerio',
  },
  {
    ministryName: 'Ministerio de Evangelismo',
    memberName: 'Manuel Rosales',
    roleName: 'Lider de Ministerio',
  },
  {
    ministryName: 'Ministerio de Servidores',
    memberName: 'Ana Rivera',
    roleName: 'Coordinador',
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
