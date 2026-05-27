import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { Member, Prisma } from '@prisma/client';
import type { JwtPayload } from '../../auth/strategies/jwt.strategy';
import { CreateMemberDto } from './dto/create-member.dto';
import { MemberListItemResponseDto } from './dto/member-list-item.response.dto';
import { MemberCreatedResponseDto } from './dto/member-created.response.dto';
import { MembersPageResponseDto } from './dto/members-page.response.dto';
import { ListMembersQueryDto } from './dto/list-members-query.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { DocumentType } from './doc-type-enum';

@Injectable()
export class MembersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createMemberDto: CreateMemberDto,
    user: JwtPayload,
  ): Promise<MemberCreatedResponseDto> {
    const userRecord = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: { idChurch: true },
    });

    if (!userRecord) {
      throw new BadRequestException('Usuario no encontrado');
    }

    const idChurch = userRecord.idChurch;

    if (!idChurch) {
      throw new BadRequestException('El usuario no tiene iglesia asignada');
    }

    if (
      createMemberDto.documentType === DocumentType.DNI ||
      createMemberDto.documentType === DocumentType.BIRTH_CERTIFICATE
    ) {
      const dniRegex = /^\d{13}$/;
      if (!dniRegex.test(createMemberDto.documentNumber)) {
        throw new BadRequestException(
          'El número de documento debe tener 13 dígitos para el tipo DNI',
        );
      }
    } else if (createMemberDto.documentType === DocumentType.PASSPORT) {
      const passportRegex = /^[a-zA-Z]{1}[0-9]{6,9}$/;
      if (!passportRegex.test(createMemberDto.documentNumber)) {
        throw new BadRequestException(
          'El número de documento debe tener entre 6 y 9 caracteres alfanuméricos para el tipo PASSPORT',
        );
      }
    } else {
      throw new BadRequestException('Tipo de documento no soportado');
    }

    const existing = await this.prisma.member.findUnique({
      where: {
        documentType_documentNumber: {
          documentType: createMemberDto.documentType,
          documentNumber: createMemberDto.documentNumber,
        },
      },
      select: { id: true, active: true },
    });
    if (existing) {
      throw new ConflictException('El numero de identificacion ya existe');
    }

    const member = await this.prisma.member.create({
      data: {
        idChurch,
        name: createMemberDto.name,
        documentType: createMemberDto.documentType,
        documentNumber: createMemberDto.documentNumber,
        profession: createMemberDto.profession,
        birthDate: createMemberDto.birthDate,
        phone: createMemberDto.phone,
        personalEmail: createMemberDto.personalEmail,
        address: createMemberDto.address,
        baptismDate: createMemberDto.baptismDate,
        joinDate: createMemberDto.joinDate,
        inactivatedAt: createMemberDto.inactivatedAt,
      },
      select: { id: true },
    });
    return { id: member.id };
  }

  async findAll(query: ListMembersQueryDto): Promise<MembersPageResponseDto> {
    const page = query.page ?? 1;
    const size = query.size ?? 20;
    const name = query.name?.trim();
    const where: Prisma.MemberWhereInput = {};

    if (query.active !== undefined) {
      where.active = query.active;
    }

    if (query.name !== undefined) {
      where.name = { contains: name, mode: 'insensitive' };
    }

    const [total, members] = await this.prisma.$transaction([
      this.prisma.member.count({ where }),
      this.prisma.member.findMany({
        where,
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * size,
        take: size,
      }),
    ]);

    return {
      data: members.map((member) => this.toListItem(member)),
      total,
      page,
      size,
    };
  }

  findOne(id: number) {
    return `This action returns a #${id} member`;
  }

  remove(id: number) {
    return `This action removes a #${id} member`;
  }

  private toListItem(member: Member): MemberListItemResponseDto {
    return {
      id: member.id,
      idChurch: member.idChurch,
      name: member.name,
      documentType: member.documentType as DocumentType,
      documentNumber: member.documentNumber,
      profession: member.profession,
      birthDate: member.birthDate,
      phone: member.phone,
      personalEmail: member.personalEmail,
      address: member.address,
      baptismDate: member.baptismDate,
      joinDate: member.joinDate,
      inactivatedAt: member.inactivatedAt,
      active: member.active,
    };
  }
}
