import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CreateTransactionCategoryDto } from './dto/create-transaction-category.dto';
import { ListTransactionCategoriesQueryDto } from './dto/list-transaction-categories-query.dto';
import { TransactionCategoryResponseDto } from './dto/transaction-category.response.dto';
import { UpdateTransactionCategoryDto } from './dto/update-transaction-category.dto';
import { TransactionCategoriesService } from './transaction-categories.service';
import { IdResponseDto } from '../../common/dto/id-response.dto';

@ApiTags('Transaction Categories')
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'JWT invalido, requerido o vencido' })
@ApiForbiddenResponse({ description: 'Faltan permisos requeridos' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('transaction-categories')
export class TransactionCategoriesController {
  constructor(private readonly service: TransactionCategoriesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions('catalog.transaction-categories.manage')
  @ApiOperation({ summary: 'Crear categoria de transaccion' })
  @ApiCreatedResponse({ type: IdResponseDto })
  @ApiBadRequestResponse({ description: 'Payload invalido' })
  @ApiConflictResponse({
    description: 'Nombre duplicado dentro del mismo tipo',
  })
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateTransactionCategoryDto,
  ): Promise<IdResponseDto> {
    return this.service.create(user.idChurch, dto);
  }

  @Get()
  @Permissions('catalog.transaction-categories.read')
  @ApiOperation({
    summary: 'Listar categorias activas, opcionalmente filtradas por tipo',
  })
  @ApiOkResponse({ type: TransactionCategoryResponseDto, isArray: true })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListTransactionCategoriesQueryDto,
  ): Promise<TransactionCategoryResponseDto[]> {
    return this.service.findAll(user.idChurch, query);
  }

  @Get(':id')
  @Permissions('catalog.transaction-categories.read')
  @ApiOkResponse({ type: TransactionCategoryResponseDto })
  @ApiNotFoundResponse({ description: 'Categoria no encontrada' })
  findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<TransactionCategoryResponseDto> {
    return this.service.findOne(user.idChurch, id);
  }

  @Patch(':id')
  @Permissions('catalog.transaction-categories.manage')
  @ApiOkResponse({ type: IdResponseDto })
  @ApiBadRequestResponse({ description: 'Payload invalido' })
  @ApiConflictResponse({
    description: 'Nombre duplicado dentro del mismo tipo',
  })
  @ApiNotFoundResponse({ description: 'Categoria no encontrada' })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTransactionCategoryDto,
  ): Promise<IdResponseDto> {
    return this.service.update(user.idChurch, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('catalog.transaction-categories.manage')
  @ApiNoContentResponse({ description: 'Categoria eliminada' })
  @ApiConflictResponse({
    description: 'Existen transacciones que usan esta categoria',
  })
  @ApiNotFoundResponse({ description: 'Categoria no encontrada' })
  remove(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return this.service.remove(user.idChurch, id);
  }
}
