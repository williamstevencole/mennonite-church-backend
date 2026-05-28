import { Member, Ministry, PrismaClient } from '@prisma/client';

const DEMO_MINISTRY_MEMBERS = [
  {
    ministryCode: 'ALABANZA',
    memberName: 'Jose Hernandez',
    roleName: 'Lider de Ministerio',
  },
  { ministryCode: 'ALABANZA', memberName: 'Andrea Quin', roleName: 'Servidor' },
  {
    ministryCode: 'JOVENES',
    memberName: 'David Zelaya',
    roleName: 'Lider de Ministerio',
  },
  {
    ministryCode: 'JOVENES',
    memberName: 'William Cole',
    roleName: 'Coordinador',
  },
  {
    ministryCode: 'NINOS',
    memberName: 'Sofia Gomez',
    roleName: 'Lider de Ministerio',
  },
  {
    ministryCode: 'DAMAS',
    memberName: 'Maria Lopez',
    roleName: 'Lider de Ministerio',
  },
  {
    ministryCode: 'DAMAS',
    memberName: 'Lucia Paredes',
    roleName: 'Colaborador',
  },
  {
    ministryCode: 'CABALLEROS',
    memberName: 'Luis Mejia',
    roleName: 'Lider de Ministerio',
  },
  {
    ministryCode: 'EVANGELISMO',
    memberName: 'Manuel Rosales',
    roleName: 'Lider de Ministerio',
  },
  {
    ministryCode: 'SERVIDORES',
    memberName: 'Ana Rivera',
    roleName: 'Coordinador',
  },
] as const;

export async function seedMinistryMembers(
  prisma: PrismaClient,
  ministriesByCode: Map<string, Ministry>,
  membersByName: Map<string, Member>,
): Promise<number> {
  const roleTypes = await prisma.memberRoleType.findMany({
    where: { belongsTo: 'Ministry' },
  });
  const roleTypesByName = new Map(roleTypes.map((r) => [r.name, r]));

  const startDate = new Date(new Date().getFullYear(), 0, 1);

  let count = 0;
  for (const data of DEMO_MINISTRY_MEMBERS) {
    const ministry = ministriesByCode.get(data.ministryCode);
    if (!ministry) {
      throw new Error(
        `Seed ministry members: no se encontro el ministerio "${data.ministryCode}".`,
      );
    }
    const member = membersByName.get(data.memberName);
    if (!member) {
      throw new Error(
        `Seed ministry members: no se encontro el miembro "${data.memberName}".`,
      );
    }
    const roleType = roleTypesByName.get(data.roleName);
    if (!roleType) {
      throw new Error(
        `Seed ministry members: no se encontro el rol de ministerio "${data.roleName}".`,
      );
    }

    const existing = await prisma.ministryMember.findFirst({
      where: {
        idMember: member.id,
        idMinistry: ministry.id,
        idMemberRoleType: roleType.id,
      },
    });

    const payload = {
      idMember: member.id,
      assignmentType: 'ministry',
      idMinistry: ministry.id,
      idMemberRoleType: roleType.id,
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
