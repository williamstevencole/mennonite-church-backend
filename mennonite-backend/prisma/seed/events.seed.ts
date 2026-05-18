import { Ministry, PrismaClient } from '@prisma/client';

const YEAR = new Date().getFullYear();

type EventSeed = {
  title: string;
  description?: string;
  location?: string;
  eventTypeName: string;
  ministryCode?: string;
  isRecurrent: boolean;
  frequency?: string;
  dayOfWeek?: string;
  startDatetime: Date;
  endDatetime: Date;
  estimatedBudget?: number;
};

function at(year: number, month: number, day: number, hour: number, minute = 0): Date {
  return new Date(year, month - 1, day, hour, minute, 0);
}

const DEMO_EVENTS: EventSeed[] = [
  {
    title: 'Culto Dominical',
    description: 'Servicio dominical de adoracion, alabanza y predicacion.',
    location: 'Templo principal',
    eventTypeName: 'Culto Dominical',
    isRecurrent: true,
    frequency: 'weekly',
    dayOfWeek: 'Sunday',
    startDatetime: at(YEAR, 1, 4, 9, 0),
    endDatetime: at(YEAR, 1, 4, 11, 30),
  },
  {
    title: 'Escuela Dominical',
    description: 'Estudio biblico por grupos antes del culto.',
    location: 'Aulas',
    eventTypeName: 'Escuela Dominical',
    isRecurrent: true,
    frequency: 'weekly',
    dayOfWeek: 'Sunday',
    startDatetime: at(YEAR, 1, 4, 7, 30),
    endDatetime: at(YEAR, 1, 4, 8, 45),
  },
  {
    title: 'Reunion de Oracion',
    description: 'Reunion semanal de oracion intercesora.',
    location: 'Salon de oracion',
    eventTypeName: 'Reunion de Oracion',
    isRecurrent: true,
    frequency: 'weekly',
    dayOfWeek: 'Wednesday',
    startDatetime: at(YEAR, 1, 7, 19, 0),
    endDatetime: at(YEAR, 1, 7, 20, 30),
  },
  {
    title: 'Conferencia de Jovenes',
    description: 'Conferencia anual para jovenes de la iglesia.',
    location: 'Templo principal',
    eventTypeName: 'Conferencia',
    ministryCode: 'JOVENES',
    isRecurrent: false,
    startDatetime: at(YEAR, 7, 18, 18, 0),
    endDatetime: at(YEAR, 7, 20, 21, 0),
    estimatedBudget: 25000,
  },
  {
    title: 'Retiro Espiritual de Damas',
    description: 'Retiro de fin de semana para el Ministerio de Damas.',
    location: 'Centro de retiros',
    eventTypeName: 'Retiro Espiritual',
    ministryCode: 'DAMAS',
    isRecurrent: false,
    startDatetime: at(YEAR, 9, 12, 16, 0),
    endDatetime: at(YEAR, 9, 14, 14, 0),
    estimatedBudget: 40000,
  },
  {
    title: 'Cena Benefica Anual',
    description: 'Cena anual para recaudar fondos de proyectos de la iglesia.',
    location: 'Salon de eventos',
    eventTypeName: 'Cena Benefica',
    isRecurrent: false,
    startDatetime: at(YEAR, 11, 8, 19, 0),
    endDatetime: at(YEAR, 11, 8, 22, 0),
    estimatedBudget: 15000,
  },
];

export async function seedEvents(
  prisma: PrismaClient,
  idChurch: number,
  ministriesByCode: Map<string, Ministry>,
): Promise<void> {
  const eventTypes = await prisma.eventType.findMany();
  const eventTypeByName = new Map(eventTypes.map((et) => [et.name, et]));

  for (const data of DEMO_EVENTS) {
    const eventType = eventTypeByName.get(data.eventTypeName);
    if (!eventType) {
      throw new Error(`Tipo de evento no encontrado en seed: ${data.eventTypeName}`);
    }

    const ministry = data.ministryCode
      ? ministriesByCode.get(data.ministryCode)
      : undefined;

    const existing = await prisma.event.findFirst({
      where: { idChurch, title: data.title, startDatetime: data.startDatetime },
    });

    const payload = {
      idChurch,
      idEventType: eventType.id,
      idMinistry: ministry?.id ?? null,
      title: data.title,
      description: data.description ?? null,
      location: data.location ?? null,
      isRecurrent: data.isRecurrent,
      frequency: data.frequency ?? null,
      dayOfWeek: data.dayOfWeek ?? null,
      startDatetime: data.startDatetime,
      endDatetime: data.endDatetime,
      estimatedBudget: data.estimatedBudget ?? null,
      status: 'Planned',
    };

    if (existing) {
      await prisma.event.update({ where: { id: existing.id }, data: payload });
    } else {
      await prisma.event.create({ data: payload });
    }
  }
}
