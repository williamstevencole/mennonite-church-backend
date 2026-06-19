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
import { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import {
  CreateInventoryMovementDto,
  InventoryMovementType,
} from './dto/create-inventory-movement.dto';
import { FindInventoryMovementsQueryDto } from './dto/find-inventory.query.dto';
import { UpdateInventoryMovementDto } from './dto/update-inventory-movement.dto';
import { IdResponseDto } from '../../common/dto/id-response.dto';

const userPublicSelect = {
  id: true,
  email: true,
} as const;

const MOVEMENT_DETAIL_SELECT = {
  id: true,
  type: true,
  quantity: true,
  datetime: true,
  documentNumber: true,
  article: {
    select: {
      id: true,
      name: true,
      code: true,
      unitCost: true,
    },
  },
  user: {
    select: userPublicSelect,
  },
} satisfies Prisma.InventoryMovementSelect;

type InventoryMovementDetail = Prisma.InventoryMovementGetPayload<{
  select: typeof MOVEMENT_DETAIL_SELECT;
}>;

@Injectable()
export class InventoryMovementsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateInventoryMovementDto,
    user: JwtPayload,
  ): Promise<IdResponseDto> {
    const idChurch = await this.getChurchId(user);

    const qty = Number(dto.quantity);

    if (qty <= 0) {
      throw new BadRequestException('Quantity tiene que ser mayor a 0');
    }

    const article = await this.prisma.article.findFirst({
      where: {
        id: dto.idArticle,
        idChurch,
        active: true,
      },
    });

    if (!article) {
      throw new NotFoundException('Articulo no fue encontrado');
    }

    return this.prisma.$transaction(async (tx) => {
      const stock = await this.getStock(dto.idArticle, idChurch, tx);

      if (dto.type === InventoryMovementType.Outbound && stock < qty) {
        throw new ConflictException('Stock insuficiente');
      }

      const movement = await tx.inventoryMovement.create({
        data: {
          idChurch,
          type: dto.type,
          documentNumber: dto.documentNumber ?? null,
          datetime: dto.datetime ? new Date(dto.datetime) : new Date(),
          idUser: user.sub,
          idArticle: dto.idArticle,
          quantity: qty,
          notes: dto.notes ?? null,
        },
        select: { id: true },
      });

      return { id: movement.id };
    });
  }

  private async getStock(
    idArticle: number,
    idChurch: number,
    tx: Prisma.TransactionClient,
  ): Promise<number> {
    const inbound = await tx.inventoryMovement.aggregate({
      where: {
        idArticle,
        idChurch,
        active: true,
        type: 'Inbound',
      },
      _sum: {
        quantity: true,
      },
    });

    const outbound = await tx.inventoryMovement.aggregate({
      where: {
        idArticle,
        idChurch,
        active: true,
        type: 'Outbound',
      },
      _sum: {
        quantity: true,
      },
    });

    return (
      Number(inbound._sum.quantity ?? 0) - Number(outbound._sum.quantity ?? 0)
    );
  }

  private async getChurchId(user: JwtPayload): Promise<number> {
    const userRecord = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: { idChurch: true },
    });

    if (!userRecord?.idChurch) {
      throw new BadRequestException('User not recognized');
    }

    return userRecord.idChurch;
  }

  async findAll(user: JwtPayload, query: FindInventoryMovementsQueryDto) {
    const idChurch = await this.getChurchId(user);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.InventoryMovementWhereInput = {
      idChurch,
      active: true,
    };

    if (query.type) {
      where.type = query.type;
    }

    if (query.articleId) {
      where.idArticle = query.articleId;
    }

    if (query.startDate || query.endDate) {
      where.datetime = {
        ...(query.startDate && { gte: new Date(query.startDate) }),
        ...(query.endDate && { lte: new Date(query.endDate) }),
      };
    }

    const [total, items] = await this.prisma.$transaction([
      this.prisma.inventoryMovement.count({ where }),
      this.prisma.inventoryMovement.findMany({
        where,
        orderBy: {
          datetime: 'desc',
        },
        include: {
          article: true,
          user: { select: userPublicSelect },
        },
        ...buildPagination(page, limit),
      }),
    ]);

    return toPaginated(items, total, page, limit);
  }

  async findOne(id: number, user: JwtPayload) {
    const idChurch = await this.getChurchId(user);

    const movement: InventoryMovementDetail | null =
      await this.prisma.inventoryMovement.findFirst({
        where: {
          id,
          idChurch,
          active: true,
        },
        select: MOVEMENT_DETAIL_SELECT,
      });

    if (!movement) {
      throw new NotFoundException('Movement not found');
    }

    const { article, user: movementUser, ...rest } = movement;

    return {
      ...rest,
      quantity: Number(rest.quantity),
      user: movementUser,
      article: {
        id: article.id,
        name: article.name,
        code: article.code,
        unitCost: Number(article.unitCost),
      },
    };
  }

  async update(
    id: number,
    dto: UpdateInventoryMovementDto,
    user: JwtPayload,
  ): Promise<IdResponseDto> {
    const idChurch = await this.getChurchId(user);

    const movement = await this.prisma.inventoryMovement.findFirst({
      where: {
        id,
        idChurch,
        active: true,
      },
    });

    if (!movement) {
      throw new NotFoundException('Movement not found');
    }

    if (
      dto.quantity !== undefined ||
      dto.type !== undefined ||
      dto.idArticle !== undefined
    ) {
      throw new BadRequestException(
        'quantity, type y article no pueden ser modificados. Por favor, crear un nuevo movimiento.',
      );
    }

    const updated = await this.prisma.inventoryMovement.update({
      where: { id },
      data: {
        documentNumber: dto.documentNumber ?? movement.documentNumber,
        notes: dto.notes ?? movement.notes,
        datetime: dto.datetime ? new Date(dto.datetime) : movement.datetime,
      },
      select: { id: true },
    });

    return { id: updated.id };
  }

  async remove(id: number, user: JwtPayload) {
    const idChurch = await this.getChurchId(user);

    const movement = await this.prisma.inventoryMovement.findFirst({
      where: { id, idChurch },
    });

    if (!movement) {
      throw new NotFoundException('Movement not found');
    }

    if (!movement.active) {
      return;
    }

    // Soft delete: preserve the row's contents in audit_log so stock history
    // remains reconstructable from the audit trail.
    await this.prisma.$transaction([
      this.prisma.auditLog.create({
        data: {
          tableName: 'inventory_movement',
          recordId: movement.id,
          operation: 'DELETE',
          changedBy: user.sub,
          oldData: JSON.stringify({
            ...movement,
            quantity: Number(movement.quantity),
          }),
        },
      }),
      this.prisma.inventoryMovement.update({
        where: { id },
        data: { active: false },
      }),
    ]);
  }
}
