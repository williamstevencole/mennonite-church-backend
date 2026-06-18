import { PrismaClient } from '@prisma/client';

// PRD §6.7 — tipos de eventos por categoria (calendar / trip / fundraising)
const EVENT_TYPES = [
  // calendar_event
  { name: 'Culto', eventCategory: 'calendar_event' },
  { name: 'Reunión Ministerial', eventCategory: 'calendar_event' },
  { name: 'Escuela Dominical', eventCategory: 'calendar_event' },
  { name: 'Aniversario', eventCategory: 'calendar_event' },
  { name: 'Actividad Especial', eventCategory: 'calendar_event' },
  // trip
  { name: 'Retiro', eventCategory: 'trip' },
  { name: 'Viaje Misionero', eventCategory: 'trip' },
  // fundraising
  { name: 'Barbacoa', eventCategory: 'fundraising' },
  { name: 'Cena Benéfica', eventCategory: 'fundraising' },
  { name: 'Rifa', eventCategory: 'fundraising' },
  { name: 'Venta Especial', eventCategory: 'fundraising' },
] as const;

export async function seedEventTypes(
  prisma: PrismaClient,
  idChurch: number,
): Promise<void> {
  await Promise.all(
    EVENT_TYPES.map(async ({ name, eventCategory }) => {
      const existing = await prisma.eventType.findFirst({
        where: { idChurch, name },
        select: { id: true },
      });
      return existing
        ? prisma.eventType.update({
            where: { id: existing.id },
            data: { eventCategory, active: true },
          })
        : prisma.eventType.create({
            data: { idChurch, name, eventCategory },
          });
    }),
  );
}
