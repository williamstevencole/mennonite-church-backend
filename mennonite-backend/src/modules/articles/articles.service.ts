import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { ArticleResponseDto } from './dto/article.response.dto';
import { CreateArticleDto } from './dto/create-article.dto';
import type { JwtPayload } from '../../auth/strategies/jwt.strategy';
import { Article } from '.prisma/client';

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
