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
import { MembersPageResponseDto } from './dto/members-page.response.dto';
import { IdNameResponseDto } from '../../common/dto/id-name-response.dto';
import { ListMembersQueryDto } from './dto/list-members-query.dto';
import { PrismaService } from '../../prisma/prisma.service';
import {
  buildPagination,
  toPaginated,
} from '../../common/pagination/paginate.util';
import { DocumentType } from './doc-type-enum';
import { MembersBirthdaysPageResponseDto } from './dto/members-birthdays-page.response.dto';
import { MembersBirthdaysQueryDto } from './dto/member-birthdays-query.dto';

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
  ): Promise<IdNameResponseDto> {
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

    const active = createMemberDto.active ?? true;

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
        active,
        // INSERT has no trigger; keep inactivated_at consistent with `active`.
        inactivatedAt: active
          ? null
          : (createMemberDto.inactivatedAt ?? new Date()),
        createdBy: user.sub,
      },
      select: { id: true, name: true },
    });
    return { id: member.id, name: member.name };
  }

  async findAll(
    query: ListMembersQueryDto,
    user: JwtPayload,
  ): Promise<MembersPageResponseDto> {
    const idChurch = await this.resolveChurchId(user);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const name = query.name?.trim();
    const where: Prisma.MemberWhereInput = { idChurch };

    if (query.active !== undefined) {
      where.active = query.active;
    } else if (query.includeInactive !== true) {
      where.active = true;
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
        ...buildPagination(page, limit),
      }),
    ]);

    return toPaginated(
      members.map((member) => this.toListItem(member)),
      total,
      page,
      limit,
    );
  }

  async findOne(
    id: number,
    user: JwtPayload,
    includeInactive = false,
  ): Promise<MemberDetailResponseDto> {
    const idChurch = await this.resolveChurchId(user);
    const member = await this.prisma.member.findFirst({
      where: {
        id,
        idChurch,
        ...(includeInactive ? {} : { active: true }),
      },
      include: {
        church: { select: { id: true, name: true } },
        createdByUser: { select: { id: true, email: true } },
        user: {
          select: { id: true, email: true, active: true, idUserRole: true },
        },
        boardMembers: {
          select: {
            id: true,
            idBoard: true,
            idBoardRoleType: true,
            startDate: true,
            endDate: true,
            active: true,
          },
        },
        ministryMembers: {
          select: {
            id: true,
            idMinistry: true,
            idMinistryRoleType: true,
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
      active: m.active,
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
        idBoard: b.idBoard,
        idBoardRoleType: b.idBoardRoleType,
        startDate: b.startDate,
        endDate: b.endDate ?? null,
        active: b.active,
      })),
      ministryMembers: m.ministryMembers.map((mm) => ({
        id: mm.id,
        idMinistry: mm.idMinistry,
        idMinistryRoleType: mm.idMinistryRoleType,
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
  ): Promise<IdNameResponseDto> {
    const idChurch = await this.resolveChurchId(user);
    const existing = await this.prisma.member.findFirst({
      where: { id, idChurch },
      select: {
        id: true,
        documentType: true,
        documentNumber: true,
        active: true,
      },
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
    };

    // `active` is the source of truth for membership state. Keep inactivated_at
    // consistent with it (DB constraint: active=false <=> inactivated_at set).
    if (updateMemberDto.active !== undefined) {
      data.active = updateMemberDto.active;
      if (updateMemberDto.active && !existing.active) {
        data.inactivatedAt = null;
      } else if (!updateMemberDto.active && existing.active) {
        data.inactivatedAt = updateMemberDto.inactivatedAt ?? new Date();
      } else if (updateMemberDto.inactivatedAt !== undefined) {
        data.inactivatedAt = updateMemberDto.inactivatedAt;
      }
    } else if (updateMemberDto.inactivatedAt !== undefined) {
      data.inactivatedAt = updateMemberDto.inactivatedAt;
    }

    const updated = await this.prisma.member.update({
      where: { id },
      data,
      select: { id: true, name: true },
    });

    return { id: updated.id, name: updated.name };
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
  async findBirthdays(
    query: MembersBirthdaysQueryDto,
    user: JwtPayload,
  ): Promise<MembersBirthdaysPageResponseDto> {
    const idChurch = await this.resolveChurchId(user);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const month = query.month ?? new Date().getMonth() + 1;

    const now = new Date();
    const todayUTC = Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
    );
    const msPerDay = 1000 * 60 * 60 * 24;

    const members = await this.prisma.member.findMany({
      where: {
        idChurch,
        active: true,
        birthDate: { not: undefined },
      },
      select: {
        id: true,
        name: true,
        birthDate: true,
      },
    });

    const enriched = members
      .filter((m) => new Date(m.birthDate).getUTCMonth() + 1 === month)
      .map((m) => {
        const bd = new Date(m.birthDate);
        const bdMonth = bd.getUTCMonth();
        const bdDay = bd.getUTCDate();
        let nextUTC = Date.UTC(now.getUTCFullYear(), bdMonth, bdDay);
        if (nextUTC < todayUTC) {
          nextUTC = Date.UTC(now.getUTCFullYear() + 1, bdMonth, bdDay);
        }
        const daysUntilNextBirthday = Math.round(
          (nextUTC - todayUTC) / msPerDay,
        );
        return {
          id: m.id,
          name: m.name,
          birthDate: m.birthDate,
          dayOfMonth: bdDay,
          daysUntilNextBirthday,
        };
      })
      .sort((a, b) => a.daysUntilNextBirthday - b.daysUntilNextBirthday);

    const total = enriched.length;
    const sliced = enriched.slice((page - 1) * limit, page * limit);

    return toPaginated(sliced, total, page, limit);
  }
}
