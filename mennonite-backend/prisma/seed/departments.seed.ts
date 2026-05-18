import { Department, PrismaClient } from '@prisma/client';

const DEPARTMENTS = [
  'Atlantida',
  'Choluteca',
  'Colon',
  'Comayagua',
  'Copan',
  'Cortes',
  'El Paraiso',
  'Francisco Morazan',
  'Gracias a Dios',
  'Intibuca',
  'Islas de la Bahia',
  'La Paz',
  'Lempira',
  'Ocotepeque',
  'Olancho',
  'Santa Barbara',
  'Valle',
  'Yoro',
] as const;

export async function seedDepartments(
  prisma: PrismaClient,
): Promise<Map<string, Department>> {
  const departmentsByName = new Map<string, Department>();

  for (const name of DEPARTMENTS) {
    const existing = await prisma.department.findFirst({ where: { name } });
    const department = existing
      ? existing
      : await prisma.department.create({ data: { name } });
    departmentsByName.set(department.name, department);
  }

  return departmentsByName;
}
