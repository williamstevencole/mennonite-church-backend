import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Board, Prisma } from '@prisma/client';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { BoardMemberListItemResponseDto } from '../board-members/dto/board-member-list-item.response.dto';
import { BoardMemberMemberSummaryResponseDto } from '../board-members/dto/board-member-member-summary.response.dto';
import { BoardMemberRoleResponseDto } from '../board-members/dto/board-member-role.response.dto';
import { BoardCreatedResponseDto } from './dto/board-created.response.dto';
import { BoardDetailResponseDto } from './dto/board-detail.response.dto';
import { BoardListItemResponseDto } from './dto/board-list-item.response.dto';
import { BoardResponseDto } from './dto/board.response.dto';
import { CreateBoardDto } from './dto/create-board.dto';
import { ListBoardsQueryDto } from './dto/list-boards-query.dto';
import { UpdateBoardDto } from './dto/update-board.dto';

type BoardMemberListRecord = Prisma.BoardMemberGetPayload<{
  include: {
    member: { select: { id: true; name: true } };
    memberRoleType: { select: { id: true; name: true } };
  };
}>;

type BoardDetailRecord = Prisma.BoardGetPayload<{
  include: {
    boardMembers: {
      include: {
        member: { select: { id: true; name: true } };
        memberRoleType: { select: { id: true; name: true } };
      };
    };
  };
}>;

type BoardResponseRecord = Pick<
  Board,
  'id' | 'name' | 'description' | 'startDate' | 'endDate' | 'active'
>;

@Injectable()
export class BoardsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    user: JwtPayload,
    query: ListBoardsQueryDto,
  ): Promise<BoardListItemResponseDto[]> {
    const idChurch = await this.resolveChurchId(user);
    const where: Prisma.BoardWhereInput = { idChurch };

    if (query.active !== undefined) {
      where.active = query.active;
    }

    const boards = await this.prisma.board.findMany({
      where,
      orderBy: [{ startDate: 'desc' }, { id: 'asc' }],
    });

    return boards.map((board) => this.toListItem(board));
  }

  async create(
    dto: CreateBoardDto,
    user: JwtPayload,
  ): Promise<BoardCreatedResponseDto> {
    const idChurch = await this.resolveChurchId(user);
    const active = dto.active ?? true;
    const startDate = new Date(dto.start_date);
    const endDate = new Date(dto.end_date);

    if (endDate <= startDate) {
      throw new BadRequestException(
        'La fecha de fin debe ser posterior a la fecha de inicio',
      );
    }

    if (active) {
      await this.assertNoActiveBoard(idChurch);
    }

    const created = await this.prisma.board.create({
      data: {
        idChurch,
        name: dto.name,
        description: dto.description,
        startDate,
        endDate,
        active,
        createdBy: user.sub,
      },
      select: { id: true },
    });

    return { id: created.id };
  }

  async findOne(id: number, user: JwtPayload): Promise<BoardDetailResponseDto> {
    const idChurch = await this.resolveChurchId(user);
    const board = await this.prisma.board.findFirst({
      where: { id, idChurch },
      include: {
        boardMembers: {
          where: { assignmentType: 'board' },
          include: {
            member: { select: { id: true, name: true } },
            memberRoleType: { select: { id: true, name: true } },
          },
          orderBy: [{ member: { name: 'asc' } }, { id: 'asc' }],
        },
      },
    });

    if (!board) {
      throw new NotFoundException(`Concilio con id ${id} no encontrado`);
    }

    return this.toDetail(board);
  }

  async update(
    id: number,
    dto: UpdateBoardDto,
    user: JwtPayload,
  ): Promise<BoardResponseDto> {
    const idChurch = await this.resolveChurchId(user);
    const existing = await this.prisma.board.findFirst({
      where: { id, idChurch },
      select: {
        id: true,
        name: true,
        description: true,
        startDate: true,
        endDate: true,
        active: true,
      },
    });

    if (!existing) {
      throw new NotFoundException(`Concilio con id ${id} no encontrado`);
    }

    const data: Prisma.BoardUpdateInput = {};

    if (dto.name !== undefined) {
      data.name = dto.name;
    }

    if (dto.description !== undefined) {
      data.description = dto.description;
    }

    if (dto.start_date !== undefined) {
      data.startDate = new Date(dto.start_date);
    }

    if (dto.end_date !== undefined) {
      data.endDate = new Date(dto.end_date);
    }

    if (dto.active !== undefined) {
      data.active = dto.active;
    }

    const resolvedStartDate =
      dto.start_date !== undefined
        ? new Date(dto.start_date)
        : existing.startDate;
    const resolvedEndDate =
      dto.end_date !== undefined ? new Date(dto.end_date) : existing.endDate;

    if (resolvedEndDate <= resolvedStartDate) {
      throw new BadRequestException(
        'La fecha de fin debe ser posterior a la fecha de inicio',
      );
    }

    if (dto.active === true) {
      await this.assertNoActiveBoard(idChurch, id);
    }

    if (Object.keys(data).length === 0) {
      return this.toResponse(existing);
    }

    const updated = await this.prisma.board.update({
      where: { id },
      data,
    });

    return this.toResponse(updated);
  }

  async remove(id: number, user: JwtPayload): Promise<void> {
    const idChurch = await this.resolveChurchId(user);
    const existing = await this.prisma.board.findFirst({
      where: { id, idChurch },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException(`Concilio con id ${id} no encontrado`);
    }

    await this.prisma.$transaction([
      this.prisma.board.update({
        where: { id },
        data: { active: false },
      }),
      this.prisma.boardMember.updateMany({
        where: { idBoard: id, assignmentType: 'board', active: true },
        data: { active: false },
      }),
    ]);
  }

  private async resolveChurchId(user: JwtPayload): Promise<number> {
    const userRecord = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: { idChurch: true },
    });

    if (!userRecord?.idChurch) {
      throw new BadRequestException('Usuario no encontrado o sin iglesia');
    }

    return userRecord.idChurch;
  }

  private async assertNoActiveBoard(
    idChurch: number,
    excludeId?: number,
  ): Promise<void> {
    const activeBoard = await this.prisma.board.findFirst({
      where: {
        idChurch,
        active: true,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });

    if (activeBoard) {
      throw new ConflictException('Ya existe un concilio activo');
    }
  }

  private toListItem(entity: Board): BoardListItemResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      startDate: entity.startDate,
      endDate: entity.endDate,
      active: entity.active,
    };
  }

  private toDetail(entity: BoardDetailRecord): BoardDetailResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description ?? null,
      startDate: entity.startDate,
      endDate: entity.endDate,
      active: entity.active,
      members: entity.boardMembers.map((member) =>
        this.toBoardMemberListItem(member),
      ),
    };
  }

  private toResponse(entity: BoardResponseRecord): BoardResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description ?? null,
      startDate: entity.startDate,
      endDate: entity.endDate,
      active: entity.active,
    };
  }

  private toBoardMemberListItem(
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

  private toMemberSummary(
    member: BoardMemberListRecord['member'],
  ): BoardMemberMemberSummaryResponseDto {
    return {
      id: member.id,
      name: member.name,
    };
  }

  private toRole(
    role: BoardMemberListRecord['memberRoleType'],
  ): BoardMemberRoleResponseDto {
    return {
      id: role.id,
      name: role.name,
    };
  }
}
