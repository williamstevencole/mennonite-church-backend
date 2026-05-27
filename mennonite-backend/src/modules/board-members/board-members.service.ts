import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { BoardMemberDetailResponseDto } from './dto/board-member-detail.response.dto';
import { BoardMemberListItemResponseDto } from './dto/board-member-list-item.response.dto';
import { ListBoardMembersQueryDto } from './dto/list-board-members-query.dto';
import { BoardMemberMemberDetailResponseDto } from './dto/board-member-member-detail.response.dto';
import { BoardMemberMemberSummaryResponseDto } from './dto/board-member-member-summary.response.dto';
import { BoardMemberRoleResponseDto } from './dto/board-member-role.response.dto';

type BoardMemberListRecord = Prisma.BoardMemberGetPayload<{
  include: {
    member: { select: { id: true; name: true } };
    memberRoleType: { select: { id: true; name: true } };
  };
}>;

type BoardMemberDetailRecord = Prisma.BoardMemberGetPayload<{
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
  };
}>;

@Injectable()
export class BoardMembersService {
  constructor(private readonly prisma: PrismaService) {}

  async findOne(id: number): Promise<BoardMemberDetailResponseDto> {
    const boardMember = await this.prisma.boardMember.findFirst({
      where: { id, assignmentType: 'board' },
      include: this.detailInclude(),
    });

    if (!boardMember) {
      throw new NotFoundException(
        `Integrante de concilio con id ${id} no encontrado`,
      );
    }

    return this.toDetail(boardMember);
  }

  async findByBoard(
    boardId: number,
    query: ListBoardMembersQueryDto,
  ): Promise<BoardMemberListItemResponseDto[]> {
    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      select: { id: true },
    });

    if (!board) {
      throw new NotFoundException(`Concilio con id ${boardId} no encontrado`);
    }

    const where: Prisma.BoardMemberWhereInput = {
      idBoard: boardId,
      assignmentType: 'board',
    };

    if (query.active !== undefined) {
      where.active = query.active;
    }

    if (query.role) {
      const role = query.role.trim();
      if (/^\d+$/.test(role)) {
        where.idMemberRoleType = Number(role);
      } else {
        where.memberRoleType = {
          name: { equals: role, mode: 'insensitive' },
        };
      }
    }

    const members = await this.prisma.boardMember.findMany({
      where,
      include: this.listInclude(),
      orderBy: [{ member: { name: 'asc' } }, { id: 'asc' }],
    });

    return members.map((item) => this.toListItem(item));
  }

  private listInclude() {
    return {
      member: { select: { id: true, name: true } },
      memberRoleType: { select: { id: true, name: true } },
    };
  }

  private detailInclude() {
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
    };
  }

  private toListItem(
    record: BoardMemberListRecord,
  ): BoardMemberListItemResponseDto {
    return {
      id: record.id,
      member: this.toMemberSummary(record.member),
      role: this.toRole(record.memberRoleType),
      startDate: record.startDate,
      endDate: record.endDate,
      active: record.active,
    };
  }

  private toDetail(
    record: BoardMemberDetailRecord,
  ): BoardMemberDetailResponseDto {
    return {
      id: record.id,
      member: this.toMemberDetail(record.member),
      role: this.toRole(record.memberRoleType),
      startDate: record.startDate,
      endDate: record.endDate,
      active: record.active,
    };
  }

  private toRole(
    role: BoardMemberDetailRecord['memberRoleType'],
  ): BoardMemberRoleResponseDto {
    return {
      id: role.id,
      name: role.name,
    };
  }

  private toMemberSummary(
    member: BoardMemberListRecord['member'],
  ): BoardMemberMemberSummaryResponseDto {
    return {
      id: member.id,
      name: member.name,
    };
  }

  private toMemberDetail(
    member: BoardMemberDetailRecord['member'],
  ): BoardMemberMemberDetailResponseDto {
    return {
      id: member.id,
      name: member.name,
      documentType: member.documentType,
      documentNumber: member.documentNumber,
      profession: member.profession ?? null,
      birthDate: member.birthDate,
      phone: member.phone ?? null,
      personalEmail: member.personalEmail ?? null,
      address: member.address ?? null,
      baptismDate: member.baptismDate ?? null,
      joinDate: member.joinDate,
      active: member.active,
    };
  }
}
