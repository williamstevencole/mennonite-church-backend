import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtPayload } from 'src/auth/strategies/jwt.strategy';
import {
  CreateInventoryMovementDto,
  InventoryMovementType,
} from './dto/create-inventory-movement.dto';
import { FindInventoryMovementsQueryDto } from './dto/find-inventory.query.dto';
import { UpdateInventoryMovementDto } from './dto/update-inventory-movement.dto';

@Injectable()
export class InventoryMovementsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateInventoryMovementDto, user: JwtPayload) {
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
        include: {
          article: true,
          user: true,
        },
      });

      return {
        id: movement.id,
        type: movement.type,
        quantity: Number(movement.quantity),
        documentNumber: movement.documentNumber,
        datetime: movement.datetime,
        article: movement.article,
        user: movement.user,
      };
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

    const where: Prisma.InventoryMovementWhereInput = {
      idChurch,
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

    return this.prisma.inventoryMovement.findMany({
      where,
      orderBy: {
        datetime: 'desc', // required by your spec
      },
      include: {
        article: true,
        user: true,
      },
    });
  }

  async findOne(id: number, user: JwtPayload) {
    const idChurch = await this.getChurchId(user);

    const movement = await this.prisma.inventoryMovement.findFirst({
      where: {
        id,
        idChurch,
      },
      select: {
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
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    if (!movement) {
      throw new NotFoundException('Movement not found');
    }

    return {
      ...movement,
      quantity: Number(movement.quantity),
      article: {
        ...movement.article,
        unitCost: Number(movement.article.unitCost),
      },
    };
  }

  async update(id: number, dto: UpdateInventoryMovementDto, user: JwtPayload) {
    const idChurch = await this.getChurchId(user);

    const movement = await this.prisma.inventoryMovement.findFirst({
      where: {
        id,
        idChurch,
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

    return this.prisma.inventoryMovement.update({
      where: { id },
      data: {
        documentNumber: dto.documentNumber ?? movement.documentNumber,
        notes: dto.notes ?? movement.notes,
        datetime: dto.datetime ? new Date(dto.datetime) : movement.datetime,
      },
      include: {
        article: true,
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });
  }
}
