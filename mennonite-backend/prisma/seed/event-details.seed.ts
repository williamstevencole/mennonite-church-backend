import { Member, PrismaClient } from '@prisma/client';

type EventDetailSeed = {
  eventTitle: string;
  responsibleMemberNames: string[];
  attendeeMemberNames: string[];
  trip?: { origin: string; destination: string; notes?: string };
  fundraising?: { targetAmount: number; notes?: string };
};

const DEMO_EVENT_DETAILS: EventDetailSeed[] = [
  {
    eventTitle: 'Culto Dominical',
    responsibleMemberNames: ['Oscar Martinez'],
    attendeeMemberNames: ['Maria Lopez', 'Carlos Fernandez'],
  },
  {
    eventTitle: 'Escuela Dominical',
    responsibleMemberNames: ['Maria Lopez'],
    attendeeMemberNames: ['Sofia Gomez', 'Andrea Quin'],
  },
  {
    eventTitle: 'Reunión de Oración',
    responsibleMemberNames: ['Patricia Cruz'],
    attendeeMemberNames: ['Lucia Paredes', 'Ana Rivera'],
  },
  {
    eventTitle: 'Conferencia de Jóvenes',
    responsibleMemberNames: ['David Zelaya'],
    attendeeMemberNames: ['William Cole', 'Andrea Quin'],
    trip: {
      origin: 'IMCSP - San Pedro Sula',
      destination: 'Campamento Las Brisas, Siguatepeque',
      notes: 'Transporte coordinado por el ministerio de jóvenes.',
    },
  },
  {
    eventTitle: 'Retiro Espiritual de Damas',
    responsibleMemberNames: ['Maria Lopez'],
    attendeeMemberNames: ['Lucia Paredes', 'Patricia Cruz'],
    trip: {
      origin: 'IMCSP - San Pedro Sula',
      destination: 'Centro de retiros Pico Bonito, La Ceiba',
    },
  },
  {
    eventTitle: 'Cena Benéfica Anual',
    responsibleMemberNames: ['Carlos Fernandez'],
    attendeeMemberNames: ['Roberto Aguilar', 'Manuel Rosales'],
    fundraising: {
      targetAmount: 80000,
      notes: 'Fondos destinados a remodelación del templo principal.',
    },
  },
];

export async function seedEventDetails(
  prisma: PrismaClient,
  idChurch: number,
  membersByName: Map<string, Member>,
): Promise<{
  responsibles: number;
  attendances: number;
  trips: number;
  fundraisings: number;
}> {
  let responsibles = 0;
  let attendances = 0;
  let trips = 0;
  let fundraisings = 0;

  for (const data of DEMO_EVENT_DETAILS) {
    const event = await prisma.event.findFirst({
      where: { idChurch, title: data.eventTitle },
    });
    if (!event) {
      throw new Error(
        `Seed event details: no se encontro el evento "${data.eventTitle}".`,
      );
    }

    for (const memberName of data.responsibleMemberNames) {
      const member = membersByName.get(memberName);
      if (!member) {
        throw new Error(
          `Seed event details: no se encontro el miembro "${memberName}".`,
        );
      }
      await prisma.eventResponsibleMember.upsert({
        where: {
          idEvent_idMember: { idEvent: event.id, idMember: member.id },
        },
        update: {},
        create: { idEvent: event.id, idMember: member.id },
      });
      responsibles++;
    }

    for (const memberName of data.attendeeMemberNames) {
      const member = membersByName.get(memberName);
      if (!member) {
        throw new Error(
          `Seed event details: no se encontro el miembro "${memberName}".`,
        );
      }
      await prisma.memberEvent.upsert({
        where: {
          idEvent_idMember: { idEvent: event.id, idMember: member.id },
        },
        update: { attended: true },
        create: {
          idEvent: event.id,
          idMember: member.id,
          attended: true,
        },
      });
      attendances++;
    }

    if (data.trip) {
      await prisma.tripDetail.upsert({
        where: { idEvent: event.id },
        update: {
          origin: data.trip.origin,
          destination: data.trip.destination,
          notes: data.trip.notes ?? null,
        },
        create: {
          idEvent: event.id,
          origin: data.trip.origin,
          destination: data.trip.destination,
          notes: data.trip.notes ?? null,
        },
      });
      trips++;
    }

    if (data.fundraising) {
      await prisma.fundraisingDetail.upsert({
        where: { idEvent: event.id },
        update: {
          targetAmount: data.fundraising.targetAmount,
          notes: data.fundraising.notes ?? null,
        },
        create: {
          idEvent: event.id,
          targetAmount: data.fundraising.targetAmount,
          notes: data.fundraising.notes ?? null,
        },
      });
      fundraisings++;
    }
  }

  return { responsibles, attendances, trips, fundraisings };
}
