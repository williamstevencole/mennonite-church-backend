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
import type { JwtPayload } from '../../auth/strategies/jwt.strategy';

@Injectable()
export class ArticlesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateArticleDto,
    user: JwtPayload,
  ): Promise<ArticleResponseDto> {
    const userRecord = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: { idChurch: true },
    });

    if (!userRecord?.idChurch) {
      throw new BadRequestException('Usuario no encontrado o sin iglesia');
    }

    try {
      const created = await this.prisma.article.create({
        data: {
          idChurch: userRecord.idChurch,
          name: dto.name,
          code: dto.code,
          description: dto.description ?? null,
          unitCost: dto.unitCost,
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
  ): Promise<ArticleResponseDto[]> {
    const userRecord = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: { idChurch: true },
    });

    if (!userRecord?.idChurch) {
      throw new BadRequestException('Usuario no reconocido');
    }

    const where: Prisma.ArticleWhereInput = {
      idChurch: userRecord.idChurch,
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

    const articles = await this.prisma.article.findMany({ where });

    return articles.map((article) => this.toResponse(article));
  }

  async findOne(user: JwtPayload, id: number): Promise<ArticleResponseDto> {
    const userRecord = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: { idChurch: true },
    });

    if (!userRecord?.idChurch) {
      throw new BadRequestException('Usuario no reconocido');
    }

    const article = await this.prisma.article.findFirst({
      where: {
        id,
        idChurch: userRecord.idChurch,
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
    };
  }
}
