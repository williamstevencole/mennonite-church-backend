import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { IdNameResponseDto } from '../../common/dto/id-name-response.dto';
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
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
  Patch,
  Delete,
} from '@nestjs/common';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import { CreateArticleDto } from './dto/create-article.dto';
import { ArticleResponseDto } from './dto/article.response.dto';
import { ArticleBalanceResponseDto } from './dto/article-balance.response.dto';
import { ArticlesSummaryResponseDto } from './dto/articles-summary.response.dto';
import { FindArticlesQueryDto } from './dto/find-articles.query.dto';
import { ArticlesService } from './articles.service';
import { ArticlesPageResponseDto } from './dto/articles-page.response.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

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
  @ApiCreatedResponse({ type: IdNameResponseDto })
  @ApiBadRequestResponse({
    description: 'Datos invalidos para crear articulo',
  })
  @ApiConflictResponse({ description: 'Nombre duplicado' })
  create(
    @Body() dto: CreateArticleDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<IdNameResponseDto> {
    return this.service.create(dto, user);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @Permissions('inventory.read')
  @ApiOperation({ summary: 'Listar articulos con filtros' })
  @ApiOkResponse({ type: ArticlesPageResponseDto })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: FindArticlesQueryDto,
  ): Promise<ArticlesPageResponseDto> {
    return this.service.findAll(user, query);
  }

  @Get('summary')
  @HttpCode(HttpStatus.OK)
  @Permissions('inventory.read')
  @ApiOperation({
    summary:
      'Totales del inventario (cantidad de articulos activos, valor total y total de movimientos)',
  })
  @ApiOkResponse({ type: ArticlesSummaryResponseDto })
  getSummary(
    @CurrentUser() user: JwtPayload,
  ): Promise<ArticlesSummaryResponseDto> {
    return this.service.getSummary(user);
  }

  @Get(':id/balance')
  @HttpCode(HttpStatus.OK)
  @Permissions('inventory.read')
  @ApiOperation({
    summary:
      'Saldo actual del artículo (suma de inventory_movement Inbound - Outbound)',
  })
  @ApiOkResponse({ type: ArticleBalanceResponseDto })
  @ApiNotFoundResponse({ description: 'Articulo no encontrado' })
  getBalance(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ArticleBalanceResponseDto> {
    return this.service.getBalance(user, id);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @Permissions('inventory.read')
  @ApiOperation({ summary: 'Obtener articulo por ID' })
  @ApiOkResponse({ type: ArticleResponseDto })
  @ApiNotFoundResponse({ description: 'Articulo no encontrado' })
  findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Query('includeInactive') includeInactive?: string,
  ): Promise<ArticleResponseDto> {
    return this.service.findOne(user, id, includeInactive === 'true');
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @Permissions('inventory.update')
  @ApiOperation({ summary: 'Actualizar articulo' })
  @ApiOkResponse({ type: IdNameResponseDto })
  @ApiNotFoundResponse({ description: 'Articulo no encontrado' })
  @ApiConflictResponse({
    description: 'Ya existe un articulo con ese codigo',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateArticleDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<IdNameResponseDto> {
    return this.service.update(id, dto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('inventory.delete')
  @ApiOperation({ summary: 'Retirar articulo del inventario' })
  @ApiNotFoundResponse({ description: 'Articulo no encontrado' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.service.remove(id, user);
  }
}
