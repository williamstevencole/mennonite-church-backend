import { City, Department, PrismaClient } from '@prisma/client';

import { loadDepartmentsByName, runSeed } from './_bootstrap';

const CITIES_BY_DEPARTMENT: Record<string, string[]> = {
  Atlántida: [
    'Arizona',
    'El Porvenir',
    'Esparta',
    'Jutiapa',
    'La Ceiba',
    'La Másica',
    'San Francisco',
    'Tela',
  ],
  Choluteca: [
    'Apacilagua',
    'Choluteca',
    'Concepción de María',
    'Duyure',
    'El Corpus',
    'El Triunfo',
    'Marcovia',
    'Morolica',
    'Namasigüe',
    'Orocuina',
    'Pespire',
    'San Antonio de Flores',
    'San Isidro',
    'San José',
    'San Marcos de Colón',
    'Santa Ana de Yusguare',
  ],
  Colón: [
    'Balfate',
    'Bonito Oriental',
    'Iriona',
    'Limón',
    'Sabá',
    'Santa Fe',
    'Santa Rosa de Aguán',
    'Sonaguera',
    'Tocoa',
    'Trujillo',
  ],
  Comayagua: [
    'Ajuterique',
    'Comayagua',
    'El Rosario',
    'Esquías',
    'Humuya',
    'La Libertad',
    'La Trinidad',
    'Lamaní',
    'Las Lajas',
    'Lejamaní',
    'Meámbar',
    'Minas de Oro',
    'Ojos de Agua',
    'San Jerónimo',
    'San José de Comayagua',
    'San José del Potrero',
    'San Luis',
    'San Sebastián',
    'Siguatepeque',
    'Taulabé',
    'Villa de San Antonio',
  ],
  Copán: [
    'Cabañas',
    'Concepción',
    'Copán Ruinas',
    'Corquín',
    'Cucuyagua',
    'Dolores',
    'Dulce Nombre',
    'El Paraíso',
    'Florida',
    'La Jigua',
    'La Unión',
    'Nueva Arcadia',
    'San Agustín',
    'San Antonio',
    'San Jerónimo',
    'San José',
    'San Juan de Opoa',
    'San Nicolás',
    'San Pedro',
    'Santa Rita',
    'Santa Rosa de Copán',
    'Trinidad de Copán',
    'Veracruz',
  ],
  Cortés: [
    'Choloma',
    'La Lima',
    'Omoa',
    'Pimienta',
    'Potrerillos',
    'Puerto Cortés',
    'San Antonio de Cortés',
    'San Francisco de Yojoa',
    'San Manuel',
    'San Pedro Sula',
    'Santa Cruz de Yojoa',
    'Villanueva',
  ],
  'El Paraíso': [
    'Alauca',
    'Danlí',
    'El Paraíso',
    'Güinope',
    'Jacaleapa',
    'Liure',
    'Morocelí',
    'Oropolí',
    'Potrerillos',
    'San Antonio de Flores',
    'San Lucas',
    'San Matías',
    'Soledad',
    'Teupasenti',
    'Texiguat',
    'Trojes',
    'Vado Ancho',
    'Yauyupe',
    'Yuscarán',
  ],
  'Francisco Morazán': [
    'Alubarén',
    'Cedros',
    'Curarén',
    'Distrito Central',
    'El Porvenir',
    'Guaimaca',
    'La Libertad',
    'La Venta',
    'Lepaterique',
    'Maraita',
    'Marale',
    'Nueva Armenia',
    'Ojojona',
    'Orica',
    'Reitoca',
    'Sabanagrande',
    'San Antonio de Oriente',
    'San Buenaventura',
    'San Ignacio',
    'San Juan de Flores',
    'San Miguelito',
    'Santa Ana',
    'Santa Lucía',
    'Talanga',
    'Tatumbla',
    'Valle de Ángeles',
    'Vallecillo',
    'Villa de San Francisco',
  ],
  'Gracias a Dios': [
    'Ahuas',
    'Brus Laguna',
    'Juan Francisco Bulnes',
    'Puerto Lempira',
    'Villeda Morales',
    'Wampusirpe',
  ],
  Intibucá: [
    'Camasca',
    'Colomoncagua',
    'Concepción',
    'Dolores',
    'Intibucá',
    'Jesús de Otoro',
    'La Esperanza',
    'Magdalena',
    'Masaguara',
    'San Antonio',
    'San Francisco de Opalaca',
    'San Isidro',
    'San Juan',
    'San Marcos de la Sierra',
    'San Miguel Guancapla',
    'Santa Lucía',
    'Yamaranguila',
  ],
  'Islas de la Bahía': ['Guanaja', 'José Santos Guardiola', 'Roatán', 'Utila'],
  'La Paz': [
    'Aguanqueterique',
    'Cabañas',
    'Cane',
    'Chinacla',
    'Guajiquiro',
    'La Paz',
    'Lauterique',
    'Marcala',
    'Mercedes de Oriente',
    'Opatoro',
    'San Antonio del Norte',
    'San José',
    'San Juan',
    'San Pedro de Tutule',
    'Santa Ana',
    'Santa Elena',
    'Santa María',
    'Santiago de Puringla',
    'Yarula',
  ],
  Lempira: [
    'Belén',
    'Candelaria',
    'Cololaca',
    'Erandique',
    'Gracias',
    'Gualcince',
    'Guarita',
    'La Campa',
    'La Iguala',
    'La Unión',
    'La Virtud',
    'Las Flores',
    'Lepaera',
    'Mapulaca',
    'Piraera',
    'San Andrés',
    'San Francisco',
    'San Juan Guarita',
    'San Manuel Colohete',
    'San Marcos de Caiquín',
    'San Rafael',
    'San Sebastián',
    'Santa Cruz',
    'Talgua',
    'Tambla',
    'Tomalá',
    'Valladolid',
    'Virginia',
  ],
  Ocotepeque: [
    'Belén Gualcho',
    'Concepción',
    'Dolores Merendón',
    'Fraternidad',
    'La Encarnación',
    'La Labor',
    'Lucerna',
    'Mercedes',
    'Ocotepeque',
    'San Fernando',
    'San Francisco del Valle',
    'San Jorge',
    'San Marcos',
    'Santa Fe',
    'Sensenti',
    'Sinuapa',
  ],
  Olancho: [
    'Campamento',
    'Catacamas',
    'Concordia',
    'Dulce Nombre de Culmí',
    'El Rosario',
    'Esquipulas del Norte',
    'Gualaco',
    'Guarizama',
    'Guata',
    'Guayape',
    'Jano',
    'Juticalpa',
    'La Unión',
    'Mangulile',
    'Manto',
    'Patuca',
    'Salamá',
    'San Esteban',
    'San Francisco de Becerra',
    'San Francisco de la Paz',
    'Santa María del Real',
    'Silca',
    'Yocón',
  ],
  'Santa Bárbara': [
    'Arada',
    'Atima',
    'Azacualpa',
    'Ceguaca',
    'Chinda',
    'Concepción del Norte',
    'Concepción del Sur',
    'El Níspero',
    'Gualala',
    'Ilama',
    'Las Vegas',
    'Macuelizo',
    'Naranjito',
    'Nueva Frontera',
    'Nuevo Celilac',
    'Petoa',
    'Protección',
    'Quimistán',
    'San Francisco de Ojuera',
    'San José de las Colinas',
    'San Luis',
    'San Marcos',
    'San Nicolás',
    'San Pedro Zacapa',
    'San Vicente Centenario',
    'Santa Bárbara',
    'Santa Rita',
    'Trinidad',
  ],
  Valle: [
    'Alianza',
    'Amapala',
    'Aramecina',
    'Caridad',
    'Goascorán',
    'Langue',
    'Nacaome',
    'San Francisco de Coray',
    'San Lorenzo',
  ],
  Yoro: [
    'Arenal',
    'El Negrito',
    'El Progreso',
    'Jocón',
    'Morazán',
    'Olanchito',
    'Santa Rita',
    'Sulaco',
    'Victoria',
    'Yoro',
    'Yorito',
  ],
};

