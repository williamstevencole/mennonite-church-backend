import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { JwtPayload } from '../../auth/strategies/jwt.strategy';
import { CreateArticleDto } from './dto/create-article.dto';
import { ArticleResponseDto } from './dto/article.response.dto';
import { FindArticlesQueryDto } from './dto/find-articles.query.dto';
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

  @Get()
  @HttpCode(HttpStatus.OK)
  @Permissions('inventory.read')
  @ApiOperation({ summary: 'Obtener articulos con filtros' })
  @ApiOkResponse({ type: [ArticleResponseDto] })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: FindArticlesQueryDto,
  ): Promise<ArticleResponseDto[]> {
    return this.service.findAll(user, query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @Permissions('inventory.read')
  @ApiOperation({ summary: 'Obtener articulo por ID' })
  @ApiOkResponse({ type: ArticleResponseDto })
  findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<ArticleResponseDto> {
    return this.service.findOne(user, Number(id));
  }
}
