import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Board, Prisma } from '@prisma/client';
import type { JwtPayload } from '../../auth/strategies/jwt.strategy';
import { PrismaService } from '../../prisma/prisma.service';
import { BoardMemberListItemResponseDto } from '../board-members/dto/board-member-list-item.response.dto';
import { BoardMemberMemberSummaryResponseDto } from '../board-members/dto/board-member-member-summary.response.dto';
import { BoardMemberRoleResponseDto } from '../board-members/dto/board-member-role.response.dto';
import { BoardDetailResponseDto } from './dto/board-detail.response.dto';
import { BoardListItemResponseDto } from './dto/board-list-item.response.dto';
import { ListBoardsQueryDto } from './dto/list-boards-query.dto';

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
