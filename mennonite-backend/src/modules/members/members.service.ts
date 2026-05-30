import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '@prisma/client';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { MemberListItemResponseDto } from './dto/member-list-item.response.dto';
import { MemberDetailResponseDto } from './dto/member-detail.response.dto';
import { MemberCreatedResponseDto } from './dto/member-created.response.dto';
import { MembersPageResponseDto } from './dto/members-page.response.dto';
import { ListMembersQueryDto } from './dto/list-members-query.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { DocumentType } from './doc-type-enum';

type MemberListWithRelations = Prisma.MemberGetPayload<{
  include: {
    church: { select: { id: true; name: true } };
    user: { select: { id: true; email: true; active: true; idUserRole: true } };
  };
}>;

const DNI_REGEX = /^\d{4}-\d{4}-\d{5}$/;
const PASSPORT_REGEX = /^[a-zA-Z]{1}[0-9]{6,9}$/;

@Injectable()
export class MembersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createMemberDto: CreateMemberDto,
    user: JwtPayload,
  ): Promise<MemberCreatedResponseDto> {
    const idChurch = await this.resolveChurchId(user);

    this.validateDocumentNumber(
      createMemberDto.documentType,
      createMemberDto.documentNumber,
    );

    const existing = await this.prisma.member.findUnique({
      where: {
        documentType_documentNumber: {
          documentType: createMemberDto.documentType,
          documentNumber: createMemberDto.documentNumber,
        },
      },
      select: { id: true },
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
        createdBy: user.sub,
      },
      select: { id: true },
    });
    return { id: member.id };
  }

  async findAll(
    query: ListMembersQueryDto,
    user: JwtPayload,
  ): Promise<MembersPageResponseDto> {
    const idChurch = await this.resolveChurchId(user);
    const page = query.page ?? 1;
    const size = query.size ?? 20;
    const name = query.name?.trim();
    const where: Prisma.MemberWhereInput = { idChurch };

    if (query.active !== undefined) {
      where.active = query.active;
    }

    if (name) {
      where.name = { contains: name, mode: 'insensitive' };
    }

    const [total, members] = await this.prisma.$transaction([
      this.prisma.member.count({ where }),
      this.prisma.member.findMany({
        where,
        include: {
          church: { select: { id: true, name: true } },
          user: {
            select: { id: true, email: true, active: true, idUserRole: true },
          },
        },
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

  async findOne(
    id: number,
    user: JwtPayload,
  ): Promise<MemberDetailResponseDto> {
    const idChurch = await this.resolveChurchId(user);
    const member = await this.prisma.member.findFirst({
      where: { id, idChurch },
      include: {
        church: { select: { id: true, name: true } },
        createdByUser: { select: { id: true, email: true } },
        user: {
          select: { id: true, email: true, active: true, idUserRole: true },
        },
        boardMembers: {
          select: {
            id: true,
            assignmentType: true,
            idBoard: true,
            idMemberRoleType: true,
            startDate: true,
            endDate: true,
            active: true,
          },
        },
        ministryMembers: {
          select: {
            id: true,
            assignmentType: true,
            idMinistry: true,
            idMemberRoleType: true,
            startDate: true,
            endDate: true,
            active: true,
          },
        },
        eventResponsibilities: { select: { id: true, idEvent: true } },
        memberEvents: {
          select: {
            id: true,
            idEvent: true,
            attended: true,
            notes: true,
            createdAt: true,
          },
        },
      },
    });

    if (!member) {
      throw new NotFoundException(`Miembro ${id} no encontrado`);
    }

    const m = member;

    return {
      id: m.id,
      idChurch: m.idChurch,
      name: m.name,
      documentType: m.documentType as DocumentType,
      documentNumber: m.documentNumber,
      profession: m.profession ?? null,
      birthDate: m.birthDate,
      phone: m.phone ?? null,
      personalEmail: m.personalEmail ?? null,
      address: m.address ?? null,
      baptismDate: m.baptismDate ?? null,
      joinDate: m.joinDate,
      inactivatedAt: m.inactivatedAt ?? null,
      church: m.church ? { id: m.church.id, name: m.church.name } : null,
      createdBy: m.createdByUser
        ? { id: m.createdByUser.id, email: m.createdByUser.email }
        : null,
      linkedUser: m.user
        ? {
            id: m.user.id,
            email: m.user.email,
            active: m.user.active ?? false,
            idUserRole: m.user.idUserRole ?? null,
          }
        : null,
      boardMembers: m.boardMembers.map((b) => ({
        id: b.id,
        assignmentType: b.assignmentType,
        idBoard: b.idBoard ?? null,
        idMemberRoleType: b.idMemberRoleType,
        startDate: b.startDate,
        endDate: b.endDate ?? null,
        active: b.active,
      })),
      ministryMembers: m.ministryMembers.map((mm) => ({
        id: mm.id,
        assignmentType: mm.assignmentType,
        idMinistry: mm.idMinistry ?? null,
        idMemberRoleType: mm.idMemberRoleType,
        startDate: mm.startDate,
        endDate: mm.endDate ?? null,
        active: mm.active,
      })),
      eventResponsibilities: m.eventResponsibilities.map((er) => ({
        id: er.id,
        idEvent: er.idEvent,
      })),
      memberEvents: m.memberEvents.map((me) => ({
        id: me.id,
        idEvent: me.idEvent,
        attended: me.attended,
        notes: me.notes ?? null,
        createdAt: me.createdAt ?? null,
      })),
    };
  }

  async update(
    id: number,
    updateMemberDto: UpdateMemberDto,
    user: JwtPayload,
  ): Promise<MemberDetailResponseDto> {
    const idChurch = await this.resolveChurchId(user);
    const existing = await this.prisma.member.findFirst({
      where: { id, idChurch },
      select: { id: true, documentType: true, documentNumber: true },
    });

    if (!existing) {
      throw new NotFoundException(`Miembro ${id} no encontrado`);
    }

    const nextDocumentType =
      updateMemberDto.documentType ?? existing.documentType;
    const nextDocumentNumber =
      updateMemberDto.documentNumber ?? existing.documentNumber;

    const documentChanged =
      nextDocumentType !== existing.documentType ||
      nextDocumentNumber !== existing.documentNumber;

    if (documentChanged) {
      this.validateDocumentNumber(
        nextDocumentType as DocumentType,
        nextDocumentNumber,
      );

      const duplicate = await this.prisma.member.findFirst({
        where: {
          documentType: nextDocumentType,
          documentNumber: nextDocumentNumber,
          NOT: { id },
        },
        select: { id: true },
      });

      if (duplicate) {
        throw new ConflictException('El numero de identificacion ya existe');
      }
    }

    const data: Prisma.MemberUncheckedUpdateInput = {
      name: updateMemberDto.name,
      documentType: nextDocumentType,
      documentNumber: nextDocumentNumber,
      profession: updateMemberDto.profession,
      birthDate: updateMemberDto.birthDate,
      phone: updateMemberDto.phone,
      personalEmail: updateMemberDto.personalEmail,
      address: updateMemberDto.address,
      baptismDate: updateMemberDto.baptismDate,
      joinDate: updateMemberDto.joinDate,
      inactivatedAt: updateMemberDto.inactivatedAt,
    };

    await this.prisma.member.update({
      where: { id },
      data,
    });

    return this.findOne(id, user);
  }

  async remove(id: number, user: JwtPayload): Promise<void> {
    const idChurch = await this.resolveChurchId(user);
    const member = await this.prisma.member.findFirst({
      where: { id, idChurch },
      select: { id: true, active: true },
    });

    if (!member) {
      throw new NotFoundException(`Miembro ${id} no encontrado`);
    }

    if (!member.active) {
      return;
    }

    await this.prisma.member.update({
      where: { id },
      data: { active: false },
    });
  }

  private async resolveChurchId(user: JwtPayload): Promise<number> {
    const userRecord = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: { idChurch: true },
    });

    if (!userRecord) {
      throw new BadRequestException('Usuario no encontrado');
    }

    if (!userRecord.idChurch) {
      throw new BadRequestException('El usuario no tiene iglesia asignada');
    }

    return userRecord.idChurch;
  }

  private toListItem(
    member: MemberListWithRelations,
  ): MemberListItemResponseDto {
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
      church: member.church
        ? { id: member.church.id, name: member.church.name }
        : null,
      linkedUser: member.user
        ? {
            id: member.user.id,
            email: member.user.email,
            active: member.user.active ?? false,
            idUserRole: member.user.idUserRole ?? null,
          }
        : null,
    };
  }

  private validateDocumentNumber(
    documentType: DocumentType,
    documentNumber: string,
  ): void {
    if (documentType === DocumentType.DNI) {
      if (!DNI_REGEX.test(documentNumber)) {
        throw new BadRequestException(
          'El número de DNI debe tener el formato 0000-0000-00000',
        );
      }
      return;
    }

    if (documentType === DocumentType.PASSPORT) {
      if (!PASSPORT_REGEX.test(documentNumber)) {
        throw new BadRequestException(
          'El número de pasaporte debe ser 1 letra seguida de 6 a 9 dígitos',
        );
      }
      return;
    }

    if (documentType === DocumentType.BIRTH_CERTIFICATE) {
      const trimmed = documentNumber.trim();
      if (trimmed.length < 5 || trimmed.length > 30) {
        throw new BadRequestException(
          'El número del acta de nacimiento debe tener entre 5 y 30 caracteres',
        );
      }
      return;
    }

    throw new BadRequestException('Tipo de documento no soportado');
  }
}
