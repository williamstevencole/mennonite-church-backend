import { Department, PrismaClient } from '@prisma/client';

const DEPARTMENTS = [
  'Atlántida',
  'Choluteca',
  'Colón',
  'Comayagua',
  'Copán',
  'Cortés',
  'El Paraíso',
  'Francisco Morazán',
  'Gracias a Dios',
  'Intibucá',
  'Islas de la Bahía',
  'La Paz',
  'Lempira',
  'Ocotepeque',
  'Olancho',
  'Santa Bárbara',
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
