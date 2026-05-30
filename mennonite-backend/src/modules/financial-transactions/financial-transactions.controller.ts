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
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type { JwtPayload } from '../../auth/interfaces/jwt-payload.interface';
import { CreateFinancialTransactionDto } from './dto/create-financial-transaction.dto';
import { FinancialTransactionResponseDto } from './dto/financial-transaction.response.dto';
import { FinancialTransactionsPageResponseDto } from './dto/financial-transactions-page.response.dto';
import { ListFinancialTransactionsQueryDto } from './dto/list-financial-transactions-query.dto';
import { UpdateFinancialTransactionDto } from './dto/update-financial-transaction.dto';
import { FinancialTransactionsService } from './financial-transactions.service';

@ApiTags('Financial Transactions')
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'JWT invalido, requerido o vencido' })
@ApiForbiddenResponse({ description: 'Faltan permisos requeridos' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('financial-transactions')
export class FinancialTransactionsController {
  constructor(private readonly service: FinancialTransactionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions('finance.create')
  @ApiOperation({ summary: 'Crear transaccion financiera' })
  @ApiCreatedResponse({ type: FinancialTransactionResponseDto })
  @ApiBadRequestResponse({
    description: 'Payload invalido o referencias inexistentes',
  })
  @ApiConflictResponse({ description: 'Año cerrado para esta iglesia' })
  create(
    @Body() dto: CreateFinancialTransactionDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<FinancialTransactionResponseDto> {
    return this.service.create(dto, user?.sub);
  }

  @Get()
  @Permissions('finance.read')
  @ApiOperation({
    summary:
      'Listar transacciones financieras con filtros (type, year, month, category, ministry) y paginacion',
  })
  @ApiOkResponse({ type: FinancialTransactionsPageResponseDto })
  @ApiBadRequestResponse({ description: 'Filtros invalidos' })
  findAll(
    @Query() query: ListFinancialTransactionsQueryDto,
  ): Promise<FinancialTransactionsPageResponseDto> {
    return this.service.findAll(query);
  }

  @Get(':id')
  @Permissions('finance.read')
  @ApiOperation({ summary: 'Obtener detalle de transaccion financiera' })
  @ApiOkResponse({ type: FinancialTransactionResponseDto })
  @ApiNotFoundResponse({ description: 'Transaccion no encontrada' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<FinancialTransactionResponseDto> {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @Permissions('finance.update')
  @ApiOperation({ summary: 'Actualizar transaccion financiera' })
  @ApiOkResponse({ type: FinancialTransactionResponseDto })
  @ApiBadRequestResponse({
    description: 'Payload invalido o referencias inexistentes',
  })
  @ApiConflictResponse({ description: 'Año cerrado para esta iglesia' })
  @ApiNotFoundResponse({ description: 'Transaccion no encontrada' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFinancialTransactionDto,
  ): Promise<FinancialTransactionResponseDto> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('finance.delete')
  @ApiOperation({ summary: 'Eliminar transaccion financiera' })
  @ApiNoContentResponse({ description: 'Transaccion eliminada' })
  @ApiConflictResponse({ description: 'Año cerrado para esta iglesia' })
  @ApiNotFoundResponse({ description: 'Transaccion no encontrada' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.service.remove(id);
  }
}
