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
import { BudgetDistributionsService } from './budget-distributions.service';
import { BudgetDistributionResponseDto } from './dto/budget-distribution.response.dto';
import { IdResponseDto } from '../../common/dto/id-response.dto';
import { CreateBudgetDistributionDto } from './dto/create-budget-distribution.dto';
import { UpdateBudgetDistributionDto } from './dto/update-budget-distribution.dto';

@ApiTags('Budget Distributions')
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'JWT invalido, requerido o vencido' })
@ApiForbiddenResponse({ description: 'Faltan permisos requeridos' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('budget-distributions')
export class BudgetDistributionsController {
  constructor(
    private readonly budgetDistributionsService: BudgetDistributionsService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions('budgets.create')
  @ApiOperation({
    summary: 'Crear una distribución de monto anual para un ministerio',
  })
  @ApiCreatedResponse({ type: IdResponseDto })
  @ApiBadRequestResponse({
    description:
      'Payload invalido o monto anual excede el techo de la categoría Ministerios',
  })
  @ApiNotFoundResponse({
    description: 'Presupuesto o ministerio no encontrado',
  })
  @ApiConflictResponse({
    description:
      'Ya existe una distribución para este ministerio en el presupuesto',
  })
  create(
    @Body() dto: CreateBudgetDistributionDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<IdResponseDto> {
    return this.budgetDistributionsService.create(user.idChurch, user.sub, dto);
  }

  @Get(':id')
  @Permissions('budgets.read')
  @ApiOperation({ summary: 'Obtener detalle de una distribución' })
  @ApiOkResponse({ type: BudgetDistributionResponseDto })
  @ApiNotFoundResponse({ description: 'Distribución no encontrada' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<BudgetDistributionResponseDto> {
    return this.budgetDistributionsService.findOne(user.idChurch, id);
  }

  @Patch(':id')
  @Permissions('budgets.update')
  @ApiOperation({ summary: 'Actualizar el monto anual de una distribución' })
  @ApiOkResponse({ type: IdResponseDto })
  @ApiBadRequestResponse({
    description:
      'Payload invalido o monto anual excede el techo de la categoría Ministerios',
  })
  @ApiNotFoundResponse({ description: 'Distribución no encontrada' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBudgetDistributionDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<IdResponseDto> {
    return this.budgetDistributionsService.update(user.idChurch, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions('budgets.delete')
  @ApiOperation({ summary: 'Eliminar una distribución de un presupuesto' })
  @ApiNoContentResponse({ description: 'Distribución eliminada' })
  @ApiBadRequestResponse({
    description:
      'No se puede eliminar una distribución de un presupuesto cerrado',
  })
  @ApiNotFoundResponse({ description: 'Distribución no encontrada' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ): Promise<void> {
    return this.budgetDistributionsService.remove(user.idChurch, id);
  }
}
