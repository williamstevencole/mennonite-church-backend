import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Article } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  buildPagination,
  toPaginated,
} from '../../common/pagination/paginate.util';

import { ArticleResponseDto } from './dto/article.response.dto';
import { ArticleBalanceResponseDto } from './dto/article-balance.response.dto';
import { CreateArticleDto } from './dto/create-article.dto';
import { FindArticlesQueryDto } from './dto/find-articles.query.dto';
import { ArticlesPageResponseDto } from './dto/articles-page.response.dto';
import { IdNameResponseDto } from '../../common/dto/id-name-response.dto';

import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import { UpdateArticleDto } from './dto/update-article.dto';

@Injectable()
export class ArticlesService {
  constructor(private readonly prisma: PrismaService) {}

  private async getChurchId(user: JwtPayload): Promise<number> {
    const userRecord = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: { idChurch: true },
    });

    if (!userRecord?.idChurch) {
      throw new BadRequestException('Usuario no reconocido');
    }

    return userRecord.idChurch;
  }

  async create(
    dto: CreateArticleDto,
    user: JwtPayload,
  ): Promise<IdNameResponseDto> {
    const idChurch = await this.getChurchId(user);

    const existing = await this.prisma.article.findFirst({
      where: {
        idChurch,
        code: dto.code,
      },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException(
        `Ya existe un articulo con el codigo "${dto.code}"`,
      );
    }

    const created = await this.prisma.article.create({
      data: {
        idChurch,
        name: dto.name,
        code: dto.code,
        description: dto.description ?? null,
        unitCost: dto.unitCost,
        brand: dto.brand ?? null,
        model: dto.model ?? null,
        createdBy: user.sub,
      },
      select: { id: true, name: true },
    });

    return { id: created.id, name: created.name };
  }

  async findAll(
    user: JwtPayload,
    query: FindArticlesQueryDto,
  ): Promise<ArticlesPageResponseDto> {
    const idChurch = await this.getChurchId(user);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.ArticleWhereInput = {
      idChurch,
    };

    if (query.active !== undefined) {
      where.active = query.active;
    } else if (query.includeInactive !== true) {
      where.active = true;
    }

    if (query.q) {
      where.OR = [
        { code: { contains: query.q, mode: 'insensitive' } },
        { name: { contains: query.q, mode: 'insensitive' } },
        { description: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await this.prisma.$transaction([
      this.prisma.article.count({ where }),
      this.prisma.article.findMany({
        where,
        orderBy: { id: 'desc' },
        ...buildPagination(page, limit),
      }),
    ]);

    return toPaginated(
      items.map((i) => this.toResponse(i)),
      total,
      page,
      limit,
    );
  }

  async findOne(
    user: JwtPayload,
    id: number,
    includeInactive = false,
  ): Promise<ArticleResponseDto> {
    const idChurch = await this.getChurchId(user);

    const article = await this.prisma.article.findFirst({
      where: {
        id,
        idChurch,
        ...(includeInactive ? {} : { active: true }),
      },
    });

    if (!article) {
      throw new NotFoundException('Articulo no encontrado');
    }

    return this.toResponse(article);
  }

  async getBalance(
    user: JwtPayload,
    id: number,
  ): Promise<ArticleBalanceResponseDto> {
    const idChurch = await this.getChurchId(user);

    const article = await this.prisma.article.findFirst({
      where: { id, idChurch },
      select: { id: true },
    });

    if (!article) {
      throw new NotFoundException('Articulo no encontrado');
    }

    const grouped = await this.prisma.inventoryMovement.groupBy({
      by: ['type'],
      where: { idArticle: id, idChurch },
      _sum: { quantity: true },
    });

    let totalInbound = 0;
    let totalOutbound = 0;
    for (const row of grouped) {
      const qty = row._sum.quantity !== null ? Number(row._sum.quantity) : 0;
      if (row.type === 'Inbound') totalInbound += qty;
      else if (row.type === 'Outbound') totalOutbound += qty;
    }

    return {
      idArticle: id,
      balance: totalInbound - totalOutbound,
      totalInbound,
      totalOutbound,
    };
  }

  private toResponse(entity: Article): ArticleResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      code: entity.code,
      description: entity.description ?? '',
      unitCost: Number(entity.unitCost),
      brand: entity.brand ?? undefined,
      model: entity.model ?? undefined,
    };
  }

  async update(
    id: number,
    dto: UpdateArticleDto,
    user: JwtPayload,
  ): Promise<IdNameResponseDto> {
    const idChurch = await this.getChurchId(user);

    const existing = await this.prisma.article.findFirst({
      where: {
        id,
        idChurch,
      },
    });

    if (!existing) {
      throw new NotFoundException('Articulo no encontrado');
    }

    if (dto.code !== undefined && dto.code !== existing.code) {
      const duplicate = await this.prisma.article.findFirst({
        where: { idChurch, code: dto.code, NOT: { id } },
        select: { id: true },
      });
      if (duplicate) {
        throw new ConflictException(
          `Ya existe un articulo con el codigo "${dto.code}"`,
        );
      }
    }

    const updated = await this.prisma.article.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.code !== undefined && { code: dto.code }),
        ...(dto.description !== undefined && {
          description: dto.description,
        }),
        ...(dto.unitCost !== undefined && {
          unitCost: dto.unitCost,
        }),
        ...(dto.brand !== undefined && {
          brand: dto.brand,
        }),
        ...(dto.model !== undefined && {
          model: dto.model,
        }),
      },
      select: { id: true, name: true },
    });

    return { id: updated.id, name: updated.name };
  }

  async remove(id: number, user: JwtPayload): Promise<void> {
    const idChurch = await this.getChurchId(user);

    const article = await this.prisma.article.findFirst({
      where: {
        id,
        idChurch,
      },
    });

    if (!article) {
      throw new NotFoundException('Articulo no encontrado');
    }

    // idempotente: si ya está inactivo igual responde 204
    if (!article.active) {
      return;
    }

    await this.prisma.article.update({
      where: { id },
      data: {
        active: false,
      },
    });
  }
}
