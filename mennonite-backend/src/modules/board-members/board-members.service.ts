import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  buildPagination,
  toPaginated,
} from '../../common/pagination/paginate.util';
import { IdResponseDto } from '../../common/dto/id-response.dto';
import { BoardMemberDetailResponseDto } from './dto/board-member-detail.response.dto';
import { BoardMemberListItemResponseDto } from './dto/board-member-list-item.response.dto';
import { BoardMembersPageResponseDto } from './dto/board-members-page.response.dto';
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
    boardRoleType: { select: { id: true; name: true } };
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
    boardRoleType: { select: { id: true; name: true } };
  };
}>;

@Injectable()
export class BoardMembersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    idChurch: number,
    dto: CreateBoardMemberDto,
  ): Promise<IdResponseDto> {
    const [board, member, role] = await Promise.all([
      this.prisma.board.findFirst({
        where: { id: dto.idBoard, idChurch },
        select: { id: true },
      }),
      this.prisma.member.findFirst({
        where: { id: dto.idMember, idChurch },
        select: { id: true, active: true },
      }),
      this.prisma.boardRoleType.findFirst({
        where: { id: dto.idBoardRoleType, idBoard: dto.idBoard },
        select: { id: true, name: true, active: true },
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

    if (this.isUniqueRole(role.name)) {
      const duplicate = await this.prisma.boardMember.findFirst({
        where: {
          idBoard: dto.idBoard,
          idBoardRoleType: role.id,
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

    const startDate = new Date(dto.startDate);
    const endDate = dto.endDate ? new Date(dto.endDate) : null;
    if (endDate && endDate < startDate) {
      throw new BadRequestException(
        'La fecha de fin no puede ser anterior a la fecha de inicio',
      );
    }

    const created = await this.prisma.boardMember.create({
      data: {
        idBoard: dto.idBoard,
        idMember: dto.idMember,
        idBoardRoleType: dto.idBoardRoleType,
        startDate,
        endDate,
        active: true,
      },
      select: { id: true },
    });

    return { id: created.id };
  }

  async update(
    idChurch: number,
    id: number,
    dto: UpdateBoardMemberDto,
  ): Promise<IdResponseDto> {
    const existing = await this.prisma.boardMember.findFirst({
      where: { id, board: { idChurch } },
      select: {
        id: true,
        idBoard: true,
        idBoardRoleType: true,
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

    if (dto.idBoardRoleType !== undefined) {
      const role = await this.prisma.boardRoleType.findFirst({
        where: { id: dto.idBoardRoleType, idBoard: existing.idBoard },
        select: { id: true, name: true, active: true },
      });

      if (!role || !role.active) {
        throw new BadRequestException('Rol de concilio inexistente');
      }

      data.boardRoleType = { connect: { id: role.id } };

      if (this.isUniqueRole(role.name)) {
        const duplicate = await this.prisma.boardMember.findFirst({
          where: {
            idBoard: existing.idBoard,
            idBoardRoleType: role.id,
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

    if (dto.startDate !== undefined) {
      data.startDate = new Date(dto.startDate);
    }

    if (dto.endDate !== undefined) {
      data.endDate = dto.endDate === null ? null : new Date(dto.endDate);
    }

    const resolvedStartDate =
      dto.startDate !== undefined
        ? new Date(dto.startDate)
        : existing.startDate;
    const resolvedEndDate =
      dto.endDate === null
        ? null
        : dto.endDate !== undefined
          ? new Date(dto.endDate)
          : existing.endDate;

    if (resolvedEndDate && resolvedEndDate < resolvedStartDate) {
      throw new BadRequestException(
        'La fecha de fin no puede ser anterior a la fecha de inicio',
      );
    }

    if (Object.keys(data).length === 0) {
      return { id: existing.id };
    }

    const updated = await this.prisma.boardMember.update({
      where: { id },
      data,
      select: { id: true },
    });

    return { id: updated.id };
  }

  async findOne(
    idChurch: number,
    id: number,
    includeInactive = false,
  ): Promise<BoardMemberDetailResponseDto> {
    const boardMember = await this.prisma.boardMember.findFirst({
      where: {
        id,
        board: { idChurch },
        ...(includeInactive ? {} : { active: true }),
      },
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
    idChurch: number,
    boardId: number,
    query: ListBoardMembersQueryDto,
  ): Promise<BoardMembersPageResponseDto> {
    const board = await this.prisma.board.findFirst({
      where: { id: boardId, idChurch },
      select: { id: true },
    });

    if (!board) {
      throw new NotFoundException(`Concilio con id ${boardId} no encontrado`);
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.BoardMemberWhereInput = {
      idBoard: boardId,
    };

    if (query.active !== undefined) {
      where.active = query.active;
    } else if (query.includeInactive !== true) {
      where.active = true;
    }

    if (query.role) {
      const role = query.role.trim();
      if (/^\d+$/.test(role)) {
        where.idBoardRoleType = Number(role);
      } else {
        where.boardRoleType = {
          name: { equals: role, mode: 'insensitive' },
        };
      }
    }

    const [total, members] = await this.prisma.$transaction([
      this.prisma.boardMember.count({ where }),
      this.prisma.boardMember.findMany({
        where,
        include: this.listInclude(),
        orderBy: [{ member: { name: 'asc' } }, { id: 'asc' }],
        ...buildPagination(page, limit),
      }),
    ]);

    return toPaginated(
      members.map((item) => this.toListItem(item)),
      total,
      page,
      limit,
    );
  }

  async remove(idChurch: number, id: number): Promise<void> {
    const boardMember = await this.prisma.boardMember.findFirst({
      where: { id, board: { idChurch } },
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
      boardRoleType: { select: { id: true, name: true } },
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
      boardRoleType: { select: { id: true, name: true } },
    };
  }

  private toListItem(
    record: BoardMemberListRecord,
  ): BoardMemberListItemResponseDto {
    return {
      id: record.id,
      member: this.toMemberSummary(record.member),
      role: this.toRole(record.boardRoleType),
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
      role: this.toRole(record.boardRoleType),
      startDate: record.startDate,
      endDate: record.endDate,
      active: record.active,
    };
  }

  private toRole(
    role: BoardMemberDetailRecord['boardRoleType'],
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
