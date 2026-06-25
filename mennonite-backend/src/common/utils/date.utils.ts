const CHURCH_TIME_ZONE = 'America/Tegucigalpa';

/**
 * Returns today's date in the church's local timezone, anchored at UTC
 * midnight so Prisma `@db.Date` columns persist the wall-clock day instead
 * of shifting it forward by one when the server runs in UTC.
 */
export function todayInChurchTz(): Date {
  const ymd = new Date().toLocaleDateString('en-CA', {
    timeZone: CHURCH_TIME_ZONE,
  });
  return new Date(`${ymd}T00:00:00.000Z`);
}
