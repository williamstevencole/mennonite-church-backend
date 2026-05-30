import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BoardRoleType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  buildPagination,
  toPaginated,
} from '../../common/pagination/paginate.util';
import { IdNameResponseDto } from '../../common/dto/id-name-response.dto';
import { CreateBoardRoleTypeDto } from './dto/create-board-role-type.dto';
import { ListBoardRoleTypesQueryDto } from './dto/list-board-role-types-query.dto';
import { BoardRoleTypeResponseDto } from './dto/board-role-type.response.dto';
import { BoardRoleTypesPageResponseDto } from './dto/board-role-types-page.response.dto';
import { UpdateBoardRoleTypeDto } from './dto/update-board-role-type.dto';

@Injectable()
export class BoardRoleTypesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    idChurch: number,
    dto: CreateBoardRoleTypeDto,
  ): Promise<IdNameResponseDto> {
    await this.assertBoardInChurch(idChurch, dto.idBoard);

    const duplicate = await this.prisma.boardRoleType.findFirst({
      where: {
        idBoard: dto.idBoard,
        name: { equals: dto.name.trim(), mode: 'insensitive' },
      },
      select: { id: true },
    });

    if (duplicate) {
      throw new ConflictException(
        `Ya existe un cargo con el nombre "${dto.name}" en este concilio`,
      );
    }

    const created = await this.prisma.boardRoleType.create({
      data: {
        idBoard: dto.idBoard,
        name: dto.name,
      },
      select: { id: true, name: true },
    });

    return { id: created.id, name: created.name };
  }

  async findAll(
    idChurch: number,
    query: ListBoardRoleTypesQueryDto,
  ): Promise<BoardRoleTypesPageResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.BoardRoleTypeWhereInput = {
      board: { idChurch },
    };

    if (query.idBoard !== undefined) {
      where.idBoard = query.idBoard;
    }

    if (query.active !== undefined) {
      where.active = query.active;
    } else if (query.includeInactive !== true) {
      where.active = true;
    }

    if (query.q) {
      where.name = { contains: query.q, mode: 'insensitive' };
    }

    const [total, items] = await this.prisma.$transaction([
      this.prisma.boardRoleType.count({ where }),
      this.prisma.boardRoleType.findMany({
        where,
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        ...buildPagination(page, limit),
      }),
    ]);

    return toPaginated(
      items.map((item) => this.toResponse(item)),
      total,
      page,
      limit,
    );
  }

  async findOne(
    idChurch: number,
    id: number,
    includeInactive = false,
  ): Promise<BoardRoleTypeResponseDto> {
    const item = await this.prisma.boardRoleType.findFirst({
      where: {
        id,
        board: { idChurch },
        ...(includeInactive ? {} : { active: true }),
      },
    });

    if (!item) {
      throw new NotFoundException();
    }

    return this.toResponse(item);
  }

  async update(
    idChurch: number,
    id: number,
    dto: UpdateBoardRoleTypeDto,
  ): Promise<IdNameResponseDto> {
    const existing = await this.prisma.boardRoleType.findFirst({
      where: { id, board: { idChurch } },
      select: { id: true, idBoard: true },
    });

    if (!existing) {
      throw new NotFoundException();
    }

    if (dto.name !== undefined) {
      const duplicate = await this.prisma.boardRoleType.findFirst({
        where: {
          idBoard: existing.idBoard,
          name: { equals: dto.name.trim(), mode: 'insensitive' },
          NOT: { id },
        },
        select: { id: true },
      });

      if (duplicate) {
        throw new ConflictException(
          `Ya existe un cargo con el nombre "${dto.name}" en este concilio`,
        );
      }
    }

    const updated = await this.prisma.boardRoleType.update({
      where: { id },
      data: {
        name: dto.name,
        active: dto.active,
      },
      select: { id: true, name: true },
    });

    return { id: updated.id, name: updated.name };
  }

  async remove(idChurch: number, id: number): Promise<void> {
    const existing = await this.prisma.boardRoleType.findFirst({
      where: { id, board: { idChurch } },
      select: { id: true, active: true },
    });

    if (!existing) {
      throw new NotFoundException();
    }

    if (!existing.active) {
      return;
    }

    await this.prisma.boardRoleType.update({
      where: { id },
      data: { active: false },
    });
  }

  private async assertBoardInChurch(
    idChurch: number,
    idBoard: number,
  ): Promise<void> {
    const board = await this.prisma.board.findFirst({
      where: { id: idBoard, idChurch },
      select: { id: true },
    });

    if (!board) {
      throw new NotFoundException();
    }
  }

  private toResponse(entity: BoardRoleType): BoardRoleTypeResponseDto {
    return {
      id: entity.id,
      idBoard: entity.idBoard,
      name: entity.name,
      active: entity.active,
    };
  }
}
