import { PrismaClient } from '@prisma/client';

const EVENT_TYPES = [
  { name: 'Culto Dominical', eventCategory: 'calendar_event' },
  { name: 'Escuela Dominical', eventCategory: 'calendar_event' },
  { name: 'Reunion de Oracion', eventCategory: 'calendar_event' },
  { name: 'Conferencia', eventCategory: 'calendar_event' },
  { name: 'Retiro Espiritual', eventCategory: 'trip' },
  { name: 'Viaje Misionero', eventCategory: 'trip' },
  { name: 'Cena Benefica', eventCategory: 'fundraising' },
  { name: 'Venta Pro Fondos', eventCategory: 'fundraising' },
] as const;

export async function seedEventTypes(prisma: PrismaClient): Promise<void> {
  await Promise.all(
    EVENT_TYPES.map(({ name, eventCategory }) =>
      prisma.eventType.upsert({
        where: { name },
        update: { eventCategory },
        create: { name, eventCategory },
      }),
    ),
  );
}
