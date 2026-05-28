import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FinancialTransaction, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { TransactionCategoryType } from '../transaction-categories/transaction-category-type.enum';
import {
  CreateFinancialTransactionDto,
  PaymentMethod,
  ReceiptType,
} from './dto/create-financial-transaction.dto';
import { FinancialTransactionResponseDto } from './dto/financial-transaction.response.dto';
import { FinancialTransactionsPageResponseDto } from './dto/financial-transactions-page.response.dto';
import { ListFinancialTransactionsQueryDto } from './dto/list-financial-transactions-query.dto';
import { UpdateFinancialTransactionDto } from './dto/update-financial-transaction.dto';

type FinancialTransactionWithCategory = FinancialTransaction & {
  category?: { type: string } | null;
};

@Injectable()
export class FinancialTransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateFinancialTransactionDto,
    createdBy?: number,
  ): Promise<FinancialTransactionResponseDto> {
    await this.assertChurchExists(dto.idChurch);
    await this.assertCategoryExists(dto.idCategory);
    if (dto.idEvent !== undefined) await this.assertEventExists(dto.idEvent);
    if (dto.idMinistry !== undefined)
      await this.assertMinistryExists(dto.idMinistry);

    const transactionDate = new Date(dto.transactionDate);
    await this.assertYearOpen(dto.idChurch, transactionDate.getUTCFullYear());

    const created = await this.prisma.financialTransaction.create({
      data: {
        idChurch: dto.idChurch,
        idCategory: dto.idCategory,
        amount: new Prisma.Decimal(dto.amount),
        description: dto.description,
        transactionDate,
        paymentMethod: dto.paymentMethod,
        receiptType: dto.receiptType,
        receiptNumber: dto.receiptNumber,
        notes: dto.notes,
        idEvent: dto.idEvent,
        idMinistry: dto.idMinistry,
        createdBy,
      },
      include: { category: { select: { type: true } } },
    });

    return this.toResponse(created);
  }

  async findAll(
    query: ListFinancialTransactionsQueryDto,
  ): Promise<FinancialTransactionsPageResponseDto> {
    const page = query.page ?? 1;
    const size = query.size ?? 20;
    const where: Prisma.FinancialTransactionWhereInput = {};

    if (query.idChurch !== undefined) where.idChurch = query.idChurch;
    if (query.categoryId !== undefined) where.idCategory = query.categoryId;
    if (query.ministryId !== undefined) where.idMinistry = query.ministryId;
    if (query.type) where.category = { type: query.type };

    if (query.year !== undefined) {
      const year = query.year;
      if (query.month !== undefined) {
        const month = query.month;
        where.transactionDate = {
          gte: new Date(Date.UTC(year, month - 1, 1)),
          lt: new Date(Date.UTC(year, month, 1)),
        };
      } else {
        where.transactionDate = {
          gte: new Date(Date.UTC(year, 0, 1)),
          lt: new Date(Date.UTC(year + 1, 0, 1)),
        };
      }
    }

    const [total, items] = await this.prisma.$transaction([
      this.prisma.financialTransaction.count({ where }),
      this.prisma.financialTransaction.findMany({
        where,
        orderBy: [{ transactionDate: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * size,
        take: size,
        include: { category: { select: { type: true } } },
      }),
    ]);

    return {
      data: items.map((item) => this.toResponse(item)),
      total,
      page,
      size,
    };
  }

  async findOne(id: number): Promise<FinancialTransactionResponseDto> {
    const item = await this.prisma.financialTransaction.findUnique({
      where: { id },
      include: { category: { select: { type: true } } },
    });
    if (!item) {
      throw new NotFoundException(`Transaccion ${id} no encontrada`);
    }
    return this.toResponse(item);
  }

  async update(
    id: number,
    dto: UpdateFinancialTransactionDto,
  ): Promise<FinancialTransactionResponseDto> {
    const current = await this.prisma.financialTransaction.findUnique({
      where: { id },
    });
    if (!current) {
      throw new NotFoundException(`Transaccion ${id} no encontrada`);
    }

    const idChurch = dto.idChurch ?? current.idChurch;
    const currentYear = current.transactionDate.getUTCFullYear();
    await this.assertYearOpen(current.idChurch, currentYear);

    if (dto.idChurch !== undefined && dto.idChurch !== current.idChurch) {
      await this.assertChurchExists(dto.idChurch);
    }
    if (dto.idCategory !== undefined && dto.idCategory !== current.idCategory) {
      await this.assertCategoryExists(dto.idCategory);
    }
    if (dto.idEvent !== undefined && dto.idEvent !== current.idEvent) {
      await this.assertEventExists(dto.idEvent);
    }
    if (dto.idMinistry !== undefined && dto.idMinistry !== current.idMinistry) {
      await this.assertMinistryExists(dto.idMinistry);
    }

    let nextDate: Date | undefined;
    if (dto.transactionDate !== undefined) {
      nextDate = new Date(dto.transactionDate);
      const nextYear = nextDate.getUTCFullYear();
      if (nextYear !== currentYear || idChurch !== current.idChurch) {
        await this.assertYearOpen(idChurch, nextYear);
      }
    }

    const updated = await this.prisma.financialTransaction.update({
      where: { id },
      data: {
        idChurch: dto.idChurch,
        idCategory: dto.idCategory,
        amount:
          dto.amount !== undefined ? new Prisma.Decimal(dto.amount) : undefined,
        description: dto.description,
        transactionDate: nextDate,
        paymentMethod: dto.paymentMethod,
        receiptType: dto.receiptType,
        receiptNumber: dto.receiptNumber,
        notes: dto.notes,
        idEvent: dto.idEvent,
        idMinistry: dto.idMinistry,
      },
      include: { category: { select: { type: true } } },
    });

    return this.toResponse(updated);
  }

  async remove(id: number): Promise<void> {
    const existing = await this.prisma.financialTransaction.findUnique({
      where: { id },
      select: { id: true, idChurch: true, transactionDate: true },
    });
    if (!existing) {
      throw new NotFoundException(`Transaccion ${id} no encontrada`);
    }

    await this.assertYearOpen(
      existing.idChurch,
      existing.transactionDate.getUTCFullYear(),
    );

    await this.prisma.financialTransaction.delete({ where: { id } });
  }

  private async assertChurchExists(idChurch: number): Promise<void> {
    const exists = await this.prisma.church.findUnique({
      where: { id: idChurch },
      select: { id: true },
    });
    if (!exists) {
      throw new BadRequestException(`La iglesia con id ${idChurch} no existe`);
    }
  }

  private async assertCategoryExists(idCategory: number): Promise<void> {
    const exists = await this.prisma.transactionCategory.findUnique({
      where: { id: idCategory },
      select: { id: true },
    });
    if (!exists) {
      throw new BadRequestException(
        `La categoria con id ${idCategory} no existe`,
      );
    }
  }

  private async assertEventExists(idEvent: number): Promise<void> {
    const exists = await this.prisma.event.findUnique({
      where: { id: idEvent },
      select: { id: true },
    });
    if (!exists) {
      throw new BadRequestException(`El evento con id ${idEvent} no existe`);
    }
  }

  private async assertMinistryExists(idMinistry: number): Promise<void> {
    const exists = await this.prisma.ministry.findUnique({
      where: { id: idMinistry },
      select: { id: true },
    });
    if (!exists) {
      throw new BadRequestException(
        `El ministerio con id ${idMinistry} no existe`,
      );
    }
  }

  private async assertYearOpen(idChurch: number, year: number): Promise<void> {
    const closure = await this.prisma.periodClosure.findUnique({
      where: { idChurch_year: { idChurch, year } },
      select: { id: true },
    });
    if (closure) {
      throw new ConflictException(`Año ${year} ya cerrado para esta iglesia`);
    }
  }

  private toResponse(
    entity: FinancialTransactionWithCategory,
  ): FinancialTransactionResponseDto {
    return {
      id: entity.id,
      idChurch: entity.idChurch,
      idCategory: entity.idCategory,
      categoryType: entity.category
        ? (entity.category.type as TransactionCategoryType)
        : undefined,
      amount: Number(entity.amount),
      description: entity.description,
      transactionDate: entity.transactionDate.toISOString().slice(0, 10),
      paymentMethod: (entity.paymentMethod as PaymentMethod | null) ?? null,
      receiptType: (entity.receiptType as ReceiptType | null) ?? null,
      receiptNumber: entity.receiptNumber ?? null,
      notes: entity.notes ?? null,
      idEvent: entity.idEvent ?? null,
      idMinistry: entity.idMinistry ?? null,
      createdAt: entity.createdAt ? entity.createdAt.toISOString() : null,
      createdBy: entity.createdBy ?? null,
    };
  }
}
