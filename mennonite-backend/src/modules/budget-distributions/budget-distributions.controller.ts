import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiCreatedResponse, ApiConflictResponse, ApiBadRequestResponse } from '@nestjs/swagger';

import { BudgetDistributionService } from './budget-distributions.service';
import { CreateBudgetDistributionDto } from './dto/create-budget-distribution.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { Permissions } from 'src/common/decorators/permissions.decorator';
import type { JwtPayload } from 'src/auth/strategies/jwt.strategy';

@ApiTags('Budget Distributions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('budget-distributions')
export class BudgetDistributionController {
  constructor(private readonly service: BudgetDistributionService) {}

  @Post()
  @Permissions('budgets.create')
  @ApiCreatedResponse({ description: 'Creado' })
  @ApiConflictResponse({ description: 'Distribucion duplicada' })
  @ApiBadRequestResponse({ description: 'Porcentaje Total no puede exceder 100%' })
  create(
    @Body() dto: CreateBudgetDistributionDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.service.create(dto, user);
  }
}