import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TransactionCategory } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  buildPagination,
  toPaginated,
} from '../../common/pagination/paginate.util';
import { CreateTransactionCategoryDto } from './dto/create-transaction-category.dto';
import { ListTransactionCategoriesQueryDto } from './dto/list-transaction-categories-query.dto';
import { TransactionCategoriesPageResponseDto } from './dto/transaction-categories-page.response.dto';
import { TransactionCategoryResponseDto } from './dto/transaction-category.response.dto';
import { UpdateTransactionCategoryDto } from './dto/update-transaction-category.dto';
import { TransactionCategoryType } from './transaction-category-type.enum';
import { IdNameResponseDto } from '../../common/dto/id-name-response.dto';

@Injectable()
export class TransactionCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    idChurch: number,
    dto: CreateTransactionCategoryDto,
  ): Promise<IdNameResponseDto> {
    await this.assertUnique(idChurch, dto.name, dto.type);

    const created = await this.prisma.transactionCategory.create({
      data: { idChurch, name: dto.name, type: dto.type },
      select: { id: true, name: true },
    });

    return { id: created.id, name: created.name };
  }

  async findAll(
    idChurch: number,
    query: ListTransactionCategoriesQueryDto,
  ): Promise<TransactionCategoriesPageResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.TransactionCategoryWhereInput = { idChurch };
    if (query.includeInactive !== true) {
      where.active = true;
    }
    if (query.type) {
      where.type = query.type;
    }

    const [total, items] = await this.prisma.$transaction([
      this.prisma.transactionCategory.count({ where }),
      this.prisma.transactionCategory.findMany({
        where,
        orderBy: [{ type: 'asc' }, { name: 'asc' }],
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
  ): Promise<TransactionCategoryResponseDto> {
    const item = await this.prisma.transactionCategory.findFirst({
      where: {
        id,
        idChurch,
        ...(includeInactive ? {} : { active: true }),
      },
    });
    if (!item) {
      throw new NotFoundException(`Categoria ${id} no encontrada`);
    }
    return this.toResponse(item);
  }

  async update(
    idChurch: number,
    id: number,
    dto: UpdateTransactionCategoryDto,
  ): Promise<IdNameResponseDto> {
    const current = await this.prisma.transactionCategory.findFirst({
      where: { id, idChurch },
    });

    if (!current) {
      throw new NotFoundException(`Categoria ${id} no encontrada`);
    }

    const nextName = dto.name ?? current.name;
    const nextType = (dto.type ?? current.type) as TransactionCategoryType;

    if (dto.name || dto.type) {
      await this.assertUnique(idChurch, nextName, nextType, id);
    }

    const updated = await this.prisma.transactionCategory.update({
      where: { id },
      data: { name: dto.name, type: dto.type },
      select: { id: true, name: true },
    });

    return { id: updated.id, name: updated.name };
  }

  async remove(idChurch: number, id: number): Promise<void> {
    const existing = await this.prisma.transactionCategory.findFirst({
      where: { id, idChurch },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException(`Categoria ${id} no encontrada`);
    }

    const usageCount = await this.prisma.financialTransaction.count({
      where: { idCategory: id },
    });

    if (usageCount > 0) {
      throw new ConflictException(
        `No se puede eliminar: ${usageCount} transaccion(es) usan esta categoria`,
      );
    }

    await this.prisma.transactionCategory.update({
      where: { id },
      data: { active: false },
    });
  }

  private async assertUnique(
    idChurch: number,
    name: string,
    type: TransactionCategoryType,
    excludeId?: number,
  ): Promise<void> {
    const duplicate = await this.prisma.transactionCategory.findFirst({
      where: {
        idChurch,
        type,
        name: { equals: name.trim(), mode: 'insensitive' },
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });

    if (duplicate) {
      throw new ConflictException(
        `Ya existe una categoria "${name}" de tipo ${type}`,
      );
    }
  }

  private toResponse(
    entity: TransactionCategory,
  ): TransactionCategoryResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      type: entity.type as TransactionCategoryType,
      active: entity.active,
    };
  }
}
