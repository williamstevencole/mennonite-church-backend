import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TransactionCategory } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTransactionCategoryDto } from './dto/create-transaction-category.dto';
import { ListTransactionCategoriesQueryDto } from './dto/list-transaction-categories-query.dto';
import { TransactionCategoryResponseDto } from './dto/transaction-category.response.dto';
import { UpdateTransactionCategoryDto } from './dto/update-transaction-category.dto';
import { TransactionCategoryType } from './transaction-category-type.enum';

@Injectable()
export class TransactionCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateTransactionCategoryDto,
  ): Promise<TransactionCategoryResponseDto> {
    await this.assertUnique(dto.name, dto.type);

    const created = await this.prisma.transactionCategory.create({
      data: { name: dto.name, type: dto.type },
    });

    return this.toResponse(created);
  }

  async findAll(
    query: ListTransactionCategoriesQueryDto,
  ): Promise<TransactionCategoryResponseDto[]> {
    const where: Prisma.TransactionCategoryWhereInput = { active: true };
    if (query.type) {
      where.type = query.type;
    }

    const items = await this.prisma.transactionCategory.findMany({
      where,
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });

    return items.map((item) => this.toResponse(item));
  }

  async findOne(id: number): Promise<TransactionCategoryResponseDto> {
    const item = await this.prisma.transactionCategory.findUnique({
      where: { id },
    });
    if (!item) {
      throw new NotFoundException(`Categoria ${id} no encontrada`);
    }
    return this.toResponse(item);
  }

  async update(
    id: number,
    dto: UpdateTransactionCategoryDto,
  ): Promise<TransactionCategoryResponseDto> {
    const current = await this.prisma.transactionCategory.findUnique({
      where: { id },
    });

    if (!current) {
      throw new NotFoundException(`Categoria ${id} no encontrada`);
    }

    const nextName = dto.name ?? current.name;
    const nextType = (dto.type ?? current.type) as TransactionCategoryType;

    if (dto.name || dto.type) {
      await this.assertUnique(nextName, nextType, id);
    }

    const updated = await this.prisma.transactionCategory.update({
      where: { id },
      data: { name: dto.name, type: dto.type },
    });

    return this.toResponse(updated);
  }

  async remove(id: number): Promise<void> {
    const existing = await this.prisma.transactionCategory.findUnique({
      where: { id },
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
    name: string,
    type: TransactionCategoryType,
    excludeId?: number,
  ): Promise<void> {
    const duplicate = await this.prisma.transactionCategory.findUnique({
      where: { name_type: { name, type } },
      select: { id: true },
    });

    if (duplicate && duplicate.id !== excludeId) {
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
