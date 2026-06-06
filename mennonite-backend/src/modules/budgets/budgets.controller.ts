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
import { IdResponseDto } from '../../common/dto/id-response.dto';
import { BudgetsService } from './budgets.service';
import { BudgetCategoriesService } from '../budget-categories/budget-categories.service';
import { BudgetDistributionsService } from '../budget-distributions/budget-distributions.service';
import { CreateBudgetDto } from './dto/create-budget.dto';
import { UpdateBudgetDto } from './dto/update-budget.dto';
import { ListBudgetsQueryDto } from './dto/list-budgets-query.dto';
import { BudgetDetailResponseDto } from './dto/budget-detail.response.dto';
import { BudgetsPageResponseDto } from './dto/budgets-page.response.dto';
import { BudgetSummaryResponseDto } from './dto/budget-summary.response.dto';
import { FindBudgetCategoriesQueryDto } from '../budget-categories/dto/find-budget-categories-query.dto';
import { BudgetCategoriesPageResponseDto } from '../budget-categories/dto/budget-categories-page.response.dto';
import { FindBudgetDistributionsQueryDto } from '../budget-distributions/dto/find-budget-distribution.dto';
import { BudgetDistributionsPageResponseDto } from '../budget-distributions/dto/budget-distributions-page.response.dto';
import { BudgetDistributionsSummaryResponseDto } from '../budget-distributions/dto/budget-distributions-summary.response.dto';
import { BulkReplaceBudgetDistributionsDto } from '../budget-distributions/dto/bulk-replace-budget-distributions.dto';

