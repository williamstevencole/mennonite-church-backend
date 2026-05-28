import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';

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

import { InventoryMovementsService } from './inventory-movement.service';
import { CreateInventoryMovementDto } from './dto/create-inventory-movement.dto';

import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { Permissions } from 'src/common/decorators/permissions.decorator';
import type { JwtPayload } from '../../auth/strategies/jwt.strategy';

@ApiTags('Inventory Movements')
@ApiBearerAuth('JWT-auth')
@ApiUnauthorizedResponse({ description: 'JWT invalido o expirado' })
@ApiForbiddenResponse({ description: 'Faltan permisos requeridos' })
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('inventory-movements')
export class InventoryMovementsController {
  constructor(
    private readonly inventoryMovementsService: InventoryMovementsService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Permissions('inventory.create')
  @ApiOperation({ summary: 'Registrar movimiento de inventario' })
  @ApiCreatedResponse({ description: 'Movimiento creado' })
  @ApiBadRequestResponse({ description: 'Cantidad invalida' })
  @ApiConflictResponse({ description: 'Stock insuficiente' })
  create(
    @Body() dto: CreateInventoryMovementDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.inventoryMovementsService.create(dto, user);
  }
}
