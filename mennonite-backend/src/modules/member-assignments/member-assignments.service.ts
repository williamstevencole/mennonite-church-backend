import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ListMemberAssignmentsQueryDto } from './dto/list-member-assignments-query.dto';
import { MemberAssignmentDetailResponseDto } from './dto/member-assignment-detail.response.dto';
import { MemberAssignmentListItemResponseDto } from './dto/member-assignment-list-item.response.dto';
import { MemberAssignmentMemberDetailResponseDto } from './dto/member-assignment-member-detail.response.dto';
import { MemberAssignmentMemberSummaryResponseDto } from './dto/member-assignment-member-summary.response.dto';
import { MemberAssignmentRoleResponseDto } from './dto/member-assignment-role.response.dto';
import { MemberAssignmentTargetResponseDto } from './dto/member-assignment-target.response.dto';
import { MemberAssignmentsPageResponseDto } from './dto/member-assignments-page.response.dto';
import { MemberAssignmentType } from './member-assignment-type.enum';

type BoardAssignmentListRecord = Prisma.BoardMemberGetPayload<{
  include: {
    member: { select: { id: true; name: true } };
    memberRoleType: { select: { id: true; name: true } };
    board: { select: { id: true; name: true } };
  };
}>;

type MinistryAssignmentListRecord = Prisma.MinistryMemberGetPayload<{
  include: {
    member: { select: { id: true; name: true } };
    memberRoleType: { select: { id: true; name: true } };
    ministry: { select: { id: true; name: true } };
  };
}>;

type BoardAssignmentDetailRecord = Prisma.BoardMemberGetPayload<{
  include: {
    member: {
      select: {
        id: true;
        name: true;
        documentType: true;
        documentNumber: true;
        profession: true;
        birthDate: true;
        phone: true;
        personalEmail: true;
        address: true;
        baptismDate: true;
        joinDate: true;
        active: true;
      };
    };
    memberRoleType: { select: { id: true; name: true } };
    board: { select: { id: true; name: true } };
  };
}>;

type MinistryAssignmentDetailRecord = Prisma.MinistryMemberGetPayload<{
  include: {
    member: {
      select: {
        id: true;
        name: true;
        documentType: true;
        documentNumber: true;
        profession: true;
        birthDate: true;
        phone: true;
        personalEmail: true;
        address: true;
        baptismDate: true;
        joinDate: true;
        active: true;
      };
    };
    memberRoleType: { select: { id: true; name: true } };
    ministry: { select: { id: true; name: true } };
  };
}>;

type RoleFilter = {
  idMemberRoleType?: number;
  memberRoleType?: Prisma.MemberRoleTypeWhereInput;
};

