import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Board, Prisma } from '@prisma/client';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import { PrismaService } from '../../prisma/prisma.service';
import {
  buildPagination,
  toPaginated,
} from '../../common/pagination/paginate.util';
import { BoardMemberListItemResponseDto } from '../board-members/dto/board-member-list-item.response.dto';
import { BoardMemberMemberSummaryResponseDto } from '../board-members/dto/board-member-member-summary.response.dto';
import { BoardMemberRoleResponseDto } from '../board-members/dto/board-member-role.response.dto';
import { BoardDetailResponseDto } from './dto/board-detail.response.dto';
import { BoardListItemResponseDto } from './dto/board-list-item.response.dto';
import { BoardsPageResponseDto } from './dto/boards-page.response.dto';
import { CreateBoardDto } from './dto/create-board.dto';
import { IdNameResponseDto } from '../../common/dto/id-name-response.dto';
import { ListBoardsQueryDto } from './dto/list-boards-query.dto';
import { UpdateBoardDto } from './dto/update-board.dto';

type BoardMemberListRecord = Prisma.BoardMemberGetPayload<{
  include: {
    member: { select: { id: true; name: true } };
    boardRoleType: { select: { id: true; name: true } };
  };
}>;

type BoardDetailRecord = Prisma.BoardGetPayload<{
  include: {
    boardMembers: {
      include: {
        member: { select: { id: true; name: true } };
        boardRoleType: { select: { id: true; name: true } };
      };
    };
  };
}>;

@Injectable()
export class BoardsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    user: JwtPayload,
    query: ListBoardsQueryDto,
  ): Promise<BoardsPageResponseDto> {
    const idChurch = await this.resolveChurchId(user);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.BoardWhereInput = { idChurch };

    if (query.active !== undefined) {
      where.active = query.active;
    } else if (query.includeInactive !== true) {
      where.active = true;
    }

    const [total, boards] = await this.prisma.$transaction([
      this.prisma.board.count({ where }),
      this.prisma.board.findMany({
        where,
        orderBy: [{ startDate: 'desc' }, { id: 'asc' }],
        ...buildPagination(page, limit),
      }),
    ]);

    return toPaginated(
      boards.map((board) => this.toListItem(board)),
      total,
      page,
      limit,
    );
  }

  async create(
    dto: CreateBoardDto,
    user: JwtPayload,
  ): Promise<IdNameResponseDto> {
    const idChurch = await this.resolveChurchId(user);
    const active = dto.active ?? true;
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (endDate <= startDate) {
      throw new BadRequestException(
        'La fecha de fin debe ser posterior a la fecha de inicio',
      );
    }

    if (active) {
      await this.assertNoActiveBoard(idChurch);
    }

    await this.assertNameUnique(idChurch, dto.name);

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
      select: { id: true, name: true },
    });

    return { id: created.id, name: created.name };
  }

  async findOne(
    id: number,
    user: JwtPayload,
    includeInactive = false,
  ): Promise<BoardDetailResponseDto> {
    const idChurch = await this.resolveChurchId(user);
    const board = await this.prisma.board.findFirst({
      where: {
        id,
        idChurch,
        ...(includeInactive ? {} : { active: true }),
      },
      include: {
        boardMembers: {
          include: {
            member: { select: { id: true, name: true } },
            boardRoleType: { select: { id: true, name: true } },
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
  ): Promise<IdNameResponseDto> {
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

    if (dto.name !== undefined && dto.name !== existing.name) {
      await this.assertNameUnique(idChurch, dto.name, id);
    }

    const data: Prisma.BoardUpdateInput = {};

    if (dto.name !== undefined) {
      data.name = dto.name;
    }

    if (dto.description !== undefined) {
      data.description = dto.description;
    }

    if (dto.startDate !== undefined) {
      data.startDate = new Date(dto.startDate);
    }

    if (dto.endDate !== undefined) {
      data.endDate = new Date(dto.endDate);
    }

    if (dto.active !== undefined) {
      data.active = dto.active;
    }

    const resolvedStartDate =
      dto.startDate !== undefined
        ? new Date(dto.startDate)
        : existing.startDate;
    const resolvedEndDate =
      dto.endDate !== undefined ? new Date(dto.endDate) : existing.endDate;

    if (resolvedEndDate <= resolvedStartDate) {
      throw new BadRequestException(
        'La fecha de fin debe ser posterior a la fecha de inicio',
      );
    }

    if (dto.active === true) {
      await this.assertNoActiveBoard(idChurch, id);
    }

    if (Object.keys(data).length === 0) {
      return { id: existing.id, name: existing.name };
    }

    const updated = await this.prisma.board.update({
      where: { id },
      data,
      select: { id: true, name: true },
    });

    return { id: updated.id, name: updated.name };
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
        where: { idBoard: id, active: true },
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
      select: { id: true, name: true },
    });

    if (activeBoard) {
      throw new ConflictException(
        `Ya existe un concilio activo (id=${activeBoard.id}, "${activeBoard.name}"). Finalizalo con DELETE /boards/${activeBoard.id} antes de crear uno nuevo.`,
      );
    }
  }

  private async assertNameUnique(
    idChurch: number,
    name: string,
    excludeId?: number,
  ): Promise<void> {
    const existing = await this.prisma.board.findFirst({
      where: {
        idChurch,
        name: { equals: name.trim(), mode: 'insensitive' },
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException(
        `Ya existe un concilio con el nombre "${name}"`,
      );
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

  private toBoardMemberListItem(
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

  private toMemberSummary(
    member: BoardMemberListRecord['member'],
  ): BoardMemberMemberSummaryResponseDto {
    return {
      id: member.id,
      name: member.name,
    };
  }

  private toRole(
    role: BoardMemberListRecord['boardRoleType'],
  ): BoardMemberRoleResponseDto {
    return {
      id: role.id,
      name: role.name,
    };
  }
}
