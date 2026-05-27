import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import type { JwtPayload } from '../../auth/strategies/jwt.strategy';
import { CreateMemberDto } from './dto/create-member.dto';
import { MemberCreatedResponseDto } from './dto/member-created.response.dto';
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

  findAll() {
    return `This action returns all members`;
  }

  findOne(id: number) {
    return `This action returns a #${id} member`;
  }

  remove(id: number) {
    return `This action removes a #${id} member`;
  }
}
