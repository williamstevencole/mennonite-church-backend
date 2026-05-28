import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Article } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

import { ArticleResponseDto } from './dto/article.response.dto';
import { CreateArticleDto } from './dto/create-article.dto';
import { FindArticlesQueryDto } from './dto/find-articles.query.dto';
import { ArticlesPageResponseDto } from './dto/articles-page.response.dto';

import type { JwtPayload } from '../../auth/strategies/jwt.strategy';
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
  ): Promise<ArticleResponseDto> {
    const idChurch = await this.getChurchId(user);

    try {
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
      });

      return this.toResponse(created);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Ya existe un articulo con ese codigo');
      }

      throw error;
    }
  }

  async findAll(
    user: JwtPayload,
    query: FindArticlesQueryDto,
  ): Promise<ArticlesPageResponseDto> {
    const idChurch = await this.getChurchId(user);

    const page = query.page ?? 1;
    const size = query.size ?? 20;

    const skip = (page - 1) * size;
    const take = size;

    const where: Prisma.ArticleWhereInput = {
      idChurch,
    };

    if (query.active !== undefined) {
      where.active = query.active;
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
        skip,
        take,
      }),
    ]);

    return {
      data: items.map((i) => this.toResponse(i)),
      total,
      page,
      size,
    };
  }

  async findOne(user: JwtPayload, id: number): Promise<ArticleResponseDto> {
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

    return this.toResponse(article);
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
  ): Promise<ArticleResponseDto> {
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

    try {
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
      });

      return this.toResponse(updated);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Ya existe un articulo con ese codigo');
      }

      throw error;
    }
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
