import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MemberRoleBelongsTo } from '../member-role-types/member-role-belongs-to.enum';
import { BoardMemberCreatedResponseDto } from './dto/board-member-created.response.dto';
import { BoardMemberDetailResponseDto } from './dto/board-member-detail.response.dto';
import { BoardMemberListItemResponseDto } from './dto/board-member-list-item.response.dto';
import { ListBoardMembersQueryDto } from './dto/list-board-members-query.dto';
import { BoardMemberMemberDetailResponseDto } from './dto/board-member-member-detail.response.dto';
import { BoardMemberMemberSummaryResponseDto } from './dto/board-member-member-summary.response.dto';
import { BoardMemberRoleResponseDto } from './dto/board-member-role.response.dto';
import { CreateBoardMemberDto } from './dto/create-board-member.dto';
import { UpdateBoardMemberDto } from './dto/update-board-member.dto';

const UNIQUE_BOARD_ROLE_NAMES = new Set([
  'pastor',
  'presidente',
  'vice',
  'vicepresidente',
  'secretario',
  'tesorero',
]);

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

  async create(
    dto: CreateBoardMemberDto,
  ): Promise<BoardMemberCreatedResponseDto> {
    const [board, member, role] = await Promise.all([
      this.prisma.board.findUnique({
        where: { id: dto.id_board },
        select: { id: true },
      }),
      this.prisma.member.findUnique({
        where: { id: dto.id_member },
        select: { id: true, active: true },
      }),
      this.prisma.memberRoleType.findUnique({
        where: { id: dto.id_board_role_type },
        select: { id: true, name: true, belongsTo: true, active: true },
      }),
    ]);

    if (!board) {
      throw new BadRequestException('Concilio inexistente');
    }

    if (!member) {
      throw new BadRequestException('Miembro inexistente');
    }

    if (!member.active) {
      throw new BadRequestException('El miembro esta inactivo');
    }

    if (!role || !role.active) {
      throw new BadRequestException('Rol de concilio inexistente');
    }

    if (role.belongsTo !== MemberRoleBelongsTo.Council) {
      throw new BadRequestException('El rol no pertenece a concilio');
    }

    if (this.isUniqueRole(role.name)) {
      const duplicate = await this.prisma.boardMember.findFirst({
        where: {
          idBoard: dto.id_board,
          assignmentType: 'board',
          idMemberRoleType: role.id,
          active: true,
        },
        select: { id: true },
      });

      if (duplicate) {
        throw new ConflictException(
          `El rol ${role.name} ya esta asignado en este concilio`,
        );
      }
    }

    const startDate = new Date(dto.start_date);
    const endDate = dto.end_date ? new Date(dto.end_date) : null;
    if (endDate && endDate < startDate) {
      throw new BadRequestException(
        'La fecha de fin no puede ser anterior a la fecha de inicio',
      );
    }

    const created = await this.prisma.boardMember.create({
      data: {
        idBoard: dto.id_board,
        idMember: dto.id_member,
        idMemberRoleType: dto.id_board_role_type,
        assignmentType: 'board',
        startDate,
        endDate,
        active: true,
      },
      select: { id: true },
    });

    return { id: created.id };
  }

  async update(
    id: number,
    dto: UpdateBoardMemberDto,
  ): Promise<BoardMemberDetailResponseDto> {
    const existing = await this.prisma.boardMember.findFirst({
      where: { id, assignmentType: 'board' },
      select: {
        id: true,
        idBoard: true,
        idMemberRoleType: true,
        startDate: true,
        endDate: true,
      },
    });

    if (!existing) {
      throw new NotFoundException(
        `Integrante de concilio con id ${id} no encontrado`,
      );
    }

    const data: Prisma.BoardMemberUpdateInput = {};

    let roleName: string | null = null;
    if (dto.id_board_role_type !== undefined) {
      const role = await this.prisma.memberRoleType.findUnique({
        where: { id: dto.id_board_role_type },
        select: { id: true, name: true, belongsTo: true, active: true },
      });

      if (!role || !role.active) {
        throw new BadRequestException('Rol de concilio inexistente');
      }

      if (role.belongsTo !== MemberRoleBelongsTo.Council) {
        throw new BadRequestException('El rol no pertenece a concilio');
      }

      roleName = role.name;
      data.memberRoleType = { connect: { id: role.id } };

      if (this.isUniqueRole(role.name)) {
        const duplicate = await this.prisma.boardMember.findFirst({
          where: {
            idBoard: existing.idBoard,
            assignmentType: 'board',
            idMemberRoleType: role.id,
            active: true,
            NOT: { id },
          },
          select: { id: true },
        });

        if (duplicate) {
          throw new ConflictException(
            `El rol ${role.name} ya esta asignado en este concilio`,
          );
        }
      }
    }

    if (dto.start_date !== undefined) {
      data.startDate = new Date(dto.start_date);
    }

    if (dto.end_date !== undefined) {
      data.endDate = new Date(dto.end_date);
    }

    const resolvedStartDate =
      dto.start_date !== undefined
        ? new Date(dto.start_date)
        : existing.startDate;
    const resolvedEndDate =
      dto.end_date !== undefined ? new Date(dto.end_date) : existing.endDate;

    if (resolvedEndDate && resolvedEndDate < resolvedStartDate) {
      throw new BadRequestException(
        'La fecha de fin no puede ser anterior a la fecha de inicio',
      );
    }

    if (Object.keys(data).length === 0) {
      return this.findOne(id);
    }

    const updated = await this.prisma.boardMember.update({
      where: { id },
      data,
      include: this.detailInclude(),
    });

    const detail = this.toDetail(updated);

    if (roleName) {
      detail.role.name = roleName;
    }

    return detail;
  }

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

  async remove(id: number): Promise<void> {
    const boardMember = await this.prisma.boardMember.findFirst({
      where: { id, assignmentType: 'board' },
      select: { id: true, active: true },
    });

    if (!boardMember) {
      throw new NotFoundException(
        `Integrante de concilio con id ${id} no encontrado`,
      );
    }

    if (!boardMember.active) {
      return;
    }

    await this.prisma.boardMember.update({
      where: { id },
      data: { active: false },
    });
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

  private isUniqueRole(name: string): boolean {
    return UNIQUE_BOARD_ROLE_NAMES.has(name.trim().toLowerCase());
  }
}