export async function seedCities(
  prisma: PrismaClient,
  departmentsByName: Map<string, Department>,
): Promise<Map<string, City>> {
  const departmentIds = [...departmentsByName.values()].map((d) => d.id);

  const existing = await prisma.city.findMany({
    where: { idDepartment: { in: departmentIds } },
  });
  const existingKeys = new Set(
    existing.map((c) => `${c.idDepartment}:${c.name}`),
  );

  const toCreate: { name: string; idDepartment: number }[] = [];
  for (const [departmentName, cityNames] of Object.entries(
    CITIES_BY_DEPARTMENT,
  )) {
    const department = departmentsByName.get(departmentName);
    if (!department) {
      throw new Error(`Departamento no encontrado en seed: ${departmentName}`);
    }
    for (const name of cityNames) {
      if (!existingKeys.has(`${department.id}:${name}`)) {
        toCreate.push({ name, idDepartment: department.id });
      }
    }
  }

  if (toCreate.length > 0) {
    console.log(`  Insertando ${toCreate.length} ciudades nuevas...`);
    await prisma.city.createMany({ data: toCreate });
  } else {
    console.log('  Sin ciudades nuevas — todas ya existen.');
  }

  const allCities = await prisma.city.findMany({
    where: { idDepartment: { in: departmentIds } },
  });
  const cityByCompoundKey = new Map(
    allCities.map((c) => [`${c.idDepartment}:${c.name}`, c]),
  );

  const citiesByName = new Map<string, City>();
  for (const [departmentName, cityNames] of Object.entries(
    CITIES_BY_DEPARTMENT,
  )) {
    const department = departmentsByName.get(departmentName);
    if (!department) continue;
    for (const name of cityNames) {
      const city = cityByCompoundKey.get(`${department.id}:${name}`);
      if (city) citiesByName.set(name, city);
    }
  }

  return citiesByName;
}

if (require.main === module) {
  runSeed('ciudades', async (prisma) => {
    const departmentsByName = await loadDepartmentsByName(prisma);
    const cities = await seedCities(prisma, departmentsByName);
    console.log(`Ciudades seedeadas: ${cities.size}`);
  });
}