@ApiTags('Budgets')
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'JWT invalido, requerido o vencido' })
@ApiForbiddenResponse({ description: 'Faltan permisos requeridos' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('budgets')
export class BudgetsController {
  constructor(
    private readonly service: BudgetsService,
    private readonly budgetCategoriesService: BudgetCategoriesService,
    private readonly budgetDistributionsService: BudgetDistributionsService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions('budgets.create')
  @ApiOperation({ summary: 'Crear nuevo presupuesto anual' })
  @ApiCreatedResponse({ type: IdResponseDto })
  @ApiBadRequestResponse({ description: 'Payload invalido' })
  @ApiConflictResponse({ description: 'Ya existe un presupuesto para ese año' })
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateBudgetDto,
  ): Promise<IdResponseDto> {
    return this.service.create(user.idChurch, user.sub, dto);
  }

  @Get()
  @Permissions('budgets.read')
  @ApiOperation({ summary: 'Listar presupuestos paginados' })
  @ApiOkResponse({ type: BudgetsPageResponseDto })
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: ListBudgetsQueryDto,
  ): Promise<BudgetsPageResponseDto> {
    return this.service.findAll(user.idChurch, query);
  }

  @Get(':id')
  @Permissions('budgets.read')
  @ApiOperation({ summary: 'Obtener detalle de un presupuesto' })
  @ApiOkResponse({ type: BudgetDetailResponseDto })
  @ApiNotFoundResponse({ description: 'Presupuesto no encontrado' })
  findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<BudgetDetailResponseDto> {
    return this.service.findOne(user.idChurch, id);
  }

  @Get(':id/categories')
  @Permissions('budgets.read')
  @ApiOperation({
    summary: 'Listar categorias del presupuesto con % derivado por bucket',
  })
  @ApiOkResponse({ type: BudgetCategoriesPageResponseDto })
  @ApiNotFoundResponse({ description: 'Presupuesto no encontrado' })
  findCategories(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Query() query: FindBudgetCategoriesQueryDto,
  ): Promise<BudgetCategoriesPageResponseDto> {
    return this.budgetCategoriesService.findByBudget(user.idChurch, id, query);
  }

  @Get(':id/summary')
  @Permissions('budgets.read')
  @ApiOperation({
    summary:
      'Resumen del presupuesto (mapea el cuadro del informe del cliente)',
  })
  @ApiOkResponse({ type: BudgetSummaryResponseDto })
  @ApiNotFoundResponse({ description: 'Presupuesto no encontrado' })
  getSummary(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<BudgetSummaryResponseDto> {
    return this.service.getSummary(user.idChurch, id);
  }

  @Get(':id/distributions/summary')
  @Permissions('budgets.read')
  @ApiOperation({
    summary:
      'Resumen del techo de distribuciones (sum vs MinisteriosCategory.annualAmount)',
  })
  @ApiOkResponse({ type: BudgetDistributionsSummaryResponseDto })
  @ApiNotFoundResponse({ description: 'Presupuesto no encontrado' })
  getDistributionsSummary(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<BudgetDistributionsSummaryResponseDto> {
    return this.budgetDistributionsService.getSummary(user.idChurch, id);
  }

  @Get(':id/distributions')
  @Permissions('budgets.read')
  @ApiOperation({
    summary:
      'Listar distribuciones del presupuesto con % derivado vs Ministerios',
  })
  @ApiOkResponse({ type: BudgetDistributionsPageResponseDto })
  @ApiNotFoundResponse({ description: 'Presupuesto no encontrado' })
  findDistributions(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Query() query: FindBudgetDistributionsQueryDto,
  ): Promise<BudgetDistributionsPageResponseDto> {
    return this.budgetDistributionsService.findByBudget(
      user.idChurch,
      id,
      query,
    );
  }

  @Post(':id/distributions/bulk')
  @HttpCode(HttpStatus.OK)
  @Permissions('budgets.update')
  @ApiOperation({
    summary: 'Reemplazar todas las distribuciones del presupuesto atómicamente',
  })
  @ApiOkResponse({ type: BudgetDistributionsPageResponseDto })
  @ApiBadRequestResponse({
    description: 'Suma excede el techo o ministerio invalido',
  })
  @ApiConflictResponse({ description: 'El presupuesto no esta en Draft' })
  @ApiNotFoundResponse({ description: 'Presupuesto no encontrado' })
  bulkReplaceDistributions(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: BulkReplaceBudgetDistributionsDto,
  ): Promise<BudgetDistributionsPageResponseDto> {
    return this.budgetDistributionsService.bulkReplace(
      user.idChurch,
      user.sub,
      id,
      dto,
    );
  }

  @Patch(':id')
  @Permissions('budgets.update')
  @ApiOperation({ summary: 'Actualizar descripcion del presupuesto' })
  @ApiOkResponse({ type: IdResponseDto })
  @ApiBadRequestResponse({ description: 'Payload invalido' })
  @ApiConflictResponse({ description: 'Presupuesto cerrado no modificable' })
  @ApiNotFoundResponse({ description: 'Presupuesto no encontrado' })
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBudgetDto,
  ): Promise<IdResponseDto> {
    return this.service.update(user.idChurch, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('budgets.delete')
  @ApiOperation({ summary: 'Eliminar presupuesto (solo borradores)' })
  @ApiNoContentResponse({ description: 'Presupuesto eliminado' })
  @ApiConflictResponse({ description: 'Solo se pueden eliminar borradores' })
  @ApiNotFoundResponse({ description: 'Presupuesto no encontrado' })
  async remove(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    await this.service.remove(user.idChurch, id);
  }

  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  @Permissions('budgets.update')
  @ApiOperation({ summary: 'Activar presupuesto (Draft → Active)' })
  @ApiOkResponse({ type: IdResponseDto })
  @ApiBadRequestResponse({
    description: 'Distribucion de porcentajes no suma 100',
  })
  @ApiConflictResponse({
    description: 'El presupuesto no esta en estado Draft',
  })
  @ApiNotFoundResponse({ description: 'Presupuesto no encontrado' })
  activate(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<IdResponseDto> {
    return this.service.activate(user.idChurch, id);
  }

  @Post(':id/close')
  @HttpCode(HttpStatus.OK)
  @Permissions('budgets.update')
  @ApiOperation({ summary: 'Cerrar presupuesto (Active → Closed)' })
  @ApiOkResponse({ type: IdResponseDto })
  @ApiConflictResponse({
    description: 'El presupuesto no esta en estado Active',
  })
  @ApiNotFoundResponse({ description: 'Presupuesto no encontrado' })
  close(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<IdResponseDto> {
    return this.service.close(user.idChurch, id);
  }
}
