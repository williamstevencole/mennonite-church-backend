import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Controller, UseGuards } from '@nestjs/common';
import { Body, HttpCode, HttpStatus, Post } from '@nestjs/common';
import type { JwtPayload } from '../../auth/strategies/jwt.strategy';
import { CreateArticleDto } from './dto/create-article.dto';
import { ArticleResponseDto } from './dto/article.response.dto';
import { ArticlesService } from './articles.service';

@ApiTags('Articles')
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'JWT invalido, requerido o vencido' })
@ApiForbiddenResponse({ description: 'Faltan permisos requeridos' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('articles')
export class ArticlesController {
  constructor(private readonly service: ArticlesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions('inventory.create')
  @ApiOperation({ summary: 'Crear un articulo' })
  @ApiCreatedResponse({ type: ArticleResponseDto })
  @ApiBadRequestResponse({
    description: 'Datos invalidos para crear articulo',
  })
  @ApiConflictResponse({ description: 'Nombre duplicado' })
  create(
    @Body() dto: CreateArticleDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<ArticleResponseDto> {
    return this.service.create(dto, user);
  }
}
