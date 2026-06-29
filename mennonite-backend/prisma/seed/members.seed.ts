import { Member, PrismaClient } from '@prisma/client';

import { loadChurch, runSeed } from './_bootstrap';

const DEMO_MEMBERS = [
  {
    name: 'Oscar Martinez',
    documentType: 'National ID',
    documentNumber: '0501-1970-12345',
    profession: 'Pastor',
    birthDate: new Date('1970-04-12'),
    phone: '+504 9999-0001',
    personalEmail: 'oscar.martinez70@gmail.com',
    address: 'San Pedro Sula, Cortes',
    baptismDate: new Date('1990-06-15'),
    joinDate: new Date('1990-06-15'),
  },
  {
    name: 'Maria Lopez',
    documentType: 'National ID',
    documentNumber: '0501-1975-23456',
    profession: 'Maestra',
    birthDate: new Date('1975-09-08'),
    phone: '+504 9999-0002',
    personalEmail: 'maria.lopez75@hotmail.com',
    address: 'San Pedro Sula, Cortes',
    baptismDate: new Date('1995-12-20'),
    joinDate: new Date('1995-12-20'),
  },
  {
    name: 'Carlos Fernandez',
    documentType: 'National ID',
    documentNumber: '0501-1982-34567',
    profession: 'Contador',
    birthDate: new Date('1982-01-22'),
    phone: '+504 9999-0003',
    personalEmail: 'carlos.fdz82@gmail.com',
    address: 'San Pedro Sula, Cortes',
    baptismDate: new Date('2005-03-10'),
    joinDate: new Date('2005-03-10'),
  },
  {
    name: 'Ana Rivera',
    documentType: 'National ID',
    documentNumber: '0501-1990-45678',
    profession: 'Ingeniera',
    birthDate: new Date('1990-07-30'),
    phone: '+504 9999-0004',
    personalEmail: 'ana.rivera90@yahoo.com',
    address: 'San Pedro Sula, Cortes',
    baptismDate: new Date('2010-11-05'),
    joinDate: new Date('2010-11-05'),
  },
  {
    name: 'Jose Hernandez',
    documentType: 'National ID',
    documentNumber: '0501-1988-56789',
    profession: 'Musico',
    birthDate: new Date('1988-03-14'),
    phone: '+504 9999-0005',
    personalEmail: 'jose.hernandez.musica@gmail.com',
    address: 'San Pedro Sula, Cortes',
    baptismDate: new Date('2008-08-17'),
    joinDate: new Date('2008-08-17'),
  },
  {
    name: 'Sofia Gomez',
    documentType: 'National ID',
    documentNumber: '0501-1995-67890',
    profession: 'Enfermera',
    birthDate: new Date('1995-11-25'),
    phone: '+504 9999-0006',
    personalEmail: 'sofi.gomez95@outlook.com',
    address: 'San Pedro Sula, Cortes',
    baptismDate: new Date('2015-04-02'),
    joinDate: new Date('2015-04-02'),
  },
  {
    name: 'Luis Mejia',
    documentType: 'National ID',
    documentNumber: '0501-1985-78901',
    profession: 'Comerciante',
    birthDate: new Date('1985-05-19'),
    phone: '+504 9999-0007',
    personalEmail: 'luismejia85@hotmail.com',
    address: 'San Pedro Sula, Cortes',
    baptismDate: new Date('2009-07-12'),
    joinDate: new Date('2009-07-12'),
  },
  {
    name: 'Patricia Cruz',
    documentType: 'National ID',
    documentNumber: '0501-1992-89012',
    profession: 'Administradora',
    birthDate: new Date('1992-12-03'),
    phone: '+504 9999-0008',
    personalEmail: 'patty.cruz@gmail.com',
    address: 'San Pedro Sula, Cortes',
    baptismDate: new Date('2012-10-28'),
    joinDate: new Date('2012-10-28'),
  },
  {
    name: 'David Zelaya',
    documentType: 'National ID',
    documentNumber: '0501-1998-90123',
    profession: 'Ingeniero de Software',
    birthDate: new Date('1998-06-06'),
    phone: '+504 9999-0009',
    personalEmail: 'davidzelaya06.isj@gmail.com',
    address: 'San Pedro Sula, Cortes',
    baptismDate: new Date('2018-02-11'),
    joinDate: new Date('2018-02-11'),
  },
  {
    name: 'Andrea Quin',
    documentType: 'National ID',
    documentNumber: '0501-1999-01234',
    profession: 'Disenadora',
    birthDate: new Date('1999-09-21'),
    phone: '+504 9999-0010',
    personalEmail: 'andrea.quin99@gmail.com',
    address: 'San Pedro Sula, Cortes',
    baptismDate: new Date('2019-05-19'),
    joinDate: new Date('2019-05-19'),
  },
  {
    name: 'William Cole',
    documentType: 'National ID',
    documentNumber: '0501-1997-11223',
    profession: 'Ingeniero de Software',
    birthDate: new Date('1997-02-15'),
    phone: '+504 9999-0011',
    personalEmail: 'williamstevencole@gmail.com',
    address: 'San Pedro Sula, Cortes',
    baptismDate: new Date('2017-09-10'),
    joinDate: new Date('2017-09-10'),
  },
  {
    name: 'Roberto Aguilar',
    documentType: 'National ID',
    documentNumber: '0501-1978-22334',
    profession: 'Abogado',
    birthDate: new Date('1978-08-04'),
    phone: '+504 9999-0012',
    personalEmail: 'r.aguilar.abogado@gmail.com',
    address: 'San Pedro Sula, Cortes',
    baptismDate: new Date('2001-01-21'),
    joinDate: new Date('2001-01-21'),
  },
  {
    name: 'Lucia Paredes',
    documentType: 'National ID',
    documentNumber: '0501-1986-33445',
    profession: 'Doctora',
    birthDate: new Date('1986-10-17'),
    phone: '+504 9999-0013',
    personalEmail: 'dra.lucia.paredes@hotmail.com',
    address: 'San Pedro Sula, Cortes',
    baptismDate: new Date('2007-06-30'),
    joinDate: new Date('2007-06-30'),
  },
  {
    name: 'Manuel Rosales',
    documentType: 'National ID',
    documentNumber: '0501-1980-44556',
    profession: 'Arquitecto',
    birthDate: new Date('1980-04-09'),
    phone: '+504 9999-0014',
    personalEmail: 'manuel.rosales.arq@yahoo.com',
    address: 'San Pedro Sula, Cortes',
    baptismDate: new Date('2003-12-07'),
    joinDate: new Date('2003-12-07'),
  },
] as const;

export async function seedMembers(
  prisma: PrismaClient,
  idChurch: number,
): Promise<Map<string, Member>> {
  const membersByName = new Map<string, Member>();

  for (const data of DEMO_MEMBERS) {
    const member = await prisma.member.upsert({
      where: {
        documentType_documentNumber: {
          documentType: data.documentType,
          documentNumber: data.documentNumber,
        },
      },
      update: {
        idChurch,
        active: true,
      },
      create: {
        idChurch,
        name: data.name,
        documentType: data.documentType,
        documentNumber: data.documentNumber,
        profession: data.profession,
        birthDate: data.birthDate,
        phone: data.phone,
        personalEmail: data.personalEmail,
        address: data.address,
        baptismDate: data.baptismDate,
        joinDate: data.joinDate,
        active: true,
      },
    });
    membersByName.set(member.name, member);
  }

  return membersByName;
}

if (require.main === module) {
  runSeed('miembros', async (prisma) => {
    const church = await loadChurch(prisma);
    const members = await seedMembers(prisma, church.id);
    console.log(`Miembros seedeados: ${members.size}`);
  });
}