@Injectable()
export class MemberAssignmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    query: ListMemberAssignmentsQueryDto,
  ): Promise<MemberAssignmentsPageResponseDto> {
    const page = query.page ?? 1;
    const size = query.size ?? 20;
    const boardWhere: Prisma.BoardMemberWhereInput = {
      assignmentType: MemberAssignmentType.Board,
    };
    const ministryWhere: Prisma.MinistryMemberWhereInput = {
      assignmentType: MemberAssignmentType.Ministry,
    };

    if (query.active !== undefined) {
      boardWhere.active = query.active;
      ministryWhere.active = query.active;
    }

    if (query.memberId) {
      boardWhere.idMember = query.memberId;
      ministryWhere.idMember = query.memberId;
    }

    if (query.boardId) {
      boardWhere.idBoard = query.boardId;
    }

    if (query.ministryId) {
      ministryWhere.idMinistry = query.ministryId;
    }

    if (query.role) {
      const roleFilter = this.resolveRoleFilter(query.role);
      Object.assign(boardWhere, roleFilter);
      Object.assign(ministryWhere, roleFilter);
    }

    if (query.type === MemberAssignmentType.Board) {
      const [total, items] = await this.prisma.$transaction([
        this.prisma.boardMember.count({ where: boardWhere }),
        this.prisma.boardMember.findMany({
          where: boardWhere,
          include: this.boardListInclude(),
          orderBy: [{ member: { name: 'asc' } }, { id: 'asc' }],
          skip: (page - 1) * size,
          take: size,
        }),
      ]);

      return {
        data: items.map((item) => this.toListItemFromBoard(item)),
        total,
        page,
        size,
      };
    }

    if (query.type === MemberAssignmentType.Ministry) {
      const [total, items] = await this.prisma.$transaction([
        this.prisma.ministryMember.count({ where: ministryWhere }),
        this.prisma.ministryMember.findMany({
          where: ministryWhere,
          include: this.ministryListInclude(),
          orderBy: [{ member: { name: 'asc' } }, { id: 'asc' }],
          skip: (page - 1) * size,
          take: size,
        }),
      ]);

      return {
        data: items.map((item) => this.toListItemFromMinistry(item)),
        total,
        page,
        size,
      };
    }

    const [boardTotal, ministryTotal, boardItems, ministryItems] =
      await this.prisma.$transaction([
        this.prisma.boardMember.count({ where: boardWhere }),
        this.prisma.ministryMember.count({ where: ministryWhere }),
        this.prisma.boardMember.findMany({
          where: boardWhere,
          include: this.boardListInclude(),
          orderBy: [{ member: { name: 'asc' } }, { id: 'asc' }],
        }),
        this.prisma.ministryMember.findMany({
          where: ministryWhere,
          include: this.ministryListInclude(),
          orderBy: [{ member: { name: 'asc' } }, { id: 'asc' }],
        }),
      ]);

    const combined = [
      ...boardItems.map((item) => this.toListItemFromBoard(item)),
      ...ministryItems.map((item) => this.toListItemFromMinistry(item)),
    ].sort((a, b) => this.compareAssignments(a, b));

    const start = (page - 1) * size;
    return {
      data: combined.slice(start, start + size),
      total: boardTotal + ministryTotal,
      page,
      size,
    };
  }

  async findOne(id: number): Promise<MemberAssignmentDetailResponseDto> {
    const [boardAssignment, ministryAssignment] = await Promise.all([
      this.prisma.boardMember.findFirst({
        where: { id, assignmentType: MemberAssignmentType.Board },
        include: this.boardDetailInclude(),
      }),
      this.prisma.ministryMember.findFirst({
        where: { id, assignmentType: MemberAssignmentType.Ministry },
        include: this.ministryDetailInclude(),
      }),
    ]);

    if (boardAssignment) {
      return this.toDetailFromBoard(boardAssignment);
    }

    if (ministryAssignment) {
      return this.toDetailFromMinistry(ministryAssignment);
    }

    throw new NotFoundException(`Asignacion con id ${id} no encontrada`);
  }

  private resolveRoleFilter(role: string): RoleFilter {
    const trimmed = role.trim();
    if (/^\d+$/.test(trimmed)) {
      return { idMemberRoleType: Number(trimmed) };
    }
    return {
      memberRoleType: {
        name: { equals: trimmed, mode: 'insensitive' },
      },
    };
  }

  private boardListInclude() {
    return {
      member: { select: { id: true, name: true } },
      memberRoleType: { select: { id: true, name: true } },
      board: { select: { id: true, name: true } },
    };
  }

  private ministryListInclude() {
    return {
      member: { select: { id: true, name: true } },
      memberRoleType: { select: { id: true, name: true } },
      ministry: { select: { id: true, name: true } },
    };
  }

  private boardDetailInclude() {
    return {
      member: {
        select: {
          id: true,
          name: true,
          documentType: true,
          documentNumber: true,
          profession: true,
          birthDate: true,
          phone: true,
          personalEmail: true,
          address: true,
          baptismDate: true,
          joinDate: true,
          active: true,
        },
      },
      memberRoleType: { select: { id: true, name: true } },
      board: { select: { id: true, name: true } },
    };
  }

  private ministryDetailInclude() {
    return {
      member: {
        select: {
          id: true,
          name: true,
          documentType: true,
          documentNumber: true,
          profession: true,
          birthDate: true,
          phone: true,
          personalEmail: true,
          address: true,
          baptismDate: true,
          joinDate: true,
          active: true,
        },
      },
      memberRoleType: { select: { id: true, name: true } },
      ministry: { select: { id: true, name: true } },
    };
  }

  private compareAssignments(
    left: MemberAssignmentListItemResponseDto,
    right: MemberAssignmentListItemResponseDto,
  ): number {
    const nameCompare = left.member.name.localeCompare(right.member.name);
    if (nameCompare !== 0) return nameCompare;
    if (left.assignmentType !== right.assignmentType) {
      return left.assignmentType.localeCompare(right.assignmentType);
    }
    return left.id - right.id;
  }

  private toListItemFromBoard(
    record: BoardAssignmentListRecord,
  ): MemberAssignmentListItemResponseDto {
    return {
      id: record.id,
      assignmentType: MemberAssignmentType.Board,
      member: this.toMemberSummary(record.member),
      role: this.toRole(record.memberRoleType),
      target: this.toTarget(record.board),
      startDate: record.startDate,
      endDate: record.endDate,
      active: record.active,
    };
  }

  private toListItemFromMinistry(
    record: MinistryAssignmentListRecord,
  ): MemberAssignmentListItemResponseDto {
    return {
      id: record.id,
      assignmentType: MemberAssignmentType.Ministry,
      member: this.toMemberSummary(record.member),
      role: this.toRole(record.memberRoleType),
      target: this.toTarget(record.ministry),
      startDate: record.startDate,
      endDate: record.endDate,
      active: record.active,
    };
  }

  private toDetailFromBoard(
    record: BoardAssignmentDetailRecord,
  ): MemberAssignmentDetailResponseDto {
    return {
      id: record.id,
      assignmentType: MemberAssignmentType.Board,
      member: this.toMemberDetail(record.member),
      role: this.toRole(record.memberRoleType),
      target: this.toTarget(record.board),
      startDate: record.startDate,
      endDate: record.endDate,
      active: record.active,
    };
  }

  private toDetailFromMinistry(
    record: MinistryAssignmentDetailRecord,
  ): MemberAssignmentDetailResponseDto {
    return {
      id: record.id,
      assignmentType: MemberAssignmentType.Ministry,
      member: this.toMemberDetail(record.member),
      role: this.toRole(record.memberRoleType),
      target: this.toTarget(record.ministry),
      startDate: record.startDate,
      endDate: record.endDate,
      active: record.active,
    };
  }

  private toMemberSummary(
    member: BoardAssignmentListRecord['member'],
  ): MemberAssignmentMemberSummaryResponseDto {
    return {
      id: member.id,
      name: member.name,
    };
  }

  private toMemberDetail(
    member: BoardAssignmentDetailRecord['member'],
  ): MemberAssignmentMemberDetailResponseDto {
    return {
      id: member.id,
      name: member.name,
      documentType: member.documentType,
      documentNumber: member.documentNumber,
      profession: member.profession,
      birthDate: member.birthDate,
      phone: member.phone,
      personalEmail: member.personalEmail,
      address: member.address,
      baptismDate: member.baptismDate,
      joinDate: member.joinDate,
      active: member.active,
    };
  }

  private toRole(
    role: BoardAssignmentListRecord['memberRoleType'],
  ): MemberAssignmentRoleResponseDto {
    return {
      id: role.id,
      name: role.name,
    };
  }

  private toTarget(
    target: BoardAssignmentListRecord['board'] | null,
  ): MemberAssignmentTargetResponseDto | null {
    if (!target) {
      return null;
    }

    return {
      id: target.id,
      name: target.name,
    };
  }
}
