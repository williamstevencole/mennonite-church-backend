import { City, Department, PrismaClient } from '@prisma/client';

const CITIES_BY_DEPARTMENT: Record<string, string[]> = {
  Cortes: [
    'San Pedro Sula',
    'Choloma',
    'Villanueva',
    'La Lima',
    'Puerto Cortes',
  ],
  'Francisco Morazan': ['Tegucigalpa', 'Comayaguela'],
  Atlantida: ['La Ceiba', 'Tela'],
  Yoro: ['El Progreso', 'Yoro'],
  Comayagua: ['Comayagua', 'Siguatepeque'],
  Choluteca: ['Choluteca'],
  Copan: ['Santa Rosa de Copan'],
  'Santa Barbara': ['Santa Barbara'],
  Olancho: ['Juticalpa', 'Catacamas'],
  'El Paraiso': ['Danli'],
  Intibuca: ['La Esperanza'],
  Lempira: ['Gracias'],
  'La Paz': ['La Paz'],
  Ocotepeque: ['Ocotepeque'],
  Valle: ['Nacaome'],
  Colon: ['Trujillo'],
  'Islas de la Bahia': ['Roatan'],
  'Gracias a Dios': ['Puerto Lempira'],
};

export async function seedCities(
  prisma: PrismaClient,
  departmentsByName: Map<string, Department>,
): Promise<Map<string, City>> {
  const citiesByName = new Map<string, City>();

  for (const [departmentName, cityNames] of Object.entries(
    CITIES_BY_DEPARTMENT,
  )) {
    const department = departmentsByName.get(departmentName);
    if (!department) {
      throw new Error(`Departamento no encontrado en seed: ${departmentName}`);
    }

    for (const name of cityNames) {
      const existing = await prisma.city.findFirst({
        where: { name, idDepartment: department.id },
      });
      const city = existing
        ? existing
        : await prisma.city.create({
            data: { name, idDepartment: department.id },
          });
      citiesByName.set(city.name, city);
    }
  }

  return citiesByName;
}
